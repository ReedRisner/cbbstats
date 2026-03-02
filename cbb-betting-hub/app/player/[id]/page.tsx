"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PlayerGameLog } from "@/components/PlayerGameLog";
import { ShootingBreakdown } from "@/components/ShootingBreakdown";
import { ErrorMsg } from "@/components/ui/ErrorMsg";
import { Loader } from "@/components/ui/Loader";
import { StatPill } from "@/components/ui/StatPill";
import { Tabs } from "@/components/ui/Tabs";
import { apiFetch } from "@/lib/api";
import { GamePlayerStats, PlayerSeasonStats, ShootingSeasonStats, TeamRoster } from "@/lib/types";
import { dec, heightStr, perGame, pct } from "@/lib/utils";

const SEASON = 2026;

type PlayerTab = "Season Stats" | "Game Log" | "Shooting";

export default function PlayerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const playerId = Number(params.id);
  const fallbackName = searchParams.get("name");

  const [activeTab, setActiveTab] = useState<PlayerTab>("Season Stats");
  const [seasonStats, setSeasonStats] = useState<PlayerSeasonStats | null>(null);
  const [gameStats, setGameStats] = useState<GamePlayerStats[]>([]);
  const [shootingStats, setShootingStats] = useState<ShootingSeasonStats | null>(null);
  const [bio, setBio] = useState<TeamRoster["players"][number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!Number.isFinite(playerId)) {
      setError("Invalid player ID");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setWarnings([]);

      const results = await Promise.allSettled([
        apiFetch<PlayerSeasonStats[]>("/stats/player/season", { season: SEASON, athleteId: playerId }),
        apiFetch<GamePlayerStats[]>("/games/players", { season: SEASON, athleteId: playerId }),
        apiFetch<ShootingSeasonStats[]>("/stats/player/shooting/season", { season: SEASON, athleteId: playerId }),
      ]);

      if (cancelled) return;

      const nextWarnings: string[] = [];

      const seasonResult = results[0];
      let nextSeasonStats: PlayerSeasonStats | null = null;
      if (seasonResult.status === "fulfilled") {
        nextSeasonStats = seasonResult.value[0] ?? null;
        setSeasonStats(nextSeasonStats);
      } else {
        setSeasonStats(null);
        nextWarnings.push(`Season stats unavailable: ${String(seasonResult.reason)}`);
      }

      const gamesResult = results[1];
      if (gamesResult.status === "fulfilled") {
        setGameStats(gamesResult.value);
      } else {
        setGameStats([]);
        nextWarnings.push(`Game log unavailable: ${String(gamesResult.reason)}`);
      }

      const shootingResult = results[2];
      if (shootingResult.status === "fulfilled") {
        setShootingStats(shootingResult.value[0] ?? null);
      } else {
        setShootingStats(null);
        nextWarnings.push(`Shooting stats unavailable: ${String(shootingResult.reason)}`);
      }

      if (nextSeasonStats?.team) {
        const rosterResult = await Promise.allSettled([
          apiFetch<TeamRoster[]>("/teams/roster", { season: SEASON, team: nextSeasonStats.team }),
        ]);

        if (!cancelled) {
          const rosterValue = rosterResult[0];
          if (rosterValue.status === "fulfilled") {
            const rosterPlayers = rosterValue.value[0]?.players ?? [];
            setBio(rosterPlayers.find((player) => player.id === playerId) ?? null);
          } else {
            setBio(null);
            nextWarnings.push(`Roster bio unavailable: ${String(rosterValue.reason)}`);
          }
        }
      } else {
        setBio(null);
      }

      if (!cancelled) {
        if (!nextSeasonStats && nextWarnings.length >= 3) {
          setError("Unable to load player details");
        }
        setWarnings(nextWarnings);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const name = seasonStats?.name ?? shootingStats?.athleteName ?? fallbackName ?? `Player #${playerId}`;
  const ppg = seasonStats ? perGame(seasonStats.points, seasonStats.games) : "—";

  const perGameStats = useMemo(
    () => [
      { label: "Games/Starts", value: seasonStats ? `${seasonStats.games}/${seasonStats.starts}` : "—" },
      { label: "Minutes/G", value: seasonStats ? perGame(seasonStats.minutes, seasonStats.games) : "—", accent: true },
      { label: "PPG", value: seasonStats ? perGame(seasonStats.points, seasonStats.games) : "—", accent: true },
      { label: "RPG", value: seasonStats ? perGame(seasonStats.rebounds.total, seasonStats.games) : "—", accent: true },
      { label: "APG", value: seasonStats ? perGame(seasonStats.assists, seasonStats.games) : "—", accent: true },
      { label: "SPG", value: seasonStats ? perGame(seasonStats.steals, seasonStats.games) : "—" },
      { label: "BPG", value: seasonStats ? perGame(seasonStats.blocks, seasonStats.games) : "—" },
      { label: "TO/G", value: seasonStats ? perGame(seasonStats.turnovers, seasonStats.games) : "—" },
      { label: "FG%", value: seasonStats ? pct(seasonStats.fieldGoals.pct) : "—" },
      { label: "3PT%", value: seasonStats ? pct(seasonStats.threePointFieldGoals.pct) : "—" },
    ],
    [seasonStats]
  );

  if (loading) return <Loader />;
  if (error) return <ErrorMsg message={error} />;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <button
              type="button"
              className="rounded-md border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-amber-400/50 hover:text-amber-300"
              onClick={() => router.back()}
            >
              ← Back
            </button>

            <div>
              <h1 className="font-heading text-4xl text-zinc-100">{name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-zinc-400">
                {seasonStats?.team ? (
                  <>
                    <Link href={`/team/${encodeURIComponent(seasonStats.team)}`} className="font-medium text-amber-300 hover:text-amber-200">
                      {seasonStats.team}
                    </Link>
                    <span>•</span>
                  </>
                ) : null}
                <span>{seasonStats?.conference ?? "—"}</span>
                <span>•</span>
                <span>{seasonStats?.position || bio?.position || "—"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-300">
              <span>#{bio?.jersey || "—"}</span>
              <span>{heightStr(bio?.height ?? null)}</span>
              <span>{bio?.weight ? `${bio.weight} lbs` : "—"}</span>
              <span>
                {bio?.hometown?.city && bio?.hometown?.state ? `${bio.hometown.city}, ${bio.hometown.state}` : "—"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-4 text-right">
            <p className="text-xs uppercase tracking-wide text-zinc-300">PPG</p>
            <p className="font-mono text-5xl text-amber-300">{ppg}</p>
          </div>
        </div>
      </header>

      {warnings.length > 0 ? <ErrorMsg message={warnings.join(" • ")} /> : null}

      <Tabs tabs={["Season Stats", "Game Log", "Shooting"]} active={activeTab} onChange={(tab) => setActiveTab(tab as PlayerTab)} />

      {activeTab === "Season Stats" ? (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {perGameStats.map((item) => (
              <StatPill key={item.label} label={item.label} value={item.value} accent={item.accent} />
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
            <h2 className="mb-3 text-sm uppercase tracking-wide text-zinc-400">Advanced Metrics</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatPill label="Usage" value={pct(seasonStats?.usage)} accent />
              <StatPill label="Off Rating" value={dec(seasonStats?.offensiveRating, 1)} />
              <StatPill label="Def Rating" value={dec(seasonStats?.defensiveRating, 1)} />
              <StatPill label="Net Rating" value={dec(seasonStats?.netRating, 1)} accent />
              <StatPill label="eFG%" value={pct(seasonStats?.effectiveFieldGoalPct)} />
              <StatPill label="TS%" value={pct(seasonStats?.trueShootingPct)} accent />
              <StatPill label="AST/TO" value={dec(seasonStats?.assistsTurnoverRatio, 2)} />
              <StatPill label="FT Rate" value={pct(seasonStats?.freeThrowRate)} />
              <StatPill label="OREB%" value={pct(seasonStats?.offensiveReboundPct)} />
              <StatPill label="PORPAG" value={dec(seasonStats?.PORPAG, 2)} accent />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SplitCard label="FG" made={seasonStats?.fieldGoals.made} attempted={seasonStats?.fieldGoals.attempted} value={seasonStats?.fieldGoals.pct} />
            <SplitCard
              label="3PT"
              made={seasonStats?.threePointFieldGoals.made}
              attempted={seasonStats?.threePointFieldGoals.attempted}
              value={seasonStats?.threePointFieldGoals.pct}
            />
            <SplitCard label="FT" made={seasonStats?.freeThrows.made} attempted={seasonStats?.freeThrows.attempted} value={seasonStats?.freeThrows.pct} />
          </div>

          {seasonStats?.winShares ? (
            <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
              <h2 className="mb-3 text-sm uppercase tracking-wide text-zinc-400">Win Shares</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatPill label="Total" value={dec(seasonStats.winShares.total, 2)} />
                <StatPill label="Offensive" value={dec(seasonStats.winShares.offensive, 2)} />
                <StatPill label="Defensive" value={dec(seasonStats.winShares.defensive, 2)} />
                <StatPill label="Per 40" value={dec(seasonStats.winShares.totalPer40, 2)} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "Game Log" ? <PlayerGameLog gameStats={gameStats} playerId={playerId} onGameClick={(gameId) => router.push(`/game/${gameId}`)} /> : null}

      {activeTab === "Shooting" ? (
        shootingStats ? (
          <ShootingBreakdown stats={shootingStats} />
        ) : (
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 text-sm text-zinc-400">No shooting breakdown available.</div>
        )
      ) : null}
    </div>
  );
}

function SplitCard({
  label,
  made,
  attempted,
  value,
}: {
  label: string;
  made: number | undefined;
  attempted: number | undefined;
  value: number | undefined;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 font-mono text-3xl text-zinc-100">
        {made != null && attempted != null ? `${made}-${attempted}` : "—"}
      </p>
      <p className="font-semibold text-amber-300">{pct(value)}</p>
    </div>
  );
}
