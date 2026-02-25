/**
 * Smart demo data generator.
 * Generates realistic-looking results for ANY search query + location.
 * Used as fallback when no real API is configured.
 */

import { Business } from "./types";
import { ParsedQuery } from "./query-parser";
import { buildBusinessMapsUrl } from "./scraper";

// Business name templates by detected category
const NAME_TEMPLATES: Record<string, string[]> = {
  restaurant: ["{location} Kitchen & Bar", "The Local Eatery", "Fresh Bites {location}", "Golden Fork Dining", "Main Street Grill", "Corner Café & Bistro"],
  repair: ["QuickFix {term} Repair", "{location} {term} Experts", "ProTech {term} Solutions", "FastFix Mobile Repair", "AllStar {term} Service", "TechSavvy Repairs"],
  plumber: ["{location} Plumbing Co", "24/7 Plumbing Pros", "AquaFlow Plumbers", "PipeMaster Services", "Elite Plumbing Solutions", "TrustFlow Plumbing"],
  electrician: ["{location} Electric Co", "BrightSpark Electricians", "PowerPro Electric", "SafeWire Solutions", "Volt Masters Electric", "Precision Electrical"],
  cleaning: ["Sparkle Clean {location}", "ProClean Services", "FreshStart Cleaning Co", "Diamond Maids", "PureShine Cleaners", "TidyUp {location}"],
  auto: ["{location} Auto Works", "Premier Auto Care", "FastLane Mechanics", "TrustAuto Service", "AllDrive Auto Repair", "ProDrive Garage"],
  beauty: ["Glow Beauty Studio", "{location} Style Lounge", "Luxe Beauty Bar", "The Beauty Spot", "Radiance Salon & Spa", "Polished {location}"],
  fitness: ["{location} Fitness Center", "Peak Performance Gym", "FlexZone Training", "Iron Temple Fitness", "CoreStrength Studio", "FitLife {location}"],
  pet: ["Happy Paws {location}", "PetCare Plus", "Furry Friends Services", "The Pet Spot", "Pawfect Care {location}", "TailWaggers Pet Co"],
  lawyer: ["{location} Law Group", "Justice Legal Associates", "ProLegal Services", "TrustPoint Law Firm", "Shield Legal {location}", "Advocate Partners"],
  default: ["{location} {term} Services", "Pro {term} Solutions", "Elite {term} Co", "Premier {term} {location}", "AllStar {term} Pros", "TrustPoint {term}"],
};

const CATEGORY_TAGS: Record<string, string[]> = {
  restaurant: ["dine-in", "takeout", "delivery", "outdoor seating", "reservations", "catering"],
  repair: ["warranty", "same day", "certified", "free estimate", "mobile", "on-site"],
  plumber: ["licensed", "insured", "emergency", "24 hour", "free estimate", "same day"],
  electrician: ["licensed", "insured", "emergency", "free estimate", "certified", "commercial"],
  cleaning: ["deep clean", "eco-friendly", "same day", "recurring", "insured", "licensed"],
  auto: ["certified", "warranty", "free estimate", "loaner car", "same day", "all makes"],
  beauty: ["appointment", "walk-in", "online booking", "gift cards", "bridal", "organic"],
  fitness: ["free trial", "personal training", "group classes", "24 hour", "no contract", "sauna"],
  pet: ["certified", "insured", "pickup", "emergency", "boarding", "grooming"],
  lawyer: ["free consultation", "no win no fee", "24 hour", "licensed", "experienced", "bilingual"],
  default: ["licensed", "insured", "free estimate", "same day", "certified", "professional"],
};

