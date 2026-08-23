"use strict";

const https = require("https");
const StoryChapter = require("../models/StoryChapter.model");

function fetchText(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) return resolve(null);
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      })
      .on("error", () => resolve(null));
  });
}

function stripXmlTags(html) {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "$1\n\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

exports.ingestBookFromStandardEbooks = async function (story) {
  try {
    if (!story) return null;
    let repoName = story.slug;
    if (story.sourceUrl && story.sourceUrl.includes("github.com/standardebooks/")) {
      repoName = story.sourceUrl.split("github.com/standardebooks/")[1].replace(/\/+$/, "");
    }

    const tocUrl = `https://raw.githubusercontent.com/standardebooks/${repoName}/master/src/epub/toc.xhtml`;
    const tocHtml = await fetchText(tocUrl);
    if (!tocHtml) return null;

    const hrefMatches = [...tocHtml.matchAll(/href="(text\/[^"]+\.xhtml)"/g)];
    let hrefs = Array.from(new Set(hrefMatches.map((m) => m[1]))).filter(
      (h) => h.includes("chapter") || h.includes("part") || h.includes("book") || h.includes("section")
    );

    if (hrefs.length === 0) {
      hrefs = Array.from(new Set(hrefMatches.map((m) => m[1]))).filter(
        (h) => !h.includes("titlepage") && !h.includes("colophon") && !h.includes("imprint") && !h.includes("uncopyright")
      );
    }

    if (hrefs.length === 0) return null;

    let chapterIndex = 1;
    const chaptersToInsert = [];

    for (const href of hrefs) {
      const chUrl = `https://raw.githubusercontent.com/standardebooks/${repoName}/master/src/epub/${href}`;
      const rawHtml = await fetchText(chUrl);
      if (!rawHtml) continue;

      const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      let titleText = titleMatch ? titleMatch[1].trim() : `Chapter ${chapterIndex}`;
      titleText = titleText.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

      const cleanText = stripXmlTags(rawHtml);
      if (!cleanText || cleanText.length < 30) continue;

      const paragraphs = cleanText.split("\n\n").filter((p) => p.trim().length > 0);

      chaptersToInsert.push({
        storyId: story._id,
        chapterNumber: chapterIndex,
        chapterIndex: chapterIndex,
        title: { en: titleText },
        textPayload: { en: cleanText },
        content: { en: cleanText },
        paragraphs: paragraphs,
        language: "en",
      });

      chapterIndex++;
    }

    if (chaptersToInsert.length > 0) {
      await StoryChapter.deleteMany({ storyId: story._id });
      await StoryChapter.insertMany(chaptersToInsert);
      console.log(`✅ Dynamically ingested ${chaptersToInsert.length} full chapters for ${story.slug}`);
      return chaptersToInsert;
    }
  } catch (err) {
    console.error("Error in ingestBookFromStandardEbooks:", err.message);
  }
  return null;
};
