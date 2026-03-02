import { useMemo, useState } from "react";
import { GamePlayerStats, TeamGameStatsBlock } from "@/lib/types";
import { dec, pct } from "@/lib/utils";

export interface BoxScoreProps {
  teamData: GamePlayerStats;
  teamTotals?: TeamGameStatsBlock;
  onPlayerClick: (athleteId: number, athleteSourceId: string, name: string, team: string) => void;
}

type BoxScoreSortKey = "name" | "minutes" | "points" | "rebounds" | "assists" | "steals" | "blocks" | "turnovers";

function minutesToClock(minutes: number): string {
  const whole = Math.max(0, Math.floor(minutes));
  const sec = Math.round((minutes - whole) * 60);
  return `${whole}:${String(sec).padStart(2, "0")}`;
}

export function BoxScore({ teamData, teamTotals, onPlayerClick }: BoxScoreProps) {
  const [sortKey, setSortKey] = useState<BoxScoreSortKey>("minutes");
  const [ascending, setAscending] = useState(false);

  const handleSort = (key: BoxScoreSortKey) => {
    if (sortKey === key) {
      setAscending((current) => !current);
      return;
    }
    setSortKey(key);
    setAscending(key === "name" || key === "turnovers");
  };

  const players = useMemo(() => {
    const sorted = [...teamData.players].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "minutes") return b.minutes - a.minutes;
      if (sortKey === "points") return b.points - a.points;
      if (sortKey === "rebounds") return b.rebounds.total - a.rebounds.total;
      if (sortKey === "assists") return b.assists - a.assists;
      if (sortKey === "steals") return b.steals - a.steals;
      if (sortKey === "blocks") return b.blocks - a.blocks;
      return a.turnovers - b.turnovers;
    });

    return ascending ? sorted.reverse() : sorted;
  }, [ascending, sortKey, teamData.players]);

  const sortableCols: Array<{ key: BoxScoreSortKey; label: string }> = [
    { key: "name", label: "Player" },
    { key: "minutes", label: "MIN" },
    { key: "points", label: "PTS" },
    { key: "rebounds", label: "REB" },
    { key: "assists", label: "AST" },
    { key: "steals", label: "STL" },
    { key: "blocks", label: "BLK" },
    { key: "turnovers", label: "TO" },
  ];

  return (
    <section className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-heading text-xl text-amber-400">{teamData.team}</h3>
          <p className="text-xs text-zinc-400">{teamData.conference}</p>
        </div>
        <p className="text-xs text-zinc-500">Click column headers to sort</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1600px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-400">
              {sortableCols.map((col) => (
                <th key={col.key} className="px-2 py-2 font-medium">
                  <button type="button" onClick={() => handleSort(col.key)} className="inline-flex items-center gap-1 hover:text-zinc-200">
                    {col.label}
                    {sortKey === col.key && <span>{ascending ? "↑" : "↓"}</span>}
                  </button>
                </th>
              ))}
              <th className="px-2 py-2 font-medium">FG</th>
              <th className="px-2 py-2 font-medium">3PT</th>
              <th className="px-2 py-2 font-medium">FT</th>
              <th className="px-2 py-2 font-medium">PF</th>
              <th className="px-2 py-2 font-medium">GameScore</th>
              <th className="px-2 py-2 font-medium">Off Rtg</th>
              <th className="px-2 py-2 font-medium">Def Rtg</th>
              <th className="px-2 py-2 font-medium">Net Rtg</th>
              <th className="px-2 py-2 font-medium">Usage</th>
              <th className="px-2 py-2 font-medium">eFG%</th>
              <th className="px-2 py-2 font-medium">TS%</th>
              <th className="px-2 py-2 font-medium">AST/TO</th>
              <th className="px-2 py-2 font-medium">FT Rate</th>
              <th className="px-2 py-2 font-medium">OREB%</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.athleteId} className="border-b border-white/5">
                <td className="sticky left-0 z-10 bg-zinc-900/95 px-2 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => onPlayerClick(player.athleteId, player.athleteSourceId, player.name, teamData.team)}
                    className={`text-left hover:text-amber-300 ${player.starter ? "text-zinc-100" : "text-zinc-400"}`}
                  >
                    {player.name}
                  </button>
                </td>
                <td className="px-2 py-2 font-mono">{minutesToClock(player.minutes)}</td>
                <td className="px-2 py-2 font-mono">{player.points}</td>
                <td className="px-2 py-2 font-mono">{player.rebounds.total}</td>
                <td className="px-2 py-2 font-mono">{player.assists}</td>
                <td className="px-2 py-2 font-mono">{player.steals}</td>
                <td className="px-2 py-2 font-mono">{player.blocks}</td>
                <td className="px-2 py-2 font-mono">{player.turnovers}</td>
                <td className="px-2 py-2 font-mono">{player.fieldGoals.made}-{player.fieldGoals.attempted}</td>
                <td className="px-2 py-2 font-mono">{player.threePointFieldGoals.made}-{player.threePointFieldGoals.attempted}</td>
                <td className="px-2 py-2 font-mono">{player.freeThrows.made}-{player.freeThrows.attempted}</td>
                <td className="px-2 py-2 font-mono">{player.fouls}</td>
                <td className="px-2 py-2 font-mono">{dec(player.gameScore, 1)}</td>
                <td className="px-2 py-2 font-mono">{dec(player.offensiveRating, 1)}</td>
                <td className="px-2 py-2 font-mono">{dec(player.defensiveRating, 1)}</td>
                <td className="px-2 py-2 font-mono">{dec(player.netRating, 1)}</td>
                <td className="px-2 py-2 font-mono">{pct(player.usage)}</td>
                <td className="px-2 py-2 font-mono">{pct(player.effectiveFieldGoalPct)}</td>
                <td className="px-2 py-2 font-mono">{pct(player.trueShootingPct)}</td>
                <td className="px-2 py-2 font-mono">{dec(player.assistsTurnoverRatio, 2)}</td>
                <td className="px-2 py-2 font-mono">{pct(player.freeThrowRate)}</td>
                <td className="px-2 py-2 font-mono">{pct(player.offensiveReboundPct)}</td>
              </tr>
            ))}
            {teamTotals && (
              <tr className="border-t-2 border-white/20 bg-zinc-800/70 font-semibold text-zinc-100">
                <td className="sticky left-0 z-10 bg-zinc-800/95 px-2 py-2">Team Totals</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">{teamTotals.points.total}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.rebounds.total}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.assists}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.steals}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.blocks}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.turnovers.total}</td>
                <td className="px-2 py-2 font-mono">{teamTotals.fieldGoals.made}-{teamTotals.fieldGoals.attempted} ({pct(teamTotals.fieldGoals.pct)})</td>
                <td className="px-2 py-2 font-mono">{teamTotals.threePointFieldGoals.made}-{teamTotals.threePointFieldGoals.attempted} ({pct(teamTotals.threePointFieldGoals.pct)})</td>
                <td className="px-2 py-2 font-mono">{teamTotals.freeThrows.made}-{teamTotals.freeThrows.attempted} ({pct(teamTotals.freeThrows.pct)})</td>
                <td className="px-2 py-2 font-mono">{teamTotals.fouls.total}</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">—</td>
                <td className="px-2 py-2 font-mono">—</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
