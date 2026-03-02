"use client";

import { useMemo, useState } from "react";
import { ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { AdjustedRating } from "@/lib/types";
import { dec } from "@/lib/utils";

interface EfficiencyScatterProps {
  ratings: AdjustedRating[];
  onTeamClick: (teamName: string) => void;
}

type ScatterPoint = AdjustedRating & { yPlot: number; fill: string; size: number };

export function EfficiencyScatter({ ratings, onTeamClick }: EfficiencyScatterProps) {
  const [activeTeam, setActiveTeam] = useState<string | null>(null);

  const avgOff = useMemo(() => ratings.reduce((sum, team) => sum + team.offensiveRating, 0) / (ratings.length || 1), [ratings]);
  const avgDef = useMemo(() => ratings.reduce((sum, team) => sum + team.defensiveRating, 0) / (ratings.length || 1), [ratings]);

  const points = useMemo<ScatterPoint[]>(
    () =>
      ratings.map((team) => {
        const isTop25 = (team.rankings?.net ?? 999) <= 25;
        const isActive = activeTeam === team.team;
        return {
          ...team,
          yPlot: -team.defensiveRating,
          fill: isActive ? "#ffffff" : isTop25 ? "#fbbf24" : "#71717a",
          size: isActive ? 150 : 90,
        };
      }),
    [activeTeam, ratings]
  );

  const xDomain = useMemo(() => {
    const vals = ratings.map((r) => r.offensiveRating);
    return [Math.min(...vals) - 1, Math.max(...vals) + 1];
  }, [ratings]);

  const yDomain = useMemo(() => {
    const vals = ratings.map((r) => -r.defensiveRating);
    return [Math.min(...vals) - 1, Math.max(...vals) + 1];
  }, [ratings]);

  if (!ratings.length) {
    return <section className="rounded-xl border border-white/10 bg-zinc-900/70 p-4 text-sm text-zinc-400">No efficiency ratings available.</section>;
  }

  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
      <div className="h-[460px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 30, right: 24, left: 8, bottom: 24 }}>
            <XAxis type="number" dataKey="offensiveRating" name="Off Rating" domain={xDomain as [number, number]} stroke="#a1a1aa" />
            <YAxis
              type="number"
              dataKey="yPlot"
              name="Def Rating"
              domain={yDomain as [number, number]}
              stroke="#a1a1aa"
              tickFormatter={(value) => `${Math.abs(Number(value)).toFixed(1)}`}
            />
            <ZAxis dataKey="size" range={[70, 180]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ backgroundColor: "#09090b", border: "1px solid #3f3f46" }}
              formatter={(_, __, item) => {
                const payload = item.payload as ScatterPoint;
                return [
                  `${payload.conference} | Off ${dec(payload.offensiveRating, 1)} | Def ${dec(payload.defensiveRating, 1)} | Net ${dec(payload.netRating, 1)} | #${payload.rankings?.net ?? "—"}`,
                  payload.team,
                ];
              }}
            />

            <ReferenceLine x={avgOff} stroke="#a1a1aa" strokeDasharray="5 4" />
            <ReferenceLine y={-avgDef} stroke="#a1a1aa" strokeDasharray="5 4" />

            <Scatter
              data={points}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const active = activeTeam === payload.team;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={active ? 8 : 6}
                    fill={payload.fill}
                    stroke={active ? "#facc15" : "#18181b"}
                    strokeWidth={active ? 2 : 1}
                    style={active ? { filter: "drop-shadow(0 0 6px rgba(255,255,255,0.6))" } : undefined}
                  />
                );
              }}
              onMouseEnter={(point) => setActiveTeam(point.team)}
              onMouseLeave={() => setActiveTeam(null)}
              onClick={(point) => onTeamClick(point.team)}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="pointer-events-none relative -mt-[420px] hidden h-0 text-xs font-semibold text-zinc-400 md:block">
        <span className="absolute left-8 top-2">Defensive</span>
        <span className="absolute right-8 top-2">Elite</span>
        <span className="absolute left-8 top-[360px]">Weak</span>
        <span className="absolute right-8 top-[360px]">Offensive</span>
      </div>
      <p className="text-xs text-zinc-400">Y-axis uses inverted defensive rating (lower defensive rating = better defense).</p>
    </section>
  );
}
