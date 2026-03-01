"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { ErrorMsg } from "@/components/ui/ErrorMsg";
import { Loader } from "@/components/ui/Loader";
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
  const [gameFilter, setGameFilter] = useState<"top25" | "all" | "conference">("top25");
  const [selectedConference, setSelectedConference] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = toYyyyMmDd(todayDate);

    return {
      display: formatDate(`${day}T12:00:00`),
      start: `${day}T00:00:00`,
      end: `${day}T23:59:59`,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [gamesData, linesData, rankingsData, ratingsData] = await Promise.all([
          apiFetch<Game[]>("/games", {
            season: SEASON,
            startDateRange: today.start,
            endDateRange: today.end,
          }),
          apiFetch<BettingLine[]>("/lines", {
            season: SEASON,
            startDateRange: today.start,
            endDateRange: today.end,
          }),
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
  }, [today.end, today.start]);

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

  const apTop25TeamIds = useMemo(() => new Set(apTop25.map((row) => row.teamId)), [apTop25]);

  const conferenceOptions = useMemo(() => {
    const conferenceSet = new Set<string>();

    games.forEach((game) => {
      if (game.homeConference) conferenceSet.add(game.homeConference);
      if (game.awayConference) conferenceSet.add(game.awayConference);
    });

    return Array.from(conferenceSet).sort((a, b) => a.localeCompare(b));
  }, [games]);

  const displayedGames = useMemo(() => {
    if (gameFilter === "all") return games;

    if (gameFilter === "conference") {
      if (selectedConference === "ALL") return games;
      return games.filter(
        (game) => game.homeConference === selectedConference || game.awayConference === selectedConference
      );
    }

    return games.filter((game) => apTop25TeamIds.has(game.homeTeamId) || apTop25TeamIds.has(game.awayTeamId));
  }, [apTop25TeamIds, gameFilter, games, selectedConference]);

  const topEfficiency = useMemo(
    () => ratings.slice().sort((a, b) => a.rankings.net - b.rankings.net).slice(0, 25),
    [ratings]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/5 bg-zinc-900/80 p-6">
        <h1 className="font-heading text-4xl text-amber-400">College Basketball Betting Hub</h1>
        <p className="mt-2 text-zinc-400">2025-26 Season</p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-zinc-100">Today&apos;s Games</h2>
            <p className="font-mono text-xs text-zinc-400">{today.display}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setGameFilter("top25")}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                gameFilter === "top25"
                  ? "border-amber-400 bg-amber-400/20 text-amber-300"
                  : "border-white/5 bg-zinc-900/80 text-zinc-300 hover:border-white/20"
              }`}
            >
              Top 25 Games
            </button>
            <button
              type="button"
              onClick={() => setGameFilter("all")}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                gameFilter === "all"
                  ? "border-amber-400 bg-amber-400/20 text-amber-300"
                  : "border-white/5 bg-zinc-900/80 text-zinc-300 hover:border-white/20"
              }`}
            >
              All Games
            </button>
            <button
              type="button"
              onClick={() => setGameFilter("conference")}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                gameFilter === "conference"
                  ? "border-amber-400 bg-amber-400/20 text-amber-300"
                  : "border-white/5 bg-zinc-900/80 text-zinc-300 hover:border-white/20"
              }`}
            >
              Conference
            </button>
            <select
              value={selectedConference}
              onChange={(event) => setSelectedConference(event.target.value)}
              className="rounded-md border border-white/10 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={gameFilter !== "conference"}
            >
              <option value="ALL">All Conferences</option>
              {conferenceOptions.map((conference) => (
                <option key={conference} value={conference}>
                  {conference}
                </option>
              ))}
            </select>
          </div>
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
                className="grid grid-cols-[34px_1fr_auto_auto] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800"
              >
                <span className="font-mono text-xs text-amber-300">#{row.ranking}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{row.team}</p>
                  <p className="text-xs text-zinc-400">{row.conference}</p>
                </div>
                <span className="font-mono text-xs text-zinc-400">{row.points} pts</span>
                <span className="font-mono text-xs text-zinc-400">{row.firstPlaceVotes} FPV</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
          <h3 className="font-heading text-xl text-amber-400">Top 25 Adjusted Efficiency</h3>
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
