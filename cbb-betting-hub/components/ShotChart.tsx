"use client";

import { useMemo, useState } from "react";
import { Play } from "@/lib/types";

type TeamFilter = "both" | "home" | "away";
type RangeFilter = "all" | "rim" | "mid" | "three";

interface ShotChartProps {
  plays: Play[];
  homeTeam: string;
  awayTeam: string;
}

type ShotPoint = {
  id: number;
  isHomeTeam: boolean;
  team: string;
  made: boolean;
  x: number;
  y: number;
  player: string;
  rangeBucket: Exclude<RangeFilter, "all">;
  rawRange: string;
};

function toRangeBucket(range: string | undefined): Exclude<RangeFilter, "all"> {
  const text = (range ?? "").toLowerCase();
  if (text.includes("3") || text.includes("three") || text.includes("corner")) return "three";
  if (text.includes("rim") || text.includes("layup") || text.includes("dunk") || text.includes("tip")) return "rim";
  return "mid";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeWidth(rawWidth: number): number {
  // Handle both 0..50 and -25..25 coordinate systems.
  if (rawWidth < 0) return clamp(rawWidth + 25, 0, 50);
  if (rawWidth > 50) return clamp(rawWidth / 2, 0, 50);
  return clamp(rawWidth, 0, 50);
}

export function ShotChart({ plays, homeTeam, awayTeam }: ShotChartProps) {
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("both");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("all");
  const [playerFilter, setPlayerFilter] = useState<string>("all");

  const shots = useMemo<ShotPoint[]>(() => {
    const shotPlays = plays.filter((play) => Boolean(play.shotInfo?.location && Number.isFinite(play.shotInfo.location.x) && Number.isFinite(play.shotInfo.location.y)));

    if (!shotPlays.length) return [];

    const xs = shotPlays.map((play) => play.shotInfo!.location.x);
    const ys = shotPlays.map((play) => play.shotInfo!.location.y);
    const xSpan = Math.max(...xs) - Math.min(...xs);
    const ySpan = Math.max(...ys) - Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    // Prefer known full-court axis (typically > 60 in either feet or normalized 0..100 units).
    const xLooksLikeLength = maxX > 60;
    const yLooksLikeLength = maxY > 60;
    const xIsLengthAxis = xLooksLikeLength && !yLooksLikeLength ? true : !xLooksLikeLength && yLooksLikeLength ? false : xSpan >= ySpan;

    return shotPlays.map((play) => {
      const rawX = play.shotInfo!.location.x;
      const rawY = play.shotInfo!.location.y;
      const lengthCoord = xIsLengthAxis ? rawX : rawY;
      const widthCoord = xIsLengthAxis ? rawY : rawX;

      const fullCourtLength = Math.max(maxX, maxY) > 97 ? 100 : 94;
      const halfCourtLength = fullCourtLength / 2;

      const foldedLength = Math.min(lengthCoord, fullCourtLength - lengthCoord);
      const normalizedLength = clamp((foldedLength / halfCourtLength) * 47, 0, 47);
      const normalizedWidth = normalizeWidth(widthCoord);

      return {
        id: play.id,
        isHomeTeam: play.isHomeTeam,
        team: play.team,
        made: play.shotInfo!.made,
        x: (normalizedWidth / 50) * 470,
        y: (normalizedLength / 47) * 500,
        player: play.shotInfo!.shooter?.name ?? "Unknown",
        rangeBucket: toRangeBucket(play.shotInfo!.range),
        rawRange: play.shotInfo!.range ?? "Unknown",
      };
    });
  }, [plays]);

  const players = useMemo(() => {
    return [...new Set(shots.map((shot) => shot.player))].sort((a, b) => a.localeCompare(b));
  }, [shots]);

  const filteredShots = useMemo(() => {
    return shots.filter((shot) => {
      if (teamFilter === "home" && !shot.isHomeTeam) return false;
      if (teamFilter === "away" && shot.isHomeTeam) return false;
      if (rangeFilter !== "all" && shot.rangeBucket !== rangeFilter) return false;
      if (playerFilter !== "all" && shot.player !== playerFilter) return false;
      return true;
    });
  }, [playerFilter, rangeFilter, shots, teamFilter]);

  const byRange = useMemo(() => {
    const buckets: Record<Exclude<RangeFilter, "all">, { made: number; att: number }> = {
      rim: { made: 0, att: 0 },
      mid: { made: 0, att: 0 },
      three: { made: 0, att: 0 },
    };

    filteredShots.forEach((shot) => {
      buckets[shot.rangeBucket].att += 1;
      if (shot.made) buckets[shot.rangeBucket].made += 1;
    });

    return buckets;
  }, [filteredShots]);

  const made = filteredShots.filter((shot) => shot.made).length;
  const attempts = filteredShots.length;

  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="space-y-1">
          <span className="block text-zinc-400">Team</span>
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value as TeamFilter)} className="rounded border border-white/20 bg-zinc-950 px-2 py-1">
            <option value="both">Both</option>
            <option value="away">{awayTeam}</option>
            <option value="home">{homeTeam}</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-zinc-400">Range</span>
          <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value as RangeFilter)} className="rounded border border-white/20 bg-zinc-950 px-2 py-1">
            <option value="all">All</option>
            <option value="rim">Rim</option>
            <option value="mid">Mid-Range</option>
            <option value="three">3PT</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-zinc-400">Player</span>
          <select value={playerFilter} onChange={(e) => setPlayerFilter(e.target.value)} className="rounded border border-white/20 bg-zinc-950 px-2 py-1">
            <option value="all">All players</option>
            {players.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-white/10 bg-zinc-950 p-2">
        <svg viewBox="0 0 470 500" className="mx-auto h-auto w-full max-w-3xl">
          <g stroke="#3f3f46" strokeWidth="2" fill="none">
            <rect x="0" y="0" width="470" height="500" />
            <rect x="170" y="0" width="130" height="190" />
            <line x1="170" y1="190" x2="300" y2="190" />
            <circle cx="235" cy="60" r="30" />
            <circle cx="235" cy="55" r="7.5" />
            <line x1="45" y1="0" x2="45" y2="140" />
            <line x1="425" y1="0" x2="425" y2="140" />
            <path d="M 45 140 A 190 190 0 0 0 425 140" />
          </g>

          {filteredShots.map((shot) => (
            <circle
              key={shot.id}
              cx={shot.x}
              cy={shot.y}
              r={4}
              fill={shot.made ? "#4ade80" : "none"}
              stroke={shot.made ? "#4ade80" : "#f87171"}
              opacity={0.7}
            >
              <title>{`${shot.player} (${shot.team}) • ${shot.made ? "Made" : "Missed"} • ${shot.rawRange}`}</title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-zinc-300">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#4ade80]" />Made</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-[#f87171]" />Missed</span>
      </div>

      <div className="grid gap-2 text-sm text-zinc-200 md:grid-cols-4">
        <p><span className="text-zinc-400">Total Shots:</span> {attempts}</p>
        <p><span className="text-zinc-400">FG%:</span> {attempts ? ((made / attempts) * 100).toFixed(1) : "0.0"}%</p>
        <p><span className="text-zinc-400">Rim:</span> {byRange.rim.made}/{byRange.rim.att}</p>
        <p><span className="text-zinc-400">Mid:</span> {byRange.mid.made}/{byRange.mid.att}</p>
        <p><span className="text-zinc-400">3PT:</span> {byRange.three.made}/{byRange.three.att}</p>
      </div>
    </section>
  );
}
