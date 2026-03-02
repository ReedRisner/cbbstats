import { ShootingSeasonStats } from "@/lib/types";
import { dec, pct } from "@/lib/utils";

export interface ShootingBreakdownProps {
  stats: ShootingSeasonStats;
}

type ShotCard = {
  key: string;
  label: string;
  attempted: number;
  made: number;
  pct: number;
  assisted?: number;
  assistedPct?: number;
};

export function ShootingBreakdown({ stats }: ShootingBreakdownProps) {
  const shotCards: ShotCard[] = [
    {
      key: "dunks",
      label: "Dunks",
      attempted: stats.dunks.attempted,
      made: stats.dunks.made,
      pct: stats.dunks.pct,
      assisted: stats.dunks.assisted,
      assistedPct: stats.dunks.assistedPct,
    },
    {
      key: "layups",
      label: "Layups",
      attempted: stats.layups.attempted,
      made: stats.layups.made,
      pct: stats.layups.pct,
      assisted: stats.layups.assisted,
      assistedPct: stats.layups.assistedPct,
    },
    {
      key: "twoPointJumpers",
      label: "2PT Jumpers",
      attempted: stats.twoPointJumpers.attempted,
      made: stats.twoPointJumpers.made,
      pct: stats.twoPointJumpers.pct,
      assisted: stats.twoPointJumpers.assisted,
      assistedPct: stats.twoPointJumpers.assistedPct,
    },
    {
      key: "threePointJumpers",
      label: "3PT Jumpers",
      attempted: stats.threePointJumpers.attempted,
      made: stats.threePointJumpers.made,
      pct: stats.threePointJumpers.pct,
      assisted: stats.threePointJumpers.assisted,
      assistedPct: stats.threePointJumpers.assistedPct,
    },
    {
      key: "tipIns",
      label: "Tip-Ins",
      attempted: stats.tipIns.attempted,
      made: stats.tipIns.made,
      pct: stats.tipIns.pct,
    },
    {
      key: "freeThrows",
      label: "Free Throws",
      attempted: stats.freeThrows.attempted,
      made: stats.freeThrows.made,
      pct: stats.freeThrows.pct,
    },
  ].filter((card) => card.attempted > 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Tracked Shots" value={dec(stats.trackedShots, 0)} />
        <MetricCard label="Assisted %" value={pct(stats.assistedPct)} />
        <MetricCard label="FT Rate" value={pct(stats.freeThrowRate)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shotCards.map((card) => {
          const normalizedPct = Math.max(0, Math.min(100, Math.abs(card.pct) <= 1 ? card.pct * 100 : card.pct));
          return (
            <div key={card.key} className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
              <p className="text-sm uppercase tracking-wide text-zinc-400">{card.label}</p>
              <p className="mt-2 font-mono text-2xl text-zinc-100">{card.made}-{card.attempted}</p>
              <p className="text-sm font-semibold text-amber-300">{pct(card.pct)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-amber-400" style={{ width: `${normalizedPct}%` }} />
              </div>
              {card.assisted != null && card.assistedPct != null ? (
                <p className="mt-2 text-xs text-zinc-400">
                  Assisted: <span className="font-mono text-zinc-200">{card.assisted}</span> (
                  <span className="font-mono text-zinc-200">{pct(card.assistedPct)}</span>)
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="text-sm uppercase tracking-wide text-zinc-400">Attempts Breakdown</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Dunks" value={dec(stats.attemptsBreakdown.dunks, 0)} />
          <MetricCard label="Layups" value={dec(stats.attemptsBreakdown.layups, 0)} />
          <MetricCard label="Tip-Ins" value={dec(stats.attemptsBreakdown.tipIns, 0)} />
          <MetricCard label="2PT Jumpers" value={dec(stats.attemptsBreakdown.twoPointJumpers, 0)} />
          <MetricCard label="3PT Jumpers" value={dec(stats.attemptsBreakdown.threePointJumpers, 0)} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="font-mono text-lg text-zinc-100">{value}</p>
    </div>
  );
}
