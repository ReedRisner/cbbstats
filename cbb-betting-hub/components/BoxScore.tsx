import { useMemo, useState } from "react";
import { GamePlayerStats, TeamGameStatsBlock } from "@/lib/types";

export interface BoxScoreProps {
  teamData: GamePlayerStats;
  teamTotals?: TeamGameStatsBlock;
  onPlayerClick: (id: number, name: string) => void;
}

type BoxScoreSortKey = "minutes" | "points" | "rebounds" | "assists" | "steals" | "blocks" | "turnovers";

function minutesToClock(minutes: number): string {
  const whole = Math.max(0, Math.floor(minutes));
  const sec = Math.round((minutes - whole) * 60);
  return `${whole}:${String(sec).padStart(2, "0")}`;
}

export function BoxScore({ teamData, teamTotals, onPlayerClick }: BoxScoreProps) {
  const [sortKey, setSortKey] = useState<BoxScoreSortKey>("minutes");

  const players = useMemo(
    () =>
      [...teamData.players].sort((a, b) => {
        if (sortKey === "minutes") return b.minutes - a.minutes;
        if (sortKey === "points") return b.points - a.points;
        if (sortKey === "rebounds") return b.rebounds.total - a.rebounds.total;
        if (sortKey === "assists") return b.assists - a.assists;
        if (sortKey === "steals") return b.steals - a.steals;
        if (sortKey === "blocks") return b.blocks - a.blocks;
        return a.turnovers - b.turnovers;
      }),
    [sortKey, teamData.players]
  );

  return (
    <section className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-heading text-xl text-amber-400">{teamData.team}</h3>
          <p className="text-xs text-zinc-400">{teamData.conference}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Sort:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as BoxScoreSortKey)}
            className="rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-zinc-200"
          >
            <option value="minutes">Minutes</option>
            <option value="points">Points</option>
            <option value="rebounds">Rebounds</option>
            <option value="assists">Assists</option>
            <option value="steals">Steals</option>
            <option value="blocks">Blocks</option>
            <option value="turnovers">Turnovers (low to high)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-400">
              {["Player", "MIN", "PTS", "FG", "3PT", "FT", "REB", "AST", "STL", "BLK", "TO", "PF"].map((col) => (
                <th key={col} className="px-2 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.athleteId}
                className={`border-b border-white/5 ${player.starter ? "bg-amber-400/10" : ""}`}
              >
                <td className="sticky left-0 z-10 bg-zinc-900/95 px-2 py-2 font-medium text-zinc-100">
                  <button
                    type="button"
                    onClick={() => onPlayerClick(player.athleteId, player.name)}
                    className="text-left hover:text-amber-300"
                  >
                    {player.starter && <span className="mr-1 text-amber-300">★</span>}
                    {player.name}
                  </button>
                </td>
                <td className="px-2 py-2 font-mono">{minutesToClock(player.minutes)}</td>
                <td className="px-2 py-2 font-mono">{player.points}</td>
                <td className="px-2 py-2 font-mono">{player.fieldGoals.made}-{player.fieldGoals.attempted}</td>
                <td className="px-2 py-2 font-mono">{player.threePointFieldGoals.made}-{player.threePointFieldGoals.attempted}</td>
                <td className="px-2 py-2 font-mono">{player.freeThrows.made}-{player.freeThrows.attempted}</td>
                <td className="px-2 py-2 font-mono">{player.rebounds.total}</td>
                <td className="px-2 py-2 font-mono">{player.assists}</td>
                <td className="px-2 py-2 font-mono">{player.steals}</td>
                <td className="px-2 py-2 font-mono">{player.blocks}</td>
                <td className="px-2 py-2 font-mono">{player.turnovers}</td>
                <td className="px-2 py-2 font-mono">{player.fouls}</td>
              </tr>
            ))}
            {teamTotals && (
              <tr className="border-t-2 border-white/20 bg-zinc-800/70 font-semibold text-zinc-100">
                <td className="sticky left-0 z-10 bg-zinc-800/95 px-2 py-2">Team Totals</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">{teamTotals.points.total}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.fieldGoals.made}-{teamTotals.fieldGoals.attempted}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.threePointFieldGoals.made}-{teamTotals.threePointFieldGoals.attempted}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.freeThrows.made}-{teamTotals.freeThrows.attempted}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.rebounds.total}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.assists}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.steals}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.blocks}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.turnovers.total}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.fouls.total}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
