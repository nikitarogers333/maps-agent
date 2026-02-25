export interface Business {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  website: string;
  hours: string;
  currentlyOpen: boolean | null;
  priceLevel: string;
  priceLevelNum: number | null;
  description: string;
  tags: string[];
  mapsUrl: string;
  photoUrl: string;
  distance?: string;
  lat: number;
  lng: number;
}

export interface SearchResult {
  query: string;
  location: string;
  businesses: Business[];
  summary: string;
  searchedAt: string;
  searchType: string;
  totalFound: number;
  apiStatus: "live" | "demo" | "error";
}

export interface SearchRequest {
  query: string;
  location: string;
}
