"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { ErrorMsg } from "@/components/ui/ErrorMsg";
import { Loader } from "@/components/ui/Loader";
import { Tabs } from "@/components/ui/Tabs";
import { apiFetch } from "@/lib/api";
import { AdjustedRating, BettingLine, Game, Ranking } from "@/lib/types";
import { dec, formatDate } from "@/lib/utils";

const SEASON = 2026;

function toYyyyMmDd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [lines, setLines] = useState<BettingLine[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [ratings, setRatings] = useState<AdjustedRating[]>([]);
  const [dateMode, setDateMode] = useState<"Today" | "Recent">("Today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => toYyyyMmDd(new Date()), []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [gamesData, linesData, rankingsData, ratingsData] = await Promise.all([
          apiFetch<Game[]>("/games", {
            season: SEASON,
            startDateRange: today,
            endDateRange: today,
          }),
          apiFetch<BettingLine[]>("/lines", { season: SEASON }),
          apiFetch<Ranking[]>("/rankings", { season: SEASON }),
          apiFetch<AdjustedRating[]>("/ratings/adjusted", { season: SEASON }),
        ]);

        if (!cancelled) {
          setGames(gamesData);
          setLines(linesData);
          setRankings(rankingsData);
          setRatings(ratingsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [today]);

  const linesMap = useMemo(() => new Map(lines.map((line) => [line.gameId, line])), [lines]);
  const ratingsMap = useMemo(() => new Map(ratings.map((rating) => [rating.teamId, rating])), [ratings]);

  const displayedGames = useMemo(() => {
    if (dateMode === "Today") return games;
    return games
      .filter((game) => {
        const status = game.status.toUpperCase();
        return status.includes("FINAL") || status.includes("LIVE") || status.includes("IN PROGRESS");
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [dateMode, games]);

  const apTop25 = useMemo(() => {
    const apRankings = rankings.filter((row) => row.pollType.toUpperCase().includes("AP"));
    const latestWeek = apRankings.reduce((maxWeek, row) => Math.max(maxWeek, row.week), 0);

    return apRankings
      .filter((row) => row.week === latestWeek)
      .sort((a, b) => a.ranking - b.ranking)
      .slice(0, 25);
  }, [rankings]);

  const topEfficiency = useMemo(
    () => ratings.slice().sort((a, b) => a.rankings.net - b.rankings.net).slice(0, 20),
    [ratings]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/5 bg-zinc-900/80 p-6">
        <h1 className="font-heading text-4xl text-amber-400">College Basketball Betting Hub</h1>
        <p className="mt-2 text-zinc-400">2025-26 Season</p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-zinc-100">Today&apos;s Games</h2>
            <p className="font-mono text-xs text-zinc-400">{formatDate(today)}</p>
          </div>
          <Tabs tabs={["Today", "Recent"]} active={dateMode} onChange={(tab) => setDateMode(tab as "Today" | "Recent")} />
        </div>

        {loading && <Loader />}
        {!loading && error && <ErrorMsg message={error} />}

        {!loading && !error && displayedGames.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 p-8 text-center text-zinc-400">No games found</div>
        )}

        {!loading && !error && displayedGames.length > 0 && (
          <div className="grid gap-4">
            {displayedGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                line={linesMap.get(game.id)}
                homeRating={ratingsMap.get(game.homeTeamId)}
                awayRating={ratingsMap.get(game.awayTeamId)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
          <h3 className="font-heading text-xl text-amber-400">AP Top 25</h3>
          <div className="mt-3 space-y-1">
            {apTop25.map((row) => (
              <Link
                key={`${row.pollDate}-${row.teamId}`}
                href={`/team/${encodeURIComponent(row.team)}`}
                className="grid grid-cols-[34px_1fr_auto] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800"
              >
                <span className="font-mono text-xs text-amber-300">#{row.ranking}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{row.team}</p>
                  <p className="text-xs text-zinc-400">{row.conference}</p>
                </div>
                <span className="font-mono text-xs text-zinc-400">{row.firstPlaceVotes} FPV</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
          <h3 className="font-heading text-xl text-amber-400">Top 20 Adjusted Efficiency</h3>
          <div className="mt-3 space-y-1">
            {topEfficiency.map((row) => (
              <Link
                key={row.teamId}
                href={`/team/${encodeURIComponent(row.team)}`}
                className="grid grid-cols-[32px_1fr_auto_auto_auto] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800"
              >
                <span className="font-mono text-xs text-amber-300">#{row.rankings.net}</span>
                <p className="text-sm font-medium text-zinc-100">{row.team}</p>
                <span className="font-mono text-xs text-zinc-400">Off {dec(row.offensiveRating, 1)}</span>
                <span className="font-mono text-xs text-zinc-400">Def {dec(row.defensiveRating, 1)}</span>
                <span className="font-mono text-xs text-zinc-200">Net {dec(row.netRating, 1)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
