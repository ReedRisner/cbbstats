import { BettingLine, Game } from "@/lib/types";
import { dec, moneyline, sign } from "@/lib/utils";

export interface BettingLinesProps {
  lines: BettingLine | null;
  game: Game;
}

export function BettingLines({ lines, game }: BettingLinesProps) {
  if (!lines || lines.lines.length === 0) {
    return <div className="rounded-xl border border-white/5 bg-zinc-900/80 p-4 text-zinc-400">No betting lines available.</div>;
  }

  const current = lines.lines[0];
  const finished = game.homePoints != null && game.awayPoints != null && game.status.toUpperCase().includes("FINAL");
  const actualDiff = finished ? game.homePoints! - game.awayPoints! : null;
  const coverMargin = finished ? actualDiff! + current.spread : null;
  const total = finished ? game.homePoints! + game.awayPoints! : null;

  const atsLabel =
    coverMargin == null ? "—" : coverMargin > 0 ? "HOME COVERS" : coverMargin < 0 ? "AWAY COVERS" : "PUSH";
  const ouDelta = total == null ? null : total - current.overUnder;
  const ouLabel = ouDelta == null ? "—" : ouDelta > 0 ? "OVER" : ouDelta < 0 ? "UNDER" : "PUSH";

  return (
    <div className="space-y-4">
      <section className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/80 p-4">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-400">
              {[
                "Provider",
                "Spread",
                "O/U",
                "Home ML",
                "Away ML",
                "Open Spread",
                "Open O/U",
              ].map((col) => (
                <th key={col} className="px-2 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.lines.map((line) => (
              <tr key={line.provider} className="border-b border-white/5">
                <td className="px-2 py-2 text-zinc-100">{line.provider}</td>
                <td className="px-2 py-2 font-mono">{sign(line.spread)}</td>
                <td className="px-2 py-2 font-mono">{dec(line.overUnder, 1)}</td>
                <td className="px-2 py-2 font-mono">{moneyline(line.homeMoneyline)}</td>
                <td className="px-2 py-2 font-mono">{moneyline(line.awayMoneyline)}</td>
                <td className="px-2 py-2 font-mono">{sign(line.spreadOpen)}</td>
                <td className="px-2 py-2 font-mono">{dec(line.overUnderOpen, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <h3 className="font-semibold text-amber-300">Line Movement</h3>
          <div className="mt-2 space-y-1 text-sm text-zinc-200">
            <p>
              Spread: <span className="font-mono">{sign(current.spreadOpen)} → {sign(current.spread)}</span>{" "}
              <span className="font-mono text-amber-300">({sign(Number((current.spread - current.spreadOpen).toFixed(1)))})</span>
            </p>
            <p>
              O/U: <span className="font-mono">{dec(current.overUnderOpen, 1)} → {dec(current.overUnder, 1)}</span>{" "}
              <span className="font-mono text-amber-300">({sign(Number((current.overUnder - current.overUnderOpen).toFixed(1)))})</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-900/80 p-4">
          <h3 className="font-semibold text-zinc-100">Results</h3>
          {!finished && <p className="mt-2 text-sm text-zinc-400">Game not final yet.</p>}
          {finished && (
            <div className="mt-2 space-y-1 text-sm">
              <p>
                ATS: {" "}
                <span className={atsLabel === "HOME COVERS" ? "text-green-400" : atsLabel === "AWAY COVERS" ? "text-red-400" : "text-zinc-200"}>
                  {atsLabel}
                </span>{" "}
                <span className="font-mono text-zinc-400">(margin {dec(coverMargin, 1)})</span>
              </p>
              <p>
                O/U: <span className={ouLabel === "OVER" ? "text-green-400" : ouLabel === "UNDER" ? "text-red-400" : "text-zinc-200"}>{ouLabel}</span>{" "}
                <span className="font-mono text-zinc-400">(total {total}, line {dec(current.overUnder, 1)})</span>
              </p>
              <p className="font-mono text-zinc-400">Actual Margin: {actualDiff! > 0 ? `Home +${actualDiff}` : `Away +${Math.abs(actualDiff!)}`}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
