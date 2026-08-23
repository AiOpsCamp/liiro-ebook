"use strict";

const OPDSService = require("../services/opds.service");
const Story = require("../models/Story.model");

function getBaseUrl(req) {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:5012";
  return `${protocol}://${host}`;
}

exports.getOPDSRootCatalog = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const catalog = await OPDSService.getRootCatalogJSON(baseUrl);
    res.setHeader("Content-Type", "application/opds+json; charset=utf-8");
    res.status(200).json(catalog);
  } catch (error) {
    console.error("Error in getOPDSRootCatalog:", error);
    res.status(500).json({ success: false, message: "OPDS Catalog error", error: error.message });
  }
};

exports.getOPDSRootCatalogXML = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const stories = await Story.find({ isPublished: true }).limit(50).lean();
    const xml = OPDSService.formatAtomXML("Liiro Ebooks OPDS Feed", stories, baseUrl);
    res.setHeader("Content-Type", "application/atom+xml;profile=opds-catalog;charset=utf-8");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Error in getOPDSRootCatalogXML:", error);
    res.status(500).json({ success: false, message: "OPDS XML Catalog error", error: error.message });
  }
};

exports.getOPDSPublications = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const { page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageLimit = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * pageLimit;

    const [stories, total] = await Promise.all([
      Story.find({ isPublished: true }).skip(skip).limit(pageLimit).lean(),
      Story.countDocuments({ isPublished: true }),
    ]);

    const publications = stories.map((s) => OPDSService.formatPublication(s, baseUrl));

    const feed = {
      metadata: {
        title: "Liiro All Ebooks",
        numberOfItems: total,
        itemsPerPage: pageLimit,
        currentPage: pageNum,
      },
      links: [
        { rel: "self", href: `${baseUrl}/opds/v2/publications?page=${pageNum}`, type: "application/opds+json" },
        { rel: "first", href: `${baseUrl}/opds/v2/publications?page=1`, type: "application/opds+json" },
        ...(skip + pageLimit < total
          ? [{ rel: "next", href: `${baseUrl}/opds/v2/publications?page=${pageNum + 1}`, type: "application/opds+json" }]
          : []),
      ],
      publications,
    };

    res.setHeader("Content-Type", "application/opds+json; charset=utf-8");
    res.status(200).json(feed);
  } catch (error) {
    console.error("Error in getOPDSPublications:", error);
    res.status(500).json({ success: false, message: "OPDS Publications error", error: error.message });
  }
};

exports.getOPDSSearch = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({
        metadata: { title: "OPDS Search Results", numberOfItems: 0 },
        publications: [],
      });
    }

    const regex = new RegExp(q.trim(), "i");
    const stories = await Story.find({
      isPublished: true,
      $or: [{ title: regex }, { author: regex }, { category: regex }, { tags: regex }],
    })
      .limit(30)
      .lean();

    const publications = stories.map((s) => OPDSService.formatPublication(s, baseUrl));

    res.setHeader("Content-Type", "application/opds+json; charset=utf-8");
    res.status(200).json({
      metadata: {
        title: `Search Results for "${q}"`,
        numberOfItems: publications.length,
      },
      publications,
    });
  } catch (error) {
    console.error("Error in getOPDSSearch:", error);
    res.status(500).json({ success: false, message: "OPDS Search error", error: error.message });
  }
};
