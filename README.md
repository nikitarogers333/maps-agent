# Indiana Jones — Google Maps Search Agent (Starter)

This is a starter implementation of a “Google Maps search agent” UI.

## What it does
- You type a natural language request (e.g. *"I need mobile iPhone repair near me under $200"*)
- You provide a location (city/state)
- The app returns a ranked list with:
  - name, rating, review count
  - price level (when available)
  - hours
  - phone + click-to-call
  - link to open the result in Google Maps

## Important note about Google Maps
Direct scraping of Google Maps HTML is brittle and may violate Google’s Terms of Service.

**Production approach**: integrate a compliant source like:
- Google Places API (official)
- SerpAPI / Outscraper (third-party aggregators)

This repository is structured so the `/api/search` route can be swapped to real providers.

## Dev
```bash
npm install
npm run dev
```

Open http://localhost:3000
