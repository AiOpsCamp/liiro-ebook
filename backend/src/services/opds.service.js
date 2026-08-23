"use strict";

const Story = require("../models/Story.model");
const EbookCategory = require("../models/EbookCategory.model");
const EbookAuthor = require("../models/EbookAuthor.model");

/**
 * OPDS 2.0 (Open Publication Distribution System) Catalog Feed Engine
 * Enables e-readers (PocketBook, Kobo, Apple Books, Readium) to discover and browse Liiro Ebooks.
 */
class OPDSService {
  static getStr(field, fallback = "") {
    if (!field) return fallback;
    if (typeof field === "string") return field;
    if (typeof field === "object") return field.en || Object.values(field).find(Boolean) || fallback;
    return fallback;
  }

  /**
   * Root OPDS 2.0 Feed Catalog JSON
   */
  static async getRootCatalogJSON(baseUrl) {
    const [totalStories, categories, authors] = await Promise.all([
      Story.countDocuments({ isPublished: true }),
      EbookCategory.find({}).limit(10).lean(),
      EbookAuthor.find({}).limit(10).lean(),
    ]);

    const feed = {
      metadata: {
        title: "Liiro Ebooks & Audiobooks OPDS Catalog",
        numberOfItems: totalStories,
        modified: new Date().toISOString(),
      },
      links: [
        { rel: "self", href: `${baseUrl}/opds/v2/catalog`, type: "application/opds+json" },
        { rel: "start", href: `${baseUrl}/opds/v2/catalog`, type: "application/opds+json" },
        { rel: "search", href: `${baseUrl}/opds/v2/search{?q}`, type: "application/opds+json", templated: true },
      ],
      navigation: [
        { title: "All Ebooks", href: `${baseUrl}/opds/v2/publications`, type: "application/opds+json" },
        { title: "Browse Categories", href: `${baseUrl}/opds/v2/categories`, type: "application/opds+json" },
        { title: "Browse Authors", href: `${baseUrl}/opds/v2/authors`, type: "application/opds+json" },
      ],
      groups: [
        {
          metadata: { title: "Featured Categories" },
          links: categories.map((c) => ({
            title: c.name,
            href: `${baseUrl}/opds/v2/categories/${c.slug}`,
            type: "application/opds+json",
          })),
        },
        {
          metadata: { title: "Top Authors" },
          links: authors.map((a) => ({
            title: a.name,
            href: `${baseUrl}/opds/v2/authors/${a.slug}`,
            type: "application/opds+json",
          })),
        },
      ],
    };

    return feed;
  }

  /**
   * Convert Story Document into OPDS 2.0 Publication Object
   */
  static formatPublication(story, baseUrl) {
    const slug = story.slug;
    const title = this.getStr(story.title, slug);
    const synopsis = this.getStr(story.synopsis, "");

    return {
      metadata: {
        "@type": "http://schema.org/Book",
        identifier: `urn:liiro:ebook:${slug}`,
        title,
        author: { name: story.author || "Unknown" },
        description: synopsis,
        language: "en",
        modified: story.updatedAt ? new Date(story.updatedAt).toISOString() : new Date().toISOString(),
        subject: Array.isArray(story.tags) ? story.tags.map((t) => this.getStr(t)) : [],
      },
      links: [
        {
          rel: "http://opds-spec.org/image",
          href: story.coverImageUrl || "https://cdn.jsdelivr.net/gh/standardebooks/tools@master/cover.jpg",
          type: "image/jpeg",
        },
        {
          rel: "http://opds-spec.org/acquisition",
          href: `${baseUrl}/api/v1/stories/slug/${slug}`,
          type: "application/json",
        },
        {
          rel: "http://opds-spec.org/streaming",
          href: `${baseUrl}/api/v1/stories/slug/${slug}/hls/1/playlist.m3u8`,
          type: "application/vnd.apple.mpegurl",
        },
      ],
    };
  }

  /**
   * Convert OPDS Feed to Atom XML (For legacy PocketBook & Kobo e-readers)
   */
  static formatAtomXML(feedTitle, stories, baseUrl) {
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xml += `<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opds="http://opds-spec.org/2010/catalog">\n`;
    xml += `  <id>urn:liiro:opds:catalog</id>\n`;
    xml += `  <title>${feedTitle}</title>\n`;
    xml += `  <updated>${new Date().toISOString()}</updated>\n`;
    xml += `  <link rel="self" href="${baseUrl}/opds/v2/catalog.xml" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>\n`;

    for (const s of stories) {
      const title = this.getStr(s.title, s.slug);
      const synopsis = this.getStr(s.synopsis, "");
      xml += `  <entry>\n`;
      xml += `    <title>${title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>\n`;
      xml += `    <id>urn:liiro:ebook:${s.slug}</id>\n`;
      xml += `    <author><name>${(s.author || "Unknown").replace(/&/g, "&amp;")}</name></author>\n`;
      xml += `    <summary>${synopsis.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</summary>\n`;
      xml += `    <link rel="http://opds-spec.org/image" href="${s.coverImageUrl || ''}" type="image/jpeg"/>\n`;
      xml += `    <link rel="http://opds-spec.org/acquisition" href="${baseUrl}/api/v1/stories/slug/${s.slug}" type="application/json"/>\n`;
      xml += `  </entry>\n`;
    }

    xml += `</feed>`;
    return xml;
  }
}

module.exports = OPDSService;
