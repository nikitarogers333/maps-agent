/**
 * Universal natural-language query parser.
 * Extracts structured intent from any freeform local search query.
 */

export interface ParsedQuery {
  /** The core search term for Google Maps (e.g. "plumber", "pizza", "dog groomer") */
  searchTerm: string;
  /** Modifiers to append to the search (e.g. "mobile", "24 hour", "cheap") */
  modifiers: string[];
  /** Whether the user wants a mobile/on-site/house-call service */
  wantsMobile: boolean;
  /** Whether the user wants something open now */
  wantsOpenNow: boolean;
  /** Price preference: "cheap" | "moderate" | "expensive" | null */
  pricePreference: string | null;
  /** Urgency: "emergency" | "asap" | null */
  urgency: string | null;
  /** Original raw query */
  raw: string;
}

const MOBILE_PATTERNS = /\b(mobile|come to me|come to my|travel to|on[- ]?site|house ?call|meet me|at my (house|home|office|location|place)|they come|who come|that come|visit me)\b/i;
const OPEN_NOW_PATTERNS = /\b(open now|open right now|open today|open late|24[- ]?hour|available now|available today)\b/i;
const CHEAP_PATTERNS = /\b(cheap|affordable|budget|low[- ]?cost|inexpensive|under \$|less than \$|best price|best deal|good deal)\b/i;
const EXPENSIVE_PATTERNS = /\b(premium|luxury|high[- ]?end|upscale|top[- ]?tier|best quality)\b/i;
const EMERGENCY_PATTERNS = /\b(emergency|urgent|asap|right now|immediately|today)\b/i;

/** Noise words to strip when extracting the core search term */
const NOISE = /\b(i need|i want|i'm looking for|looking for|find me|search for|can you find|help me find|please find|show me|get me|where can i find|who does|near me|nearby|around here|in my area|close to me|around me|must be|should be|has to be|need to be|that is|that are|which are|who are|and i want|and they need to|and i need|them to be|they need to|i wanna|i want to|compare|a few|some|places|options|based on|the price range)\b/gi;

export function parseQuery(raw: string): ParsedQuery {
  const wantsMobile = MOBILE_PATTERNS.test(raw);
  const wantsOpenNow = OPEN_NOW_PATTERNS.test(raw);
  const urgency = EMERGENCY_PATTERNS.test(raw) ? (raw.match(/emergency/i) ? "emergency" : "asap") : null;

  let pricePreference: string | null = null;
  if (CHEAP_PATTERNS.test(raw)) pricePreference = "cheap";
  else if (EXPENSIVE_PATTERNS.test(raw)) pricePreference = "expensive";

  // Extract the core search term by removing noise
  let cleaned = raw
    .replace(NOISE, " ")
    .replace(MOBILE_PATTERNS, " ")
    .replace(OPEN_NOW_PATTERNS, " ")
    .replace(CHEAP_PATTERNS, " ")
    .replace(EXPENSIVE_PATTERNS, " ")
    .replace(EMERGENCY_PATTERNS, " ")
    .replace(/[.,!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Remove leading articles
  cleaned = cleaned.replace(/^(a |an |the |some )/i, "").trim();

  // Build modifiers list
  const modifiers: string[] = [];
  if (wantsMobile) modifiers.push("mobile");
  if (wantsOpenNow) modifiers.push("open now");
  if (pricePreference === "cheap") modifiers.push("affordable");
  if (pricePreference === "expensive") modifiers.push("premium");
  if (urgency === "emergency") modifiers.push("emergency");

  return {
    searchTerm: cleaned || raw.slice(0, 80),
    modifiers,
    wantsMobile,
    wantsOpenNow,
    pricePreference,
    urgency,
    raw,
  };
}

/**
 * Build the Google Maps search query string from parsed query + location
 */
export function buildSearchQuery(parsed: ParsedQuery, location: string): string {
  const parts = [parsed.searchTerm];
  if (parsed.wantsMobile) parts.push("mobile");
  if (parsed.wantsOpenNow) parts.push("open now");
  parts.push(`near ${location}`);
  return parts.join(" ");
}
