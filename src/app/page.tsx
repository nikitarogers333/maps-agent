"use client";

import { useMemo, useState } from "react";
import type { SearchResult } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? "star-filled" : "star-empty"}>
          ★
        </span>
      ))}
      <span className="ml-2 text-sm text-zinc-400">{rating.toFixed(1)}</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-300">{children}</span>;
}

export default function HomePage() {
  const [query, setQuery] = useState("Find a mobile dog groomer near me that can come to my house. Compare a few options.");
  const [location, setLocation] = useState("Austin, TX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResult | null>(null);

  const businesses = useMemo(() => data?.businesses ?? [], [data]);

  async function onSearch() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const json = (await res.json()) as SearchResult;
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Indiana Jones</h1>
              <p className="mt-2 text-zinc-400">
                Universal local-search agent UI. Type what you need in plain English (anything), add a location, and compare options.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                <Badge>mobile / on-site</Badge>
                <Badge>open now</Badge>
                <Badge>price level</Badge>
                <Badge>contact info</Badge>
                <Badge>maps link</Badge>
              </div>
            </div>

            <div className="hidden sm:block text-right text-sm text-zinc-400">
              <div className="font-medium text-zinc-200">Examples</div>
              <div className="mt-1 space-y-1">
                <div className="text-zinc-400">“Best tacos near me open now”</div>
                <div className="text-zinc-400">“Need an emergency plumber that does house calls”</div>
                <div className="text-zinc-400">“Affordable car detailing near me”</div>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm text-zinc-300">What do you need?</label>
              <textarea
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3 text-zinc-100 outline-none focus:border-blue-500 min-h-28"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g. "Need a mobile locksmith near me under $200"'
              />
              <div className="mt-2 text-xs text-zinc-500">
                Tip: add requirements like “mobile”, “open now”, “under $X”, “emergency”, etc.
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-300">Where?</label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3 text-zinc-100 outline-none focus:border-blue-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
              />
              <button
                onClick={onSearch}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Searching…" : "Search"}
              </button>

              <div className="mt-3 rounded-xl border border-[var(--border)] bg-black/10 p-3 text-xs text-zinc-500">
                This build returns smart demo results so the experience works end-to-end. Next we can connect a real data provider.
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Options</h2>
            {data && <div className="text-xs text-zinc-500">Searched: {new Date(data.searchedAt).toLocaleString()}</div>}
          </div>

          {!data && !loading && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-zinc-400">
              Run a search to see results.
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
              <div className="flex items-center gap-3">
                <div className="relative h-3 w-3 rounded-full bg-blue-500 pulse-ring" />
                <div className="text-zinc-300">Agent is scanning listings…</div>
              </div>
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-white/5" />
                ))}
              </div>
            </div>
          )}

          {data && (
            <>
              <div className="mb-4 text-sm text-zinc-400">{data.summary}</div>

              <div className="grid gap-4">
                {businesses.map((b, idx) => (
                  <div key={idx} className="result-card rounded-2xl bg-[var(--card)] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{b.name}</h3>
                          {b.priceLevel && (
                            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-zinc-300">
                              {b.priceLevel}
                            </span>
                          )}
                          {b.distance && <Badge>{b.distance}</Badge>}
                        </div>

                        <div className="mt-1 flex items-center gap-3">
                          <Stars rating={b.rating} />
                          <span className="text-sm text-zinc-500">({b.reviewCount.toLocaleString()} reviews)</span>
                        </div>

                        {b.description && <p className="mt-2 text-sm text-zinc-300">{b.description}</p>}

                        <div className="mt-3 grid gap-1 text-sm text-zinc-400">
                          {b.address && (
                            <div>
                              <span className="text-zinc-500">Address:</span> {b.address}
                            </div>
                          )}
                          {b.hours && (
                            <div>
                              <span className="text-zinc-500">Hours:</span> {b.hours}
                            </div>
                          )}
                          {b.phone && (
                            <div>
                              <span className="text-zinc-500">Phone:</span>{" "}
                              <a className="text-blue-400 hover:underline" href={`tel:${b.phone}`}>
                                {b.phone}
                              </a>
                            </div>
                          )}
                          {b.website && (
                            <div>
                              <span className="text-zinc-500">Website:</span>{" "}
                              <a className="text-blue-400 hover:underline" target="_blank" href={b.website}>
                                Visit
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:text-right">
                        <a
                          className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-black/20 px-4 py-2 text-sm text-zinc-200 hover:border-blue-500"
                          target="_blank"
                          href={b.mapsUrl}
                        >
                          Open in Google Maps
                        </a>

                        {b.tags?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                            {b.tags.slice(0, 8).map((t, i) => (
                              <Badge key={i}>{t}</Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <footer className="mt-12 text-xs text-zinc-500">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="font-medium text-zinc-300">Next step: real listings + price estimates</div>
            <div className="mt-1">
              To return real businesses with phone/website/hours and better price comparison, we’ll connect a compliant provider (Google Places API
              or a Maps SERP provider) and add filters + sorting.
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
