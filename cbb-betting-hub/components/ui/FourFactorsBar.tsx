import { dec, normalizePct } from "@/lib/utils";

interface FactorRow {
  label: string;
  team: number;
  opponent: number;
}

interface FourFactorsBarProps {
  factors: FactorRow[];
}

export function FourFactorsBar({ factors }: FourFactorsBarProps) {
  return (
    <div className="space-y-3 rounded-xl border border-white/5 bg-zinc-900/80 p-4">
      {factors.map((factor) => {
        const teamPct = normalizePct(factor.team) ?? 0;
        const oppPct = normalizePct(factor.opponent) ?? 0;
        const teamWidth = Math.max(0, Math.min(100, teamPct));
        const oppWidth = Math.max(0, Math.min(100, oppPct));

        return (
          <div key={factor.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
              <span>{factor.label}</span>
              <span className="font-mono">
                {dec(teamPct, 1)} / {dec(oppPct, 1)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-2 rounded bg-zinc-800">
                <div className="h-2 rounded bg-amber-400" style={{ width: `${teamWidth}%` }} />
              </div>
              <div className="h-2 rounded bg-zinc-800">
                <div className="h-2 rounded bg-zinc-300" style={{ width: `${oppWidth}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
