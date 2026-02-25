// Google Maps scraping via SerpAPI-style URL parsing
// This module builds Google Maps search URLs and parses the results

import { Business } from "./types";

/**
 * Build a Google Maps search URL
 */
export function buildMapsSearchUrl(query: string, location: string): string {
  const searchTerm = encodeURIComponent(`${query} near ${location}`);
  return `https://www.google.com/maps/search/${searchTerm}`;
}

/**
 * Parse raw scraped data from Google Maps into structured Business objects.
 * This runs server-side and processes the raw text extracted from the Maps page.
 */
export function parseBusinessFromRawText(rawBlocks: string[]): Business[] {
  const businesses: Business[] = [];

  for (const block of rawBlocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const name = lines[0] || "Unknown Business";

    // Extract rating (e.g. "4.5" or "4.5(123)")
    const ratingMatch = block.match(/(\d\.\d)\s*\(?([\d,]+)\)?/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    const reviewCount = ratingMatch ? parseInt(ratingMatch[2].replace(",", "")) : 0;

    // Extract phone
    const phoneMatch = block.match(/(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
    const phone = phoneMatch ? phoneMatch[1] : "";

    // Extract address (lines with numbers and street-like words)
    const addressLine = lines.find(
      (l) => /\d+.*(?:st|ave|blvd|dr|rd|ln|way|ct|pl|hwy|suite|ste|#)/i.test(l)
    );
    const address = addressLine || "";

    // Extract price level
    const priceMatch = block.match(/(\${1,4})/);
    const priceLevel = priceMatch ? priceMatch[1] : "";

    // Extract hours
    const hoursMatch = block.match(/((?:Open|Closed).*?(?:AM|PM|hours|24).*?)(?:\n|$)/i);
    const hours = hoursMatch ? hoursMatch[1].trim() : "";

    // Detect tags/categories
    const tagPatterns = [
      /mobile/i, /repair/i, /screen/i, /battery/i, /walk-in/i,
      /appointment/i, /same.day/i, /warranty/i, /certified/i,
      /pickup/i, /delivery/i, /on-site/i, /emergency/i
    ];
    const tags = tagPatterns
      .filter((p) => p.test(block))
      .map((p) => p.source.replace(/\\-/g, "-").replace(/\\/g, "").replace(/\./g, " "));

    // Build description from remaining content
    const description = lines.slice(1, 4).join(" · ");

    businesses.push({
      name,
      rating,
      reviewCount,
      address,
      phone,
      website: "",
      hours,
      priceLevel,
      description,
      tags,
      mapsUrl: "",
      thumbnail: "",
    });
  }

  return businesses;
}
