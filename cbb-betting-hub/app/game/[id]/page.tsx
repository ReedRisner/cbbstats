"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BettingLines } from "@/components/BettingLines";
import { BoxScore } from "@/components/BoxScore";
import { LineupCard } from "@/components/LineupCard";
import { ErrorMsg } from "@/components/ui/ErrorMsg";
import { Loader } from "@/components/ui/Loader";
import { Tabs } from "@/components/ui/Tabs";
import { apiFetch } from "@/lib/api";
import { BettingLine, Game, GamePlayerStats, GameTeamStats, Lineup, Play } from "@/lib/types";
import { dec, formatDate, formatTimeWithZone, moneyline, normalizePct, pct, sign } from "@/lib/utils";

const SEASON = 2026;

type TabKey = "Overview" | "Box Score" | "Play by Play" | "Lineups" | "Betting";
type LineupSortKey = "minutes" | "offRating" | "defRating" | "netRating" | "points" | "possessions";

type TeamComparisonRow = {
  label: string;
  away: number;
  home: number;
  lowerIsBetter?: boolean;
  percent?: boolean;
  decimals?: number;
};

type ShotZoneSummary = {
  zone: string;
  awayMade: number;
  awayAtt: number;
  homeMade: number;
  homeAtt: number;
};

type PlayFilter = "All" | "1st Half" | "2nd Half" | "OT";

function StatusBadge({
  label,
  tone = "default",
  pulse = false,
}: {
  label: string;
  tone?: "default" | "amber" | "green";
  pulse?: boolean;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
      : tone === "green"
        ? "border-green-400/40 bg-green-400/10 text-green-300"
        : "border-white/10 bg-zinc-800 text-zinc-300";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClass} ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      {label}
    </span>
  );
}

function periodLabel(index: number): string {
  if (index === 0) return "H1";
  if (index === 1) return "H2";
  return `OT${index - 1}`;
}

