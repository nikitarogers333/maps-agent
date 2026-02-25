export interface Business {
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  website: string;
  hours: string;
  priceLevel: string;
  description: string;
  tags: string[];
  mapsUrl: string;
  thumbnail: string;
  distance?: string;
}

export interface SearchResult {
  query: string;
  location: string;
  businesses: Business[];
  summary: string;
  searchedAt: string;
  searchType: string;
}

export interface SearchRequest {
  query: string;
  location: string;
}
