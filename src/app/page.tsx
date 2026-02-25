"use client";

import { useMemo, useState } from "react";
import type { SearchResult } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? "star-filled" : "star-empty"}>★</span>
      ))}
      <span className="ml-2 text-sm text-zinc-400">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("I need iPhone repair near me. Must be mobile and come to me.");
  const [location, setLocation] = useState("Austin, TX");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResult | null>(null);

  const sorted = useMemo(() => {
    if (!data) return [];
    return data.businesses;
  }, [data]);

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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Indiana Jones</h1>
              <p className="mt-2 text-zinc-400">
                A local search agent UI (Google Maps-style). Type what you need, filter for “mobile”, and compare options.
              </p>
            </div>
            <div className="hidden sm:block text-right text-sm text-zinc-400">
              <div className="font-medium text-zinc-200">Output includes</div>
              <div>phone · hours · price level · maps link</div>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm text-zinc-300">What do you need?</label>
              <textarea
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3 text-zinc-100 outline-none focus:border-blue-500 min-h-24"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. I need mobile iPhone screen repair near me under $200"
              />
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
              <p className="mt-3 text-xs text-zinc-500">
                This starter build returns sample results. We can plug in a real provider next.
              </p>
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
                {sorted.map((b, idx) => (
                  <div key={idx} className="result-card rounded-2xl bg-[var(--card)] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{b.name}</h3>
                          {b.priceLevel && (
                            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-zinc-300">
                              {b.priceLevel}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <Stars rating={b.rating} />
                          <span className="text-sm text-zinc-500">({b.reviewCount.toLocaleString()} reviews)</span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-300">{b.description}</p>

                        <div className="mt-3 grid gap-1 text-sm text-zinc-400">
                          {b.address && <div><span className="text-zinc-500">Address:</span> {b.address}</div>}
                          {b.hours && <div><span className="text-zinc-500">Hours:</span> {b.hours}</div>}
                          {b.phone && <div><span className="text-zinc-500">Phone:</span> <a className="text-blue-400 hover:underline" href={`tel:${b.phone}`}>{b.phone}</a></div>}
                          {b.website && <div><span className="text-zinc-500">Website:</span> <a className="text-blue-400 hover:underline" target="_blank" href={b.website}>Visit</a></div>}
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
                            {b.tags.slice(0, 6).map((t, i) => (
                              <span key={i} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-300">
                                {t}
                              </span>
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
            <div className="font-medium text-zinc-300">Next step: real data</div>
            <div className="mt-1">
              For production, we’ll integrate a compliant listings provider (Google Places API or a third-party provider), add filters
              (mobile/house-call, price, open-now), and add “call/text” shortcuts.
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
