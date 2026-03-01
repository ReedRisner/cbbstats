"use client";

import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { ErrorMsg } from "@/components/ui/ErrorMsg";
import { Loader } from "@/components/ui/Loader";
import { apiFetch } from "@/lib/api";
import { AdjustedRating, BettingLine, Game, Ranking } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const SEASON = 2026;

function toYyyyMmDd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const result = new Date(y, m - 1, d + days);
  return toYyyyMmDd(result);
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(() => toYyyyMmDd(new Date()));
  const [games, setGames] = useState<Game[]>([]);
  const [lines, setLines] = useState<BettingLine[]>([]);
  const [ratings, setRatings] = useState<AdjustedRating[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadByDate() {
      setLoading(true);
      setError(null);

      try {
        const [gamesData, linesData, ratingsData, rankingsData] = await Promise.all([
          apiFetch<Game[]>("/games", {
            season: SEASON,
            startDateRange: `${selectedDate}T00:00:00`,
            endDateRange: `${selectedDate}T23:59:59`,
          }),
          apiFetch<BettingLine[]>("/lines", {
            season: SEASON,
            startDateRange: `${selectedDate}T00:00:00`,
            endDateRange: `${selectedDate}T23:59:59`,
          }),
          apiFetch<AdjustedRating[]>("/ratings/adjusted", { season: SEASON }),
          apiFetch<Ranking[]>("/rankings", { season: SEASON }),
        ]);

        if (!cancelled) {
          const filteredGames = gamesData.filter((game) => toYyyyMmDd(new Date(game.startDate)) === selectedDate);
          setGames(filteredGames);
          setLines(linesData.filter((line) => filteredGames.some((game) => game.id === line.gameId)));
          setRatings(ratingsData);
          setRankings(rankingsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load games for selected date");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadByDate();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const linesMap = useMemo(() => new Map(lines.map((line) => [line.gameId, line])), [lines]);
  const ratingsMap = useMemo(() => new Map(ratings.map((rating) => [rating.teamId, rating])), [ratings]);

  const apTop25 = useMemo(() => {
    const apRankings = rankings.filter((row) => row.pollType.toUpperCase().includes("AP"));
    const latestWeek = apRankings.reduce((maxWeek, row) => Math.max(maxWeek, row.week), 0);

    return apRankings
      .filter((row) => row.week === latestWeek && row.ranking != null)
      .sort((a, b) => (a.ranking ?? Number.MAX_SAFE_INTEGER) - (b.ranking ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 25);
  }, [rankings]);

  const apRankByTeamId = useMemo(() => new Map(apTop25.map((row) => [row.teamId, row.ranking])), [apTop25]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/5 bg-zinc-900/80 p-6">
        <h1 className="font-heading text-3xl text-amber-400">Game Calendar</h1>
        <p className="mt-2 text-zinc-400">Pick a date to view that day&apos;s games.</p>
      </section>

      <section className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
            className="rounded-md border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:border-amber-400/40"
          >
            ← Prev Day
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-md border border-white/10 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200"
          />
          <button
            type="button"
            onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
            className="rounded-md border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:border-amber-400/40"
          >
            Next Day →
          </button>
          <p className="ml-auto font-mono text-xs text-zinc-400">{formatDate(`${selectedDate}T12:00:00`)}</p>
        </div>
      </section>

      {loading && <Loader />}
      {!loading && error && <ErrorMsg message={error} />}

      {!loading && !error && games.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 p-8 text-center text-zinc-400">No games found for this date.</div>
      )}

      {!loading && !error && games.length > 0 && (
        <section className="grid gap-4">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              line={linesMap.get(game.id)}
              homeRating={ratingsMap.get(game.homeTeamId)}
              awayRating={ratingsMap.get(game.awayTeamId)}
              homeApRank={apRankByTeamId.get(game.homeTeamId)}
              awayApRank={apRankByTeamId.get(game.awayTeamId)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