export default function GameDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = Number(params.id);
  const fallbackHome = searchParams.get("home");
  const fallbackAway = searchParams.get("away");
  const fallbackDate = searchParams.get("date");

  const [tab, setTab] = useState<TabKey>("Overview");
  const [game, setGame] = useState<Game | null>(null);
  const [teamStats, setTeamStats] = useState<GameTeamStats[]>([]);
  const [playerStats, setPlayerStats] = useState<GamePlayerStats[]>([]);
  const [lines, setLines] = useState<BettingLine | null>(null);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [troubleshooting, setTroubleshooting] = useState<string[]>([]);
  const [lineupSort, setLineupSort] = useState<LineupSortKey>("minutes");
  const [playFilter, setPlayFilter] = useState<PlayFilter>("All");

  useEffect(() => {
    if (!Number.isFinite(gameId)) {
      setError("Invalid game ID");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setWarnings([]);
      setTroubleshooting([]);

      const fallbackDay = fallbackDate ? new Date(fallbackDate) : null;
      const fallbackStart =
        fallbackDay && !Number.isNaN(fallbackDay.getTime())
          ? new Date(fallbackDay.getFullYear(), fallbackDay.getMonth(), fallbackDay.getDate())
          : null;
      const fallbackEnd =
        fallbackStart ? new Date(fallbackStart.getFullYear(), fallbackStart.getMonth(), fallbackStart.getDate(), 23, 59, 59) : null;

      const gameLookupConfigs = [
        { label: `GET /games?season=${SEASON}&id=${gameId}`, request: apiFetch<Game[]>("/games", { season: SEASON, id: gameId }) },
        { label: `GET /games?id=${gameId}`, request: apiFetch<Game[]>("/games", { id: gameId }) },
        { label: `GET /games?season=${SEASON - 1}&id=${gameId}`, request: apiFetch<Game[]>("/games", { season: SEASON - 1, id: gameId }) },
        { label: `GET /games?season=${SEASON - 2}&id=${gameId}`, request: apiFetch<Game[]>("/games", { season: SEASON - 2, id: gameId }) },
        ...(fallbackHome && fallbackAway && fallbackStart && fallbackEnd
          ? [
              {
                label: `GET /games?season=${SEASON}&startDateRange=${fallbackStart.toISOString()}&endDateRange=${fallbackEnd.toISOString()} (team-match fallback)`,
                request: apiFetch<Game[]>("/games", {
                  season: SEASON,
                  startDateRange: fallbackStart.toISOString(),
                  endDateRange: fallbackEnd.toISOString(),
                }),
              },
              {
                label: `GET /games?season=${SEASON - 1}&startDateRange=${fallbackStart.toISOString()}&endDateRange=${fallbackEnd.toISOString()} (team-match fallback)`,
                request: apiFetch<Game[]>("/games", {
                  season: SEASON - 1,
                  startDateRange: fallbackStart.toISOString(),
                  endDateRange: fallbackEnd.toISOString(),
                }),
              },
            ]
          : []),
      ];

      const gameLookups = await Promise.allSettled(gameLookupConfigs.map((entry) => entry.request));

      if (cancelled) return;

      const nextWarnings: string[] = [];
      const lookupDebug: string[] = [];

      let gameMatch: Game | null = null;
      for (const [index, lookup] of gameLookups.entries()) {
        const label = gameLookupConfigs[index]?.label ?? `lookup-${index}`;
        if (lookup.status === "fulfilled") {
          lookupDebug.push(`${label} → ${lookup.value.length} results`);
          const byId = lookup.value.find((row) => row.id === gameId) ?? null;
          const byTeams =
            !byId && fallbackHome && fallbackAway
              ? lookup.value.find(
                  (row) =>
                    (row.homeTeam === fallbackHome && row.awayTeam === fallbackAway) ||
                    (row.homeTeam === fallbackAway && row.awayTeam === fallbackHome)
                ) ?? null
              : null;
          gameMatch = byId ?? byTeams ?? gameMatch;
          if (gameMatch) break;
        } else {
          lookupDebug.push(`${label} → failed: ${String(lookup.reason)}`);
        }
      }

      if (!gameMatch) {
        setGame(null);
        setTeamStats([]);
        setPlayerStats([]);
        setLines(null);
        setLineups([]);
        setPlays([]);
        setError("Unable to load game details");
        setTroubleshooting(lookupDebug);
        setLoading(false);
        return;
      }

      const enrichedGameCandidate = gameLookups
        .filter((entry): entry is PromiseFulfilledResult<Game[]> => entry.status === "fulfilled")
        .flatMap((entry) => entry.value)
        .find((row) => row.id === gameId);

      const resolvedGame = enrichedGameCandidate
        ? {
            ...gameMatch,
            awayTeamEloStart: enrichedGameCandidate.awayTeamEloStart ?? gameMatch.awayTeamEloStart,
            awayTeamEloEnd: enrichedGameCandidate.awayTeamEloEnd ?? gameMatch.awayTeamEloEnd,
            homeTeamEloStart: enrichedGameCandidate.homeTeamEloStart ?? gameMatch.homeTeamEloStart,
            homeTeamEloEnd: enrichedGameCandidate.homeTeamEloEnd ?? gameMatch.homeTeamEloEnd,
            excitement: enrichedGameCandidate.excitement ?? gameMatch.excitement,
          }
        : gameMatch;

      setGame(resolvedGame);

      const resolvedSeason = resolvedGame.season ?? SEASON;
      const awayTeam = resolvedGame.awayTeam;
      const homeTeam = resolvedGame.homeTeam;

      const fetchByTeam = async <T extends { gameId: number }>(endpoint: string) => {
        const [awayRows, homeRows] = await Promise.all([
          apiFetch<T[]>(endpoint, { season: resolvedSeason, team: awayTeam }),
          apiFetch<T[]>(endpoint, { season: resolvedSeason, team: homeTeam }),
        ]);
        return [...awayRows, ...homeRows];
      };

      const results = await Promise.allSettled([
        fetchByTeam<GameTeamStats>("/games/teams"),
        fetchByTeam<GamePlayerStats>("/games/players"),
        fetchByTeam<BettingLine>("/lines"),
        apiFetch<Lineup[]>(`/lineups/game/${gameId}`),
        apiFetch<Play[]>(`/plays/game/${gameId}`),
      ]);

      if (cancelled) return;

      const teamResult = results[0];
      if (teamResult.status === "fulfilled") {
        setTeamStats(teamResult.value.filter((row) => row.gameId === gameId));
      } else {
        setTeamStats([]);
        nextWarnings.push(`Team stats unavailable: ${String(teamResult.reason)}`);
      }

      const playerResult = results[1];
      if (playerResult.status === "fulfilled") {
        setPlayerStats(playerResult.value.filter((row) => row.gameId === gameId));
      } else {
        setPlayerStats([]);
        nextWarnings.push(`Player stats unavailable: ${String(playerResult.reason)}`);
      }

      const linesResult = results[2];
      if (linesResult.status === "fulfilled") {
        setLines(linesResult.value.find((row) => row.gameId === gameId) ?? null);
      } else {
        setLines(null);
        nextWarnings.push(`Betting lines unavailable: ${String(linesResult.reason)}`);
      }

      const lineupsResult = results[3];
      if (lineupsResult.status === "fulfilled") {
        setLineups(lineupsResult.value);
      } else {
        setLineups([]);
        nextWarnings.push(`Lineups unavailable: ${String(lineupsResult.reason)}`);
      }

      const playsResult = results[4];
      if (playsResult.status === "fulfilled") {
        setPlays(playsResult.value.filter((row) => row.gameId === gameId));
      } else {
        setPlays([]);
        nextWarnings.push(`Play-by-play unavailable: ${String(playsResult.reason)}`);
      }

      setWarnings(nextWarnings);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fallbackAway, fallbackDate, fallbackHome, gameId]);

  const awayTeamStats = useMemo(
    () => teamStats.find((row) => row.gameId === gameId && !row.isHome) ?? null,
    [gameId, teamStats]
  );
  const homeTeamStats = useMemo(
    () => teamStats.find((row) => row.gameId === gameId && row.isHome) ?? null,
    [gameId, teamStats]
  );
  const awayPlayers = useMemo(
    () => playerStats.find((row) => row.gameId === gameId && !row.isHome) ?? null,
    [gameId, playerStats]
  );
  const homePlayers = useMemo(
    () => playerStats.find((row) => row.gameId === gameId && row.isHome) ?? null,
    [gameId, playerStats]
  );

  const sortedLineups = useMemo(
    () =>
      [...lineups]
        .sort((a, b) => {
          if (lineupSort === "minutes") return b.totalSeconds - a.totalSeconds;
          if (lineupSort === "offRating") return b.offenseRating - a.offenseRating;
          if (lineupSort === "defRating") return a.defenseRating - b.defenseRating;
          if (lineupSort === "netRating") return b.netRating - a.netRating;
          if (lineupSort === "points") return b.teamStats.points - a.teamStats.points;
          return b.teamStats.possessions - a.teamStats.possessions;
        })
        .slice(0, 15),
    [lineupSort, lineups]
  );

  const teamComparisonRows = useMemo<TeamComparisonRow[]>(() => {
    if (!awayTeamStats || !homeTeamStats) return [];

    return [
      { label: "Points", away: awayTeamStats.teamStats.points.total, home: homeTeamStats.teamStats.points.total },
      { label: "FG%", away: awayTeamStats.teamStats.fieldGoals.pct, home: homeTeamStats.teamStats.fieldGoals.pct, percent: true },
      { label: "3PT%", away: awayTeamStats.teamStats.threePointFieldGoals.pct, home: homeTeamStats.teamStats.threePointFieldGoals.pct, percent: true },
      { label: "FT%", away: awayTeamStats.teamStats.freeThrows.pct, home: homeTeamStats.teamStats.freeThrows.pct, percent: true },
      { label: "Rebounds", away: awayTeamStats.teamStats.rebounds.total, home: homeTeamStats.teamStats.rebounds.total },
      { label: "Assists", away: awayTeamStats.teamStats.assists, home: homeTeamStats.teamStats.assists },
      { label: "Steals", away: awayTeamStats.teamStats.steals, home: homeTeamStats.teamStats.steals },
      { label: "Blocks", away: awayTeamStats.teamStats.blocks, home: homeTeamStats.teamStats.blocks },
      { label: "Turnovers", away: awayTeamStats.teamStats.turnovers.total, home: homeTeamStats.teamStats.turnovers.total, lowerIsBetter: true },
      { label: "Pace", away: awayTeamStats.pace, home: homeTeamStats.pace, decimals: 1 },
      { label: "Off Rating", away: awayTeamStats.teamStats.rating, home: homeTeamStats.teamStats.rating, decimals: 1 },
      { label: "True Shooting%", away: awayTeamStats.teamStats.trueShooting, home: homeTeamStats.teamStats.trueShooting, percent: true },
    ];
  }, [awayTeamStats, homeTeamStats]);

  const shotZoneSummary = useMemo<ShotZoneSummary[]>(() => {
    const zoneBuckets = ["Rim", "Paint", "Mid-Range", "Corner 3", "Three Point", "Free Throw", "Other"];
    const toZone = (range: string | undefined) => {
      const text = (range ?? "").toLowerCase();
      if (!text) return "Other";
      if (text.includes("free throw")) return "Free Throw";
      if (text.includes("corner") && text.includes("3")) return "Corner 3";
      if (text.includes("3") || text.includes("three")) return "Three Point";
      if (text.includes("rim") || text.includes("layup") || text.includes("dunk") || text.includes("tip")) return "Rim";
      if (text.includes("paint")) return "Paint";
      if (text.includes("mid" ) || text.includes("jumper") || text.includes("two")) return "Mid-Range";
      return "Other";
    };

    const summary = new Map<string, ShotZoneSummary>();
    zoneBuckets.forEach((zone) => summary.set(zone, { zone, awayMade: 0, awayAtt: 0, homeMade: 0, homeAtt: 0 }));

    plays.forEach((play) => {
      if (!play.shootingPlay || !play.shotInfo) return;
      const zone = toZone(play.shotInfo.range);
      const bucket = summary.get(zone) ?? { zone, awayMade: 0, awayAtt: 0, homeMade: 0, homeAtt: 0 };
      if (play.isHomeTeam) {
        bucket.homeAtt += 1;
        if (play.shotInfo.made) bucket.homeMade += 1;
      } else {
        bucket.awayAtt += 1;
        if (play.shotInfo.made) bucket.awayMade += 1;
      }
      summary.set(zone, bucket);
    });

    return zoneBuckets.map((zone) => summary.get(zone)!).filter((zone) => zone.awayAtt + zone.homeAtt > 0);
  }, [plays]);

  const filteredPlays = useMemo(() => {
    const sorted = [...plays].sort((a, b) => a.period - b.period || b.secondsRemaining - a.secondsRemaining);
    if (playFilter === "1st Half") return sorted.filter((play) => play.period === 1);
    if (playFilter === "2nd Half") return sorted.filter((play) => play.period === 2);
    if (playFilter === "OT") return sorted.filter((play) => play.period > 2);
    return sorted;
  }, [playFilter, plays]);

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMsg message={error} />
        {troubleshooting.length > 0 && (
          <section className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
            <h3 className="font-semibold text-red-300">Troubleshooting</h3>
            <p className="mt-1 text-xs text-red-200">Game could not be resolved by ID with the attempted lookups:</p>
            <div className="mt-2 space-y-1 text-xs text-zinc-200">
              {troubleshooting.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-300">Try opening the game from Calendar for that date, or verify the game ID exists in the API.</p>
          </section>
        )}
      </div>
    );
  }
  if (!game) return <ErrorMsg message="Game not found" />;

  const isFinal = game.status.toUpperCase().includes("FINAL");
  const isLive =
    game.status.toUpperCase().includes("LIVE") ||
    game.status.toUpperCase().includes("IN PROGRESS");

  const homePeriodPoints = game.homePeriodPoints ?? [];
  const awayPeriodPoints = game.awayPeriodPoints ?? [];

  const periods = Array.from(
    { length: Math.max(homePeriodPoints.length, awayPeriodPoints.length) },
    (_, i) => i
  );

  const awayWon = (game.awayPoints ?? -1) > (game.homePoints ?? -1);
  const homeWon = (game.homePoints ?? -1) > (game.awayPoints ?? -1);

  const awayEloDelta = game.awayTeamEloStart != null && game.awayTeamEloEnd != null
    ? game.awayTeamEloEnd - game.awayTeamEloStart
    : null;
  const homeEloDelta = game.homeTeamEloStart != null && game.homeTeamEloEnd != null
    ? game.homeTeamEloEnd - game.homeTeamEloStart
    : null;
  const excitementIndex = game.excitement ?? (game.homePoints != null && game.awayPoints != null ? Math.max(0, 100 - Math.abs(game.homePoints - game.awayPoints)) : null);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/5 bg-zinc-900/80 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-md border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:border-amber-400/50 hover:text-amber-300"
          >
            ← Back to Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {isFinal && <StatusBadge label="Final" tone="green" />}
            {isLive && <StatusBadge label="Live" tone="amber" pulse />}
            {game.conferenceGame && <StatusBadge label="Conference" />}
          </div>
        </div>

        <p className="font-mono text-xs text-zinc-400">
          {formatDate(game.startDate)} · {formatTimeWithZone(game.startDate)}
        </p>

        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <Link
            href={`/team/${encodeURIComponent(game.awayTeam)}`}
            className="rounded-lg border border-white/5 bg-zinc-800/70 p-3 text-left hover:border-amber-400/40"
          >
            <p className="font-semibold text-zinc-100">{game.awayTeam}</p>
            <p className="text-xs text-zinc-400">
              {game.awayConference}
              {game.awaySeed ? ` · Seed ${game.awaySeed}` : ""}
            </p>
          </Link>

          <div className="text-center font-mono text-4xl">
            <span className={awayWon ? "text-amber-400" : "text-zinc-100"}>
              {game.awayPoints ?? "—"}
            </span>
            <span className="px-2 text-zinc-500">-</span>
            <span className={homeWon ? "text-amber-400" : "text-zinc-100"}>
              {game.homePoints ?? "—"}
            </span>
          </div>

          <Link
            href={`/team/${encodeURIComponent(game.homeTeam)}`}
            className="rounded-lg border border-white/5 bg-zinc-800/70 p-3 text-right hover:border-amber-400/40"
          >
            <p className="font-semibold text-zinc-100">{game.homeTeam}</p>
            <p className="text-xs text-zinc-400">
              {game.homeConference}
              {game.homeSeed ? ` · Seed ${game.homeSeed}` : ""}
            </p>
          </Link>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-zinc-300 md:grid-cols-2">
          <p>
            {game.venue ?? "TBD venue"}
            {game.city || game.state
              ? ` · ${[game.city, game.state].filter(Boolean).join(", ")}`
              : ""}
            {game.attendance
              ? ` · Attendance ${game.attendance.toLocaleString()}`
              : ""}
          </p>
          <p className="text-right">
            Excitement Index:{" "}
            <span className="font-mono text-amber-300">
              {dec(excitementIndex, 2)}
            </span>
          </p>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/5 bg-zinc-800/50 p-3 text-sm">
            <p className="text-zinc-400">Away ELO</p>
            <p className="font-mono text-zinc-100">
              {dec(game.awayTeamEloStart, 1)} → {dec(game.awayTeamEloEnd, 1)} ({awayEloDelta == null ? "—" : `${awayEloDelta >= 0 ? "+" : ""}${dec(awayEloDelta, 1)}`})
            </p>
          </div>
          <div className="rounded-lg border border-white/5 bg-zinc-800/50 p-3 text-right text-sm">
            <p className="text-zinc-400">Home ELO</p>
            <p className="font-mono text-zinc-100">
              {dec(game.homeTeamEloStart, 1)} → {dec(game.homeTeamEloEnd, 1)} ({homeEloDelta == null ? "—" : `${homeEloDelta >= 0 ? "+" : ""}${dec(homeEloDelta, 1)}`})
            </p>
          </div>
        </div>
      </section>

      {warnings.length > 0 && (
        <section className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs text-amber-200">
          {warnings.map((warning) => (
            <p key={warning}>• {warning}</p>
          ))}
        </section>
      )}

      {troubleshooting.length > 0 && (
        <section className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
          <h3 className="font-semibold text-red-300">Troubleshooting</h3>
          <p className="mt-1 text-xs text-red-200">Game could not be resolved by ID with the attempted lookups:</p>
          <div className="mt-2 space-y-1 text-xs text-zinc-200">
            {troubleshooting.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-300">Try opening the game from the Calendar page for that date, then re-open details from the card.</p>
        </section>
      )}

      <Tabs
        tabs={["Overview", "Box Score", "Play by Play", "Lineups", "Betting"]}
        active={tab}
        onChange={(next) => setTab(next as TabKey)}
      />

      {tab === "Overview" && (
        <section className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/80 p-4">
            <h3 className="mb-3 font-heading text-xl text-amber-400">Period Scoring</h3>
            <table className="min-w-[640px] w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-2 py-2 text-left">Team</th>
                  {periods.map((i) => (
                    <th key={i} className="px-2 py-2 text-right">
                      {periodLabel(i)}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-2 text-zinc-100">{game.awayTeam}</td>
                  {periods.map((i) => (
                    <td key={i} className="px-2 py-2 text-right font-mono">
                      {awayPeriodPoints[i] ?? 0}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right font-mono text-zinc-100">
                    {game.awayPoints ?? "—"}
                  </td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-2 text-zinc-100">{game.homeTeam}</td>
                  {periods.map((i) => (
                    <td key={i} className="px-2 py-2 text-right font-mono">
                      {homePeriodPoints[i] ?? 0}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right font-mono text-zinc-100">
                    {game.homePoints ?? "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {awayTeamStats && homeTeamStats && (
            <>
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/80 p-4">
                <h3 className="mb-3 font-heading text-xl text-amber-400">Team Stats Comparison</h3>
                <table className="min-w-[720px] w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-zinc-400">
                      <th className="px-2 py-2 text-left">Stat</th>
                      <th className="px-2 py-2 text-right">{game.awayTeam}</th>
                      <th className="px-2 py-2 text-right">{game.homeTeam}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamComparisonRows.map((row) => {
                      const awayDisplay = row.percent ? pct(row.away) : dec(row.away, row.decimals ?? 0);
                      const homeDisplay = row.percent ? pct(row.home) : dec(row.home, row.decimals ?? 0);
                      const awayBetter = row.lowerIsBetter ? row.away < row.home : row.away > row.home;
                      const homeBetter = row.lowerIsBetter ? row.home < row.away : row.home > row.away;

                      return (
                        <tr key={row.label} className="border-t border-white/10">
                          <td className="px-2 py-2 text-zinc-300">{row.label}</td>
                          <td className={`px-2 py-2 text-right font-mono ${awayBetter ? "text-green-400" : "text-zinc-100"}`}>
                            {awayDisplay}
                          </td>
                          <td className={`px-2 py-2 text-right font-mono ${homeBetter ? "text-green-400" : "text-zinc-100"}`}>
                            {homeDisplay}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
                <h3 className="mb-3 font-heading text-xl text-amber-400">Shot Zones (Made/Attempted)</h3>
                {shotZoneSummary.length === 0 ? (
                  <p className="text-sm text-zinc-400">No shot zone data available.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {shotZoneSummary.map((zone) => (
                      <div key={zone.zone} className="rounded-lg border border-white/10 bg-zinc-800/50 p-3">
                        <p className="text-sm font-semibold text-zinc-100">{zone.zone}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-zinc-400">{game.awayTeam}</p>
                            <p className="font-mono text-zinc-100">{zone.awayMade}/{zone.awayAtt} ({zone.awayAtt ? ((zone.awayMade / zone.awayAtt) * 100).toFixed(1) : "0.0"}%)</p>
                          </div>
                          <div>
                            <p className="text-zinc-400">{game.homeTeam}</p>
                            <p className="font-mono text-zinc-100">{zone.homeMade}/{zone.homeAtt} ({zone.homeAtt ? ((zone.homeMade / zone.homeAtt) * 100).toFixed(1) : "0.0"}%)</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/80 p-4">
                <h3 className="mb-3 font-heading text-xl text-amber-400">Four Factors</h3>
                <table className="min-w-[560px] w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-zinc-400">
                      <th className="px-2 py-2 text-left">Factor</th>
                      <th className="px-2 py-2 text-right">{game.awayTeam}</th>
                      <th className="px-2 py-2 text-right">{game.homeTeam}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: "eFG%",
                        away: normalizePct(awayTeamStats.teamStats.fourFactors.effectiveFieldGoalPct) ?? 0,
                        home: normalizePct(homeTeamStats.teamStats.fourFactors.effectiveFieldGoalPct) ?? 0,
                        lowerIsBetter: false,
                      },
                      {
                        label: "TO Ratio",
                        away: normalizePct(awayTeamStats.teamStats.fourFactors.turnoverRatio) ?? 0,
                        home: normalizePct(homeTeamStats.teamStats.fourFactors.turnoverRatio) ?? 0,
                        lowerIsBetter: true,
                      },
                      {
                        label: "OREB%",
                        away: normalizePct(awayTeamStats.teamStats.fourFactors.offensiveReboundPct) ?? 0,
                        home: normalizePct(homeTeamStats.teamStats.fourFactors.offensiveReboundPct) ?? 0,
                        lowerIsBetter: false,
                      },
                      {
                        label: "FT Rate",
                        away: normalizePct(awayTeamStats.teamStats.fourFactors.freeThrowRate) ?? 0,
                        home: normalizePct(homeTeamStats.teamStats.fourFactors.freeThrowRate) ?? 0,
                        lowerIsBetter: false,
                      },
                    ].map((factor) => {
                      const awayBetter = factor.lowerIsBetter ? factor.away < factor.home : factor.away > factor.home;
                      const homeBetter = factor.lowerIsBetter ? factor.home < factor.away : factor.home > factor.away;

                      return (
                        <tr key={factor.label} className="border-t border-white/10">
                          <td className="px-2 py-2 text-zinc-300">{factor.label}</td>
                          <td className={`px-2 py-2 text-right font-mono ${awayBetter ? "text-green-400" : "text-zinc-100"}`}>{dec(factor.away, 1)}</td>
                          <td className={`px-2 py-2 text-right font-mono ${homeBetter ? "text-green-400" : "text-zinc-100"}`}>{dec(factor.home, 1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </>
          )}

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm">
            <h3 className="mb-2 font-semibold text-amber-300">Betting Snapshot</h3>
            {!lines?.lines?.[0] ? (
              <p className="text-zinc-400">No line data available.</p>
            ) : (
              <div className="grid gap-1 font-mono text-zinc-100 sm:grid-cols-2">
                <p>Spread: {sign(lines.lines[0].spread)}</p>
                <p>O/U: {dec(lines.lines[0].overUnder, 1)}</p>
                <p>Home ML: {moneyline(lines.lines[0].homeMoneyline)}</p>
                <p>Away ML: {moneyline(lines.lines[0].awayMoneyline)}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "Box Score" && (
        <section className="space-y-4">
          {awayPlayers && (
            <BoxScore
              teamData={awayPlayers}
              teamTotals={awayTeamStats?.teamStats}
              onPlayerClick={(id) => router.push(`/player/${id}`)}
            />
          )}
          {homePlayers && (
            <BoxScore
              teamData={homePlayers}
              teamTotals={homeTeamStats?.teamStats}
              onPlayerClick={(id) => router.push(`/player/${id}`)}
            />
          )}
          {!awayPlayers && !homePlayers && <ErrorMsg message="Box score unavailable." />}
        </section>
      )}


      {tab === "Play by Play" && (
        <section className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
          <h3 className="mb-3 font-heading text-xl text-amber-400">Play by Play</h3>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {(["All", "1st Half", "2nd Half", "OT"] as PlayFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPlayFilter(value)}
                className={`rounded-md border px-2 py-1 ${playFilter === value ? "border-amber-400 bg-amber-400/20 text-amber-300" : "border-white/10 bg-zinc-800 text-zinc-300"}`}
              >
                {value}
              </button>
            ))}
          </div>
          {filteredPlays.length === 0 ? (
            <p className="text-sm text-zinc-400">No play-by-play available.</p>
          ) : (
            <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {filteredPlays.map((play) => (
                <div key={play.id} className="rounded-lg border border-white/5 bg-zinc-800/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>P{play.period} · {play.clock}</span>
                    <span className="font-mono">{play.awayScore} - {play.homeScore}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-100">{play.playText}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "Lineups" && (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/80 p-3 text-sm">
            <span className="text-zinc-400">Sort by:</span>
            {[
              ["minutes", "Minutes"],
              ["offRating", "Off Rtg"],
              ["defRating", "Def Rtg"],
              ["netRating", "Net"],
              ["points", "Points"],
              ["possessions", "Poss"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setLineupSort(value as LineupSortKey)}
                className={`rounded-md border px-2 py-1 ${
                  lineupSort === value
                    ? "border-amber-400 bg-amber-400/20 text-amber-300"
                    : "border-white/10 bg-zinc-800 text-zinc-300 hover:border-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {sortedLineups.map((lineup) => (
            <LineupCard
              key={`${lineup.idHash}-${lineup.teamId}`}
              lineup={lineup}
              onPlayerClick={(id) => router.push(`/player/${id}`)}
            />
          ))}
          {sortedLineups.length === 0 && (
            <ErrorMsg message="No lineup data available." />
          )}
        </section>
      )}

      {tab === "Betting" && <BettingLines lines={lines} game={game} />}
    </div>
  );
}
