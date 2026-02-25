/**
 * Google Maps URL builder + result parser.
 * Works with any business category — fully generic.
 */

import { Business } from "./types";

/**
 * Build a Google Maps search URL for any query
 */
export function buildMapsSearchUrl(query: string, location: string): string {
  const searchTerm = encodeURIComponent(`${query} near ${location}`);
  return `https://www.google.com/maps/search/${searchTerm}`;
}

/**
 * Build a direct Google Maps link for a specific business
 */
export function buildBusinessMapsUrl(businessName: string, location: string): string {
  const searchTerm = encodeURIComponent(`${businessName} ${location}`);
  return `https://www.google.com/maps/search/${searchTerm}`;
}

/**
 * Parse raw scraped data from Google Maps into structured Business objects.
 * Generic parser — works for any business type.
 */
export function parseBusinessFromRawText(rawBlocks: string[], location: string): Business[] {
  const businesses: Business[] = [];

  for (const block of rawBlocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const name = lines[0] || "Unknown Business";

    // Extract rating (e.g. "4.5" or "4.5(123)")
    const ratingMatch = block.match(/(\d\.\d)\s*\(?([\d,]+)\)?/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    const reviewCount = ratingMatch ? parseInt(ratingMatch[2].replace(/,/g, "")) : 0;

    // Extract phone (US format)
    const phoneMatch = block.match(/(\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
    const phone = phoneMatch ? phoneMatch[1] : "";

    // Extract address
    const addressLine = lines.find(
      (l) => /\d+.*(?:st|ave|blvd|dr|rd|ln|way|ct|pl|hwy|suite|ste|#|street|avenue|road|drive)/i.test(l)
    );
    const address = addressLine || "";

    // Extract price level
    const priceMatch = block.match(/(\${1,4})\s*·|\·\s*(\${1,4})/);
    const priceLevel = priceMatch ? (priceMatch[1] || priceMatch[2]) : "";

    // Extract hours
    const hoursMatch = block.match(/((?:Open|Closed|Opens?|Closes?).*?(?:AM|PM|hours|24|midnight|noon).*?)(?:\n|$)/i);
    const hours = hoursMatch ? hoursMatch[1].trim() : "";

    // Extract distance
    const distMatch = block.match(/(\d+\.?\d*)\s*(mi|miles|km|min)/i);
    const distance = distMatch ? `${distMatch[1]} ${distMatch[2]}` : "";

    // Detect tags/categories generically
    const potentialTags: string[] = [];
    const tagPatterns: [RegExp, string][] = [
      [/mobile/i, "mobile"],
      [/on[- ]?site/i, "on-site"],
      [/house ?call/i, "house call"],
      [/delivery/i, "delivery"],
      [/pickup|pick[- ]?up/i, "pickup"],
      [/walk[- ]?in/i, "walk-in"],
      [/appointment/i, "appointment"],
      [/same[- ]?day/i, "same day"],
      [/next[- ]?day/i, "next day"],
      [/24[- ]?hour/i, "24 hour"],
      [/emergency/i, "emergency"],
      [/warranty/i, "warranty"],
      [/certified/i, "certified"],
      [/licensed/i, "licensed"],
      [/insured/i, "insured"],
      [/free estimate/i, "free estimate"],
      [/free consultation/i, "free consultation"],
      [/free quote/i, "free quote"],
    ];
    for (const [pat, tag] of tagPatterns) {
      if (pat.test(block)) potentialTags.push(tag);
    }

    // Build description from remaining content
    const description = lines
      .slice(1, 4)
      .filter((l) => l.length > 3 && l.length < 200)
      .join(" · ");

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
      tags: potentialTags,
      mapsUrl: buildBusinessMapsUrl(name, location),
      thumbnail: "",
      distance,
    });
  }

  return businesses;
}
