"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BettingLines } from "@/components/BettingLines";
import { BoxScore } from "@/components/BoxScore";
import { LineupCard } from "@/components/LineupCard";
import { ErrorMsg } from "@/components/ui/ErrorMsg";
import { FourFactorsBar } from "@/components/ui/FourFactorsBar";
import { Loader } from "@/components/ui/Loader";
import { StatPill } from "@/components/ui/StatPill";
import { Tabs } from "@/components/ui/Tabs";
import { apiFetch } from "@/lib/api";
import { BettingLine, Game, GamePlayerStats, GameTeamStats, Lineup, Play } from "@/lib/types";
import { dec, formatDate, formatTime, moneyline, pct, sign } from "@/lib/utils";

const SEASON = 2026;

type TabKey = "Overview" | "Box Score" | "Lineups" | "Betting";

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
  const gameId = Number(params.id);

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

      const results = await Promise.allSettled([
        apiFetch<Game[]>("/games", { season: SEASON, id: gameId }),
        apiFetch<GameTeamStats[]>("/games/teams", { season: SEASON, gameId }),
        apiFetch<GamePlayerStats[]>("/games/players", { season: SEASON, gameId }),
        apiFetch<BettingLine[]>("/lines", { season: SEASON, gameId }),
        apiFetch<Lineup[]>(`/lineups/game/${gameId}`),
        apiFetch<Play[]>("/plays", { season: SEASON, gameId }),
      ]);

      if (cancelled) return;

      const nextWarnings: string[] = [];

      const gameResult = results[0];
      let gameMatch: Game | null = null;
      if (gameResult.status === "fulfilled") {
        gameMatch = gameResult.value.find((row) => row.id === gameId) ?? null;
        setGame(gameMatch);
      } else {
        setGame(null);
        nextWarnings.push(`Game info unavailable: ${String(gameResult.reason)}`);
      }

      const teamResult = results[1];
      if (teamResult.status === "fulfilled") {
        setTeamStats(teamResult.value.filter((row) => row.gameId === gameId));
      } else {
        setTeamStats([]);
        nextWarnings.push(`Team stats unavailable: ${String(teamResult.reason)}`);
      }

      const playerResult = results[2];
      if (playerResult.status === "fulfilled") {
        setPlayerStats(playerResult.value.filter((row) => row.gameId === gameId));
      } else {
        setPlayerStats([]);
        nextWarnings.push(`Player stats unavailable: ${String(playerResult.reason)}`);
      }

      const linesResult = results[3];
      if (linesResult.status === "fulfilled") {
        setLines(linesResult.value.find((row) => row.gameId === gameId) ?? null);
      } else {
        setLines(null);
        nextWarnings.push(`Betting lines unavailable: ${String(linesResult.reason)}`);
      }

      const lineupsResult = results[4];
      if (lineupsResult.status === "fulfilled") {
        setLineups(lineupsResult.value);
      } else {
        setLineups([]);
        nextWarnings.push(`Lineups unavailable: ${String(lineupsResult.reason)}`);
      }

      const playsResult = results[5];
      if (playsResult.status === "fulfilled") {
        setPlays(playsResult.value.filter((row) => row.gameId === gameId));
      } else {
        setPlays([]);
        nextWarnings.push(`Play-by-play unavailable: ${String(playsResult.reason)}`);
      }

      if (!gameMatch) {
        setError("Unable to load game details");
      }

      setWarnings(nextWarnings);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

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
    () => [...lineups].sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, 15),
    [lineups]
  );

  const shootingGraphData = useMemo(() => {
    if (!awayTeamStats || !homeTeamStats) return [];

    return [
      {
        metric: "FG%",
        away: Number((awayTeamStats.teamStats.fieldGoals.pct * 100).toFixed(1)),
        home: Number((homeTeamStats.teamStats.fieldGoals.pct * 100).toFixed(1)),
      },
      {
        metric: "3PT%",
        away: Number((awayTeamStats.teamStats.threePointFieldGoals.pct * 100).toFixed(1)),
        home: Number((homeTeamStats.teamStats.threePointFieldGoals.pct * 100).toFixed(1)),
      },
      {
        metric: "FT%",
        away: Number((awayTeamStats.teamStats.freeThrows.pct * 100).toFixed(1)),
        home: Number((homeTeamStats.teamStats.freeThrows.pct * 100).toFixed(1)),
      },
    ];
  }, [awayTeamStats, homeTeamStats]);

  const recentPlays = useMemo(
    () => [...plays].sort((a, b) => a.period - b.period || b.secondsRemaining - a.secondsRemaining).slice(0, 60),
    [plays]
  );

  if (loading) return <Loader />;
  if (error) return <ErrorMsg message={error} />;
  if (!game) return <ErrorMsg message="Game not found" />;

  const isFinal = game.status.toUpperCase().includes("FINAL");
  const isLive =
    game.status.toUpperCase().includes("LIVE") ||
    game.status.toUpperCase().includes("IN PROGRESS");

  const periods = Array.from(
    { length: Math.max(game.homePeriodPoints.length, game.awayPeriodPoints.length) },
    (_, i) => i
  );

  const awayWon = (game.awayPoints ?? -1) > (game.homePoints ?? -1);
  const homeWon = (game.homePoints ?? -1) > (game.awayPoints ?? -1);

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
          {formatDate(game.startDate)} · {formatTime(game.startDate)}
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
              {dec(game.excitement, 2)}
            </span>
          </p>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/5 bg-zinc-800/50 p-3 text-sm">
            <p className="text-zinc-400">Away ELO</p>
            <p className="font-mono text-zinc-100">
              {dec(game.awayTeamEloStart, 1)} → {dec(game.awayTeamEloEnd, 1)}
            </p>
          </div>
          <div className="rounded-lg border border-white/5 bg-zinc-800/50 p-3 text-right text-sm">
            <p className="text-zinc-400">Home ELO</p>
            <p className="font-mono text-zinc-100">
              {dec(game.homeTeamEloStart, 1)} → {dec(game.homeTeamEloEnd, 1)}
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

      <Tabs
        tabs={["Overview", "Box Score", "Lineups", "Betting"]}
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
                      {game.awayPeriodPoints[i] ?? 0}
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
                      {game.homePeriodPoints[i] ?? 0}
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatPill
                  label={`${game.awayTeam} FG%`}
                  value={pct(awayTeamStats.teamStats.fieldGoals.pct)}
                />
                <StatPill
                  label={`${game.homeTeam} FG%`}
                  value={pct(homeTeamStats.teamStats.fieldGoals.pct)}
                  accent
                />
                <StatPill
                  label={`${game.awayTeam} 3PT%`}
                  value={pct(awayTeamStats.teamStats.threePointFieldGoals.pct)}
                />
                <StatPill
                  label={`${game.homeTeam} 3PT%`}
                  value={pct(homeTeamStats.teamStats.threePointFieldGoals.pct)}
                  accent
                />
                <StatPill
                  label="Rebounds"
                  value={`${awayTeamStats.teamStats.rebounds.total} - ${homeTeamStats.teamStats.rebounds.total}`}
                />
                <StatPill
                  label="Turnovers"
                  value={`${awayTeamStats.teamStats.turnovers.total} - ${homeTeamStats.teamStats.turnovers.total}`}
                />
                <StatPill
                  label="Assists"
                  value={`${awayTeamStats.teamStats.assists} - ${homeTeamStats.teamStats.assists}`}
                />
                <StatPill
                  label="Steals"
                  value={`${awayTeamStats.teamStats.steals} - ${homeTeamStats.teamStats.steals}`}
                />
                <StatPill
                  label="Blocks"
                  value={`${awayTeamStats.teamStats.blocks} - ${homeTeamStats.teamStats.blocks}`}
                />
                <StatPill
                  label="Pace"
                  value={`${dec(awayTeamStats.pace, 1)} - ${dec(homeTeamStats.pace, 1)}`}
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
                <h3 className="mb-3 font-heading text-xl text-amber-400">Shooting Graph</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shootingGraphData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis dataKey="metric" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="away" name={game.awayTeam} fill="#a1a1aa" />
                      <Bar dataKey="home" name={game.homeTeam} fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <FourFactorsBar
                factors={[
                  {
                    label: "eFG%",
                    team: awayTeamStats.teamStats.fourFactors.effectiveFieldGoalPct,
                    opponent:
                      homeTeamStats.teamStats.fourFactors.effectiveFieldGoalPct,
                  },
                  {
                    label: "TO Ratio",
                    team: awayTeamStats.teamStats.fourFactors.turnoverRatio,
                    opponent: homeTeamStats.teamStats.fourFactors.turnoverRatio,
                  },
                  {
                    label: "OREB%",
                    team: awayTeamStats.teamStats.fourFactors.offensiveReboundPct,
                    opponent:
                      homeTeamStats.teamStats.fourFactors.offensiveReboundPct,
                  },
                  {
                    label: "FT Rate",
                    team: awayTeamStats.teamStats.fourFactors.freeThrowRate,
                    opponent: homeTeamStats.teamStats.fourFactors.freeThrowRate,
                  },
                ]}
              />
            </>
          )}

          <div className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
            <h3 className="mb-3 font-heading text-xl text-amber-400">Play by Play</h3>
            {recentPlays.length === 0 ? (
              <p className="text-sm text-zinc-400">No play-by-play available.</p>
            ) : (
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {recentPlays.map((play) => (
                  <div
                    key={play.id}
                    className="rounded-lg border border-white/5 bg-zinc-800/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                      <span>
                        P{play.period} · {play.clock}
                      </span>
                      <span className="font-mono">
                        {play.awayScore} - {play.homeScore}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-100">{play.playText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              onPlayerClick={(id) => router.push(`/player/${id}`)}
            />
          )}
          {homePlayers && (
            <BoxScore
              teamData={homePlayers}
              onPlayerClick={(id) => router.push(`/player/${id}`)}
            />
          )}
          {!awayPlayers && !homePlayers && <ErrorMsg message="Box score unavailable." />}
        </section>
      )}

      {tab === "Lineups" && (
        <section className="grid gap-3">
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
