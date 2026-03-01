import { GamePlayerStats } from "@/lib/types";
import { dec, pct } from "@/lib/utils";

export interface BoxScoreProps {
  teamData: GamePlayerStats;
  onPlayerClick: (id: number, name: string) => void;
}

function minutesToClock(minutes: number): string {
  const whole = Math.max(0, Math.floor(minutes));
  const sec = Math.round((minutes - whole) * 60);
  return `${whole}:${String(sec).padStart(2, "0")}`;
}

export function BoxScore({ teamData, onPlayerClick }: BoxScoreProps) {
  const players = [...teamData.players].sort((a, b) => {
    if (a.starter !== b.starter) return a.starter ? -1 : 1;
    return b.minutes - a.minutes;
  });

  return (
    <section className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-xl text-amber-400">{teamData.team}</h3>
        <p className="text-xs text-zinc-400">{teamData.conference}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-400">
              {[
                "Player",
                "MIN",
                "PTS",
                "FG",
                "3PT",
                "FT",
                "REB",
                "AST",
                "STL",
                "BLK",
                "TO",
                "PF",
                "+/-",
                "Usage",
                "eFG%",
                "GameScore",
              ].map((col) => (
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
                className={`border-b border-white/5 ${player.starter ? "opacity-100" : "opacity-70"}`}
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
                <td className="px-2 py-2 font-mono">{dec(player.netRating, 1)}</td>
                <td className="px-2 py-2 font-mono">{pct(player.usage)}</td>
                <td className="px-2 py-2 font-mono">{pct(player.effectiveFieldGoalPct)}</td>
                <td className="px-2 py-2 font-mono">{dec(player.gameScore, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
