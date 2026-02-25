import { NextRequest, NextResponse } from "next/server";
import { parseQuery, buildSearchQuery } from "@/lib/query-parser";
import { searchPlaces } from "@/lib/google-places";
import { generateDemoResults } from "@/lib/demo-data";
import type { SearchRequest, SearchResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<SearchRequest>;
  const query = (body.query || "").trim();
  const location = (body.location || "").trim();

  if (!query || !location) {
    return NextResponse.json({ error: "query and location are required" }, { status: 400 });
  }

  const parsed = parseQuery(query);

  // Try Google Places API first, fall back to demo data
  let businesses;
  let apiStatus: "live" | "demo" | "error" = "demo";

  try {
    businesses = await searchPlaces({
      searchTerm: parsed.searchTerm,
      location,
      parsed,
      maxResults: 10,
    });
    apiStatus = "live";
  } catch (err: any) {
    console.warn("Google Places API unavailable, using demo data:", err.message);
    // Graceful fallback to demo results
    const demoRaw = generateDemoResults(parsed, location);
    businesses = demoRaw.map((b: any) => ({
      ...b,
      placeId: "",
      currentlyOpen: null,
      priceLevelNum: null,
      photoUrl: "",
      lat: 0,
      lng: 0,
    }));
    apiStatus = "demo";
  }

  // Build smart summary
  const parts: string[] = [];
  if (apiStatus === "live") {
    parts.push(`Found ${businesses.length} real results for "${parsed.searchTerm}" near ${location}.`);
  } else {
    parts.push(`Showing demo results for "${parsed.searchTerm}" near ${location}. Add a Google Places API key for live data.`);
  }
  if (parsed.wantsMobile) parts.push("🚗 Prioritized mobile/on-site services.");
  if (parsed.wantsOpenNow) parts.push("🕐 Filtered for places open now.");
  if (parsed.pricePreference === "cheap") parts.push("💰 Sorted by affordability.");
  if (parsed.pricePreference === "expensive") parts.push("💎 Showing premium options.");
  if (parsed.urgency) parts.push("🚨 Flagged urgent/emergency services.");

  const result: SearchResult = {
    query,
    location,
    businesses,
    summary: parts.join(" "),
    searchedAt: new Date().toISOString(),
    searchType: parsed.searchTerm,
    totalFound: businesses.length,
    apiStatus,
  };

  return NextResponse.json(result);
}
