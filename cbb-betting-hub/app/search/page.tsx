"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { KeyboardEvent, useMemo, useState } from "react";
import { Loader } from "@/components/ui/Loader";
import { apiFetch } from "@/lib/api";
import { PlayerSeasonStats } from "@/lib/types";
import { dec, pct } from "@/lib/utils";

const SEASON = 2026;
const RESULT_LIMIT = 50;
const LEADERBOARD_LIMIT = 120;

type LeaderMetric = {
  key: string;
  label: string;
  valueLabel: string;
  value: (player: PlayerSeasonStats) => number;
  display: (player: PlayerSeasonStats) => string;
  minGames?: number;
};

const leaderMetrics: LeaderMetric[] = [
  { key: "ppg", label: "Scoring", valueLabel: "PPG", value: (p) => (p.games ? p.points / p.games : 0), display: (p) => dec(p.games ? p.points / p.games : 0, 1), minGames: 5 },
  { key: "rpg", label: "Rebounding", valueLabel: "RPG", value: (p) => (p.games ? p.rebounds.total / p.games : 0), display: (p) => dec(p.games ? p.rebounds.total / p.games : 0, 1), minGames: 5 },
  { key: "apg", label: "Playmaking", valueLabel: "APG", value: (p) => (p.games ? p.assists / p.games : 0), display: (p) => dec(p.games ? p.assists / p.games : 0, 1), minGames: 5 },
  { key: "fg", label: "Field Goal", valueLabel: "FG%", value: (p) => p.fieldGoals.pct, display: (p) => pct(p.fieldGoals.pct), minGames: 5 },
  { key: "3pt", label: "Three Point", valueLabel: "3PT%", value: (p) => p.threePointFieldGoals.pct, display: (p) => pct(p.threePointFieldGoals.pct), minGames: 5 },
  { key: "ts", label: "True Shooting", valueLabel: "TS%", value: (p) => p.trueShootingPct, display: (p) => pct(p.trueShootingPct), minGames: 5 },
];

export default function PlayerSearchPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [allPlayers, setAllPlayers] = useState<PlayerSeasonStats[] | null>(null);
  const [results, setResults] = useState<PlayerSeasonStats[]>([]);
  const [loading, setLoading] = useState(false);

  const leaderboardData = useMemo(
    () =>
      leaderMetrics.map((metric) => ({
        ...metric,
        entries: (allPlayers ?? [])
          .filter((player) => (metric.minGames ? player.games >= metric.minGames : true))
          .sort((a, b) => metric.value(b) - metric.value(a))
          .slice(0, LEADERBOARD_LIMIT),
      })),
    [allPlayers]
  );

  async function runSearch() {
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    setLoading(true);

    try {
      let dataset = allPlayers;
      if (!dataset) {
        dataset = await apiFetch<PlayerSeasonStats[]>("/stats/player/season", { season: SEASON });
        setAllPlayers(dataset);
      }

      const filtered =
        trimmed.length === 0
          ? []
          : dataset.filter((player) => player.name.toLowerCase().includes(trimmed.toLowerCase())).slice(0, RESULT_LIMIT);

      setResults(filtered);
    } finally {
      setLoading(false);
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void runSearch();
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
        <div className="mb-4 flex items-center gap-3">
          <Search className="h-7 w-7 text-amber-400" />
          <h1 className="font-heading text-4xl text-zinc-100">Player Search</h1>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search by player name..."
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-amber-400"
          />
          <button type="button" onClick={() => void runSearch()} className="rounded-lg bg-amber-400 px-5 py-3 font-semibold text-black transition hover:bg-amber-300">
            Search
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
        <h2 className="mb-4 font-heading text-2xl text-zinc-100">Top 120 National Leaders</h2>
        {allPlayers == null ? (
          <p className="text-sm text-zinc-400">Run a search to load player leaderboard boxes.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {leaderboardData.map((board) => (
              <article key={board.key} className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                <h3 className="font-semibold text-amber-300">{board.label}</h3>
                <p className="mb-3 text-xs uppercase tracking-wide text-zinc-400">Top 120 by {board.valueLabel}</p>
                <div className="space-y-2">
                  {board.entries.slice(0, 5).map((player, idx) => (
                    <div key={`${board.key}-${player.athleteId}-${idx}`} className="flex items-center justify-between gap-3 text-sm">
                      <Link href={`/player/${player.athleteId}?name=${encodeURIComponent(player.name)}`} className="truncate text-zinc-100 hover:text-amber-300">
                        {idx + 1}. {player.name}
                      </Link>
                      <span className="font-mono text-amber-300">{board.display(player)}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
        {loading ? <Loader /> : null}

        {!loading && results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-400">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Position</th>
                  <th className="px-3 py-2 font-mono">Games</th>
                  <th className="px-3 py-2 font-mono">PPG</th>
                  <th className="px-3 py-2 font-mono">RPG</th>
                  <th className="px-3 py-2 font-mono">APG</th>
                  <th className="px-3 py-2 font-mono">FG%</th>
                  <th className="px-3 py-2 font-mono">3PT%</th>
                  <th className="px-3 py-2 font-mono text-amber-300">TS%</th>
                  <th className="px-3 py-2 font-mono text-amber-300">Net Rating</th>
                </tr>
              </thead>
              <tbody>
                {results.map((player) => (
                  <tr key={`${player.athleteId}-${player.teamId}`} className="border-b border-white/5 text-zinc-200">
                    <td className="px-3 py-2"><Link href={`/player/${player.athleteId}?name=${encodeURIComponent(player.name)}`} className="text-white hover:text-amber-300">{player.name}</Link></td>
                    <td className="px-3 py-2">{player.team}</td>
                    <td className="px-3 py-2">{player.position || "—"}</td>
                    <td className="px-3 py-2 font-mono">{player.games}</td>
                    <td className="px-3 py-2 font-mono">{dec(player.games ? player.points / player.games : 0, 1)}</td>
                    <td className="px-3 py-2 font-mono">{dec(player.games ? player.rebounds.total / player.games : 0, 1)}</td>
                    <td className="px-3 py-2 font-mono">{dec(player.games ? player.assists / player.games : 0, 1)}</td>
                    <td className="px-3 py-2 font-mono">{pct(player.fieldGoals.pct)}</td>
                    <td className="px-3 py-2 font-mono">{pct(player.threePointFieldGoals.pct)}</td>
                    <td className="px-3 py-2 font-mono text-amber-300">{pct(player.trueShootingPct)}</td>
                    <td className="px-3 py-2 font-mono text-amber-300">{dec(player.netRating, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && submittedQuery && results.length === 0 ? <p className="text-zinc-400">No players found matching '{submittedQuery}'</p> : null}
      </section>
    </div>
  );
}
