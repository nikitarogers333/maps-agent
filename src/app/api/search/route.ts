import { NextRequest, NextResponse } from "next/server";
import { parseQuery, buildSearchQuery } from "@/lib/query-parser";
import { buildMapsSearchUrl } from "@/lib/scraper";
import { generateDemoResults } from "@/lib/demo-data";
import type { SearchRequest, SearchResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<SearchRequest>;
  const query = (body.query || "").trim();
  const location = (body.location || "").trim();

  if (!query || !location) {
    return NextResponse.json({ error: "query and location are required" }, { status: 400 });
  }

  // Parse the natural language query
  const parsed = parseQuery(query);
  const mapsQuery = buildSearchQuery(parsed, location);
  const mapsUrl = buildMapsSearchUrl(parsed.searchTerm, location);

  // Generate smart demo results (replace with real API integration)
  const businesses = generateDemoResults(parsed, location);

  // Build a smart summary based on what we detected
  const summaryParts: string[] = [];
  summaryParts.push(`Found ${businesses.length} results for "${parsed.searchTerm}" near ${location}.`);
  if (parsed.wantsMobile) summaryParts.push("Prioritized mobile/on-site services.");
  if (parsed.wantsOpenNow) summaryParts.push("Filtered for places open now.");
  if (parsed.pricePreference === "cheap") summaryParts.push("Sorted by affordability.");
  if (parsed.pricePreference === "expensive") summaryParts.push("Showing premium options.");
  if (parsed.urgency) summaryParts.push("Flagged urgent/emergency services.");

  const result: SearchResult = {
    query,
    location,
    businesses,
    summary: summaryParts.join(" "),
    searchedAt: new Date().toISOString(),
    searchType: parsed.searchTerm,
  };

  return NextResponse.json(result);
}
