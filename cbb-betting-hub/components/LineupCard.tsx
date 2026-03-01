import { Lineup } from "@/lib/types";
import { dec, pct } from "@/lib/utils";

export interface LineupCardProps {
  lineup: Lineup;
  onPlayerClick: (id: number, name: string) => void;
}

function toClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function LineupCard({ lineup, onPlayerClick }: LineupCardProps) {
  return (
    <article className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-zinc-100">{lineup.team}</h4>
        <span className="font-mono text-xs text-zinc-400">{toClock(lineup.totalSeconds)}</span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
          <p className="text-xs text-green-300">Off Rtg</p>
          <p className="font-mono text-zinc-100">{dec(lineup.offenseRating, 1)}</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="text-xs text-red-300">Def Rtg</p>
          <p className="font-mono text-zinc-100">{dec(lineup.defenseRating, 1)}</p>
        </div>
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2">
          <p className="text-xs text-amber-300">Net</p>
          <p className="font-mono text-zinc-100">{dec(lineup.netRating, 1)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {lineup.athletes.map((player) => (
          <button
            key={player.id}
            type="button"
            onClick={() => onPlayerClick(player.id, player.name)}
            className="rounded-full border border-white/10 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 hover:border-amber-400/40 hover:text-amber-300"
          >
            {player.name}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 text-xs text-zinc-300 sm:grid-cols-4">
        <div className="rounded bg-zinc-800/60 px-2 py-1">
          Pace <span className="font-mono text-zinc-100">{dec(lineup.pace, 1)}</span>
        </div>
        <div className="rounded bg-zinc-800/60 px-2 py-1">
          Points <span className="font-mono text-zinc-100">{lineup.teamStats.points}</span>
        </div>
        <div className="rounded bg-zinc-800/60 px-2 py-1">
          Poss <span className="font-mono text-zinc-100">{dec(lineup.teamStats.possessions, 1)}</span>
        </div>
        <div className="rounded bg-zinc-800/60 px-2 py-1">
          TS% <span className="font-mono text-zinc-100">{pct(lineup.teamStats.trueShooting)}</span>
        </div>
      </div>
    </article>
  );
}
