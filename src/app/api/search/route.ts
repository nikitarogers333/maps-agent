import { NextRequest, NextResponse } from "next/server";
import { buildMapsSearchUrl } from "@/lib/scraper";
import type { Business, SearchRequest, SearchResult } from "@/lib/types";

// NOTE:
// - Direct scraping of Google Maps HTML can be brittle and may violate Google's ToS.
// - This endpoint is built to work with either:
//   (1) A compliant data provider (e.g., Google Places API, SerpAPI, Outscraper), OR
//   (2) A headless browser you run yourself.
//
// For this starter build, we return a deterministic "agent-like" result set and
// include the Maps search URL so you can open/verify results.

function scoreBusiness(b: Business, wantsMobile: boolean) {
  const mobileBoost = wantsMobile && b.tags.some((t) => /mobile|on-site|onsite|delivery/i.test(t)) ? 1 : 0;
  return b.rating * 2 + Math.log10(Math.max(1, b.reviewCount)) + mobileBoost;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<SearchRequest>;
  const query = (body.query || "").trim();
  const location = (body.location || "").trim();

  if (!query || !location) {
    return NextResponse.json({ error: "query and location are required" }, { status: 400 });
  }

  const wantsMobile = /mobile|come to me|travel|on[- ]site|house call|meet me/i.test(query);

  // Demo dataset (replace with real provider integration)
  const seed: Business[] = [
    {
      name: "Rapid iPhone Repair (Mobile Service)",
      rating: 4.7,
      reviewCount: 312,
      address: `${location}`,
      phone: "(555) 010-2048",
      website: "https://example.com",
      hours: "Open · Closes 8PM",
      priceLevel: "$$",
      description: "Mobile iPhone screen + battery repair · Same-day · Warranty",
      tags: ["mobile", "on-site", "same day", "warranty"],
      mapsUrl: buildMapsSearchUrl("Rapid iPhone Repair (Mobile Service)", location),
      thumbnail: "",
    },
    {
      name: "Downtown Device Fix",
      rating: 4.5,
      reviewCount: 1180,
      address: `Near ${location}`,
      phone: "(555) 010-7721",
      website: "https://example.com",
      hours: "Open · Closes 7PM",
      priceLevel: "$",
      description: "Walk-in iPhone repair · Screen replacements · Diagnostics",
      tags: ["repair", "walk-in"],
      mapsUrl: buildMapsSearchUrl("Downtown Device Fix", location),
      thumbnail: "",
    },
    {
      name: "Pro Mobile Phone Repair",
      rating: 4.6,
      reviewCount: 540,
      address: `${location}`,
      phone: "(555) 010-3344",
      website: "https://example.com",
      hours: "Open 24 hours",
      priceLevel: "$$$",
      description: "On-site repair · Emergency service · iPhone & Android",
      tags: ["mobile", "on-site", "emergency"],
      mapsUrl: buildMapsSearchUrl("Pro Mobile Phone Repair", location),
      thumbnail: "",
    },
  ];

  const businesses = [...seed]
    .sort((a, b) => scoreBusiness(b, wantsMobile) - scoreBusiness(a, wantsMobile))
    .slice(0, 10);

  const result: SearchResult = {
    query,
    location,
    businesses,
    summary:
      "Starter build: results are sample data. Next step is wiring a compliant provider (Google Places API / SerpAPI / Outscraper) to return real Google Maps listings with phone, website, hours, and price hints.",
    searchedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
