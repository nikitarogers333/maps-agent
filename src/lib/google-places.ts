/**
 * Google Places API (New) integration.
 * Uses the Places API v1 (new) for Text Search + Place Details.
 *
 * Required env var: GOOGLE_PLACES_API_KEY
 */

import type { Business } from "./types";
import type { ParsedQuery } from "./query-parser";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

const PRICE_NUMS: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

interface TextSearchParams {
  searchTerm: string;
  location: string;
  parsed: ParsedQuery;
  maxResults?: number;
}

/**
 * Search for businesses using Google Places Text Search (New).
 */
export async function searchPlaces({
  searchTerm,
  location,
  parsed,
  maxResults = 10,
}: TextSearchParams): Promise<Business[]> {
  if (!API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

  // Build the query string
  const queryParts = [searchTerm];
  if (parsed.wantsMobile) queryParts.push("mobile");
  if (parsed.wantsOpenNow) queryParts.push("open now");
  queryParts.push(`in ${location}`);
  const textQuery = queryParts.join(" ");

  // Fields we want (controls billing — only request what we need)
  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.currentOpeningHours",
    "places.regularOpeningHours",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.googleMapsUri",
    "places.types",
    "places.editorialSummary",
    "places.photos",
    "places.location",
    "places.primaryType",
    "places.primaryTypeDisplayName",
  ].join(",");

  // Build request body
  const body: Record<string, any> = {
    textQuery,
    languageCode: "en",
    maxResultCount: Math.min(maxResults, 20),
  };

  // If user wants open now, set that flag
  if (parsed.wantsOpenNow) {
    body.openNow = true;
  }

  // Price level filters
  if (parsed.pricePreference === "cheap") {
    body.priceLevels = ["PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE"];
  } else if (parsed.pricePreference === "expensive") {
    body.priceLevels = ["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"];
  }

  const res = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Places API error:", res.status, errText);
    throw new Error(`Google Places API returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const places: any[] = data.places || [];

  // Map to our Business type
  const businesses: Business[] = places.map((p: any) => {
    // Build photo URL if available
    let photoUrl = "";
    if (p.photos && p.photos.length > 0) {
      const photoRef = p.photos[0].name;
      photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxHeightPx=400&maxWidthPx=400&key=${API_KEY}`;
    }

    // Extract hours text
    let hours = "";
    const hoursData = p.currentOpeningHours || p.regularOpeningHours;
    if (hoursData?.weekdayDescriptions) {
      // Get today's hours
      const dayIdx = new Date().getDay();
      // weekdayDescriptions is Mon-Sun (0=Mon, 6=Sun), JS getDay is 0=Sun
      const mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
      hours = hoursData.weekdayDescriptions[mappedIdx] || hoursData.weekdayDescriptions[0] || "";
    }

    // Currently open?
    let currentlyOpen: boolean | null = null;
    if (hoursData?.openNow !== undefined) {
      currentlyOpen = hoursData.openNow;
    }

    // Tags from types
    const tags: string[] = [];
    if (p.primaryTypeDisplayName?.text) {
      tags.push(p.primaryTypeDisplayName.text);
    }
    if (p.types) {
      const filtered = (p.types as string[])
        .filter((t) => !t.startsWith("point_of_interest") && t !== "establishment")
        .slice(0, 6)
        .map((t) => t.replace(/_/g, " "));
      tags.push(...filtered);
    }
    // Deduplicate
    // Deduplicate without depending on downlevel Set iteration
    const uniqLower = Array.from(new Set(tags.map((t) => t.toLowerCase())));
    const uniqueTags = uniqLower.map((t) => t.charAt(0).toUpperCase() + t.slice(1));

    const priceLevel = p.priceLevel ? PRICE_LABELS[p.priceLevel] || "" : "";
    const priceLevelNum = p.priceLevel ? PRICE_NUMS[p.priceLevel] ?? null : null;

    return {
      placeId: p.id || "",
      name: p.displayName?.text || "Unknown",
      rating: p.rating || 0,
      reviewCount: p.userRatingCount || 0,
      address: p.formattedAddress || "",
      phone: p.nationalPhoneNumber || p.internationalPhoneNumber || "",
      website: p.websiteUri || "",
      hours,
      currentlyOpen,
      priceLevel,
      priceLevelNum,
      description: p.editorialSummary?.text || "",
      tags: uniqueTags,
      mapsUrl: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
      photoUrl,
      lat: p.location?.latitude || 0,
      lng: p.location?.longitude || 0,
    };
  });

  // Sort based on user preferences
  return sortBusinesses(businesses, parsed);
}

/**
 * Sort businesses based on user preferences.
 */
function sortBusinesses(businesses: Business[], parsed: ParsedQuery): Business[] {
  return [...businesses].sort((a, b) => {
    // Price preference sorting
    if (parsed.pricePreference === "cheap") {
      if (a.priceLevelNum !== null && b.priceLevelNum !== null) {
        if (a.priceLevelNum !== b.priceLevelNum) return a.priceLevelNum - b.priceLevelNum;
      }
      // Places with price info first
      if (a.priceLevelNum !== null && b.priceLevelNum === null) return -1;
      if (a.priceLevelNum === null && b.priceLevelNum !== null) return 1;
    }

    if (parsed.pricePreference === "expensive") {
      if (a.priceLevelNum !== null && b.priceLevelNum !== null) {
        if (a.priceLevelNum !== b.priceLevelNum) return b.priceLevelNum - a.priceLevelNum;
      }
    }

    // Open now preference
    if (parsed.wantsOpenNow) {
      if (a.currentlyOpen && !b.currentlyOpen) return -1;
      if (!a.currentlyOpen && b.currentlyOpen) return 1;
    }

    // Default: sort by weighted score (rating * log(reviews))
    const scoreA = a.rating * Math.log10(Math.max(a.reviewCount, 1) + 1);
    const scoreB = b.rating * Math.log10(Math.max(b.reviewCount, 1) + 1);
    return scoreB - scoreA;
  });
}