function detectCategory(searchTerm: string): string {
  const t = searchTerm.toLowerCase();
  if (/restaurant|food|pizza|sushi|burger|taco|thai|chinese|indian|italian|bbq|brunch|cafe|coffee|bakery|diner/i.test(t)) return "restaurant";
  if (/repair|fix|screen|battery|phone|iphone|samsung|laptop|computer|tech/i.test(t)) return "repair";
  if (/plumb/i.test(t)) return "plumber";
  if (/electri/i.test(t)) return "electrician";
  if (/clean|maid|janitorial|pressure wash/i.test(t)) return "cleaning";
  if (/auto|car|mechanic|oil change|tire|brake|transmission|body shop/i.test(t)) return "auto";
  if (/beauty|salon|hair|nail|spa|facial|massage|barber|lash|brow|wax/i.test(t)) return "beauty";
  if (/gym|fitness|yoga|pilates|crossfit|personal train|workout/i.test(t)) return "fitness";
  if (/pet|dog|cat|vet|veterinar|groom|board|walk/i.test(t)) return "pet";
  if (/lawyer|attorney|legal|law firm|divorce|injury|criminal|immigration/i.test(t)) return "lawyer";
  return "default";
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateDemoResults(parsed: ParsedQuery, location: string): Business[] {
  const category = detectCategory(parsed.searchTerm);
  const nameTemplates = NAME_TEMPLATES[category] || NAME_TEMPLATES.default;
  const baseTags = CATEGORY_TAGS[category] || CATEGORY_TAGS.default;
  const count = randomInt(4, 7);
  const term = capitalize(parsed.searchTerm.slice(0, 30));
  const loc = location.split(",")[0].trim();

  const businesses: Business[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let template = nameTemplates[i % nameTemplates.length];
    let name = template.replace("{location}", loc).replace("{term}", term);
    if (usedNames.has(name)) name = `${name} ${i + 1}`;
    usedNames.add(name);

    const rating = randomBetween(3.5, 5.0);
    const reviewCount = randomInt(15, 2500);
    const priceLevels = ["$", "$$", "$$$"];
    const priceLevel = priceLevels[randomInt(0, 2)];

    // Pick random tags, add mobile if user wants it
    const shuffled = [...baseTags].sort(() => Math.random() - 0.5);
    const tags = shuffled.slice(0, randomInt(2, 4));
    if (parsed.wantsMobile && i < 3) {
      tags.unshift("mobile");
    }

    const hours = [
      "Open · Closes 8 PM",
      "Open · Closes 9 PM",
      "Open · Closes 6 PM",
      "Open · Closes 10 PM",
      "Open 24 hours",
      "Open · Closes 7 PM",
      "Closed · Opens 8 AM",
    ][randomInt(0, 6)];

    const descriptions = [
      `Professional ${parsed.searchTerm} services in ${loc}`,
      `Top-rated ${parsed.searchTerm} · Serving ${loc} area`,
      `Trusted ${parsed.searchTerm} with ${reviewCount}+ happy customers`,
      `${loc}'s premier ${parsed.searchTerm} provider`,
      `Quality ${parsed.searchTerm} · Fast & reliable`,
    ];

    const phone = `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
    const distance = `${randomBetween(0.3, 12.0)} mi`;

    businesses.push({
      name,
      rating,
      reviewCount,
      address: `${randomInt(100, 9999)} ${["Main St", "Oak Ave", "Commerce Blvd", "Park Rd", "Center Dr", "1st Ave", "Broadway"][randomInt(0, 6)]}, ${location}`,
      phone,
      website: `https://example.com`,
      hours,
      priceLevel,
      description: descriptions[randomInt(0, descriptions.length - 1)],
      tags,
      mapsUrl: buildBusinessMapsUrl(name, location),
      photoUrl: "",
      lat: 0,
      lng: 0,
      placeId: "",
      currentlyOpen: null,
      priceLevelNum: null,
      distance,
    });
  }

  // Sort: highest rated first, with mobile-tagged boosted if user wants mobile
  businesses.sort((a, b) => {
    const mobileA = parsed.wantsMobile && a.tags.includes("mobile") ? 2 : 0;
    const mobileB = parsed.wantsMobile && b.tags.includes("mobile") ? 2 : 0;
    const scoreA = a.rating * 2 + Math.log10(Math.max(1, a.reviewCount)) + mobileA;
    const scoreB = b.rating * 2 + Math.log10(Math.max(1, b.reviewCount)) + mobileB;
    return scoreB - scoreA;
  });

  return businesses;
}
