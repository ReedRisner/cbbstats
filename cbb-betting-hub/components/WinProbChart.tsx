"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Play } from "@/lib/types";

interface WinProbChartProps {
  plays: Play[];
  homeTeam: string;
  awayTeam: string;
}

type WinProbPoint = {
  gameSeconds: number;
  winProbPct: number;
  playText: string;
  score: string;
};

function formatClock(gameSeconds: number) {
  const period = Math.floor(gameSeconds / 1200) + 1;
  const elapsedInPeriod = gameSeconds % 1200;
  const remaining = Math.max(0, 1200 - elapsedInPeriod);
  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(remaining % 60)
    .toString()
    .padStart(2, "0");
  const periodLabel = period <= 2 ? `H${period}` : `OT${period - 2}`;
  return `${periodLabel} ${mm}:${ss}`;
}

export function WinProbChart({ plays, homeTeam, awayTeam }: WinProbChartProps) {
  const data = useMemo<WinProbPoint[]>(() => {
    return [...plays]
      .filter((play) => Number.isFinite(play.homeWinProbability) && Number.isFinite(play.secondsRemaining))
      .sort((a, b) => a.period - b.period || b.secondsRemaining - a.secondsRemaining)
      .map((play) => {
        const gameSeconds = (play.period - 1) * 1200 + (1200 - play.secondsRemaining);
        const normalized = play.homeWinProbability <= 1 ? play.homeWinProbability * 100 : play.homeWinProbability;
        return {
          gameSeconds,
          winProbPct: Math.max(0, Math.min(100, normalized)),
          playText: play.playText,
          score: `${play.awayScore}-${play.homeScore}`,
        };
      });
  }, [plays]);

  const maxSeconds = data.at(-1)?.gameSeconds ?? 2400;
  const periodDividers = useMemo(() => {
    const maxPeriod = Math.max(2, ...plays.map((play) => play.period));
    return Array.from({ length: maxPeriod - 1 }, (_, idx) => (idx + 1) * 1200).filter((mark) => mark <= maxSeconds);
  }, [maxSeconds, plays]);

  if (!data.length) {
    return <section className="rounded-xl border border-white/10 bg-zinc-900/70 p-4 text-sm text-zinc-400">No win probability data available.</section>;
  }

  return (
    <section className="space-y-2 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{awayTeam}</span>
        <span>{homeTeam}</span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="wpAbove" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="wpBelow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#f87171" stopOpacity={0.25} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#3f3f46" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="gameSeconds"
              tickFormatter={formatClock}
              stroke="#a1a1aa"
              domain={[0, maxSeconds]}
            />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke="#a1a1aa" />
            <Tooltip
              cursor={{ stroke: "#71717a", strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0]?.payload as WinProbPoint;
                return (
                  <div className="max-w-xs rounded border border-zinc-700 bg-zinc-950 p-2 text-xs text-zinc-100">
                    <p className="font-semibold text-amber-300">{formatClock(point.gameSeconds)}</p>
                    <p className="mt-1">Score: {point.score} (Away-Home)</p>
                    <p>Home Win Prob: {point.winProbPct.toFixed(1)}%</p>
                    <p className="mt-1 text-zinc-300">{point.playText}</p>
                  </div>
                );
              }}
            />

            <ReferenceLine y={50} stroke="#a1a1aa" strokeDasharray="5 4" />
            {periodDividers.map((mark) => (
              <ReferenceLine key={mark} x={mark} stroke="#71717a" strokeDasharray="4 4" />
            ))}

            <Area type="monotone" dataKey="winProbPct" stroke="#4ade80" strokeWidth={2} fill="url(#wpAbove)" />
            <Area type="monotone" dataKey="winProbPct" stroke="none" fill="url(#wpBelow)" baseValue={50} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
