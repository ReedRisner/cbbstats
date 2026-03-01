import Link from "next/link";
import { BettingLine, Game, AdjustedRating } from "@/lib/types";
import { dec, formatTimeWithZone, moneyline, sign } from "@/lib/utils";

interface GameCardProps {
  game: Game;
  line?: BettingLine;
  homeRating?: AdjustedRating;
  awayRating?: AdjustedRating;
  homeApRank?: number;
  awayApRank?: number;
}

function StatusBadge({ label, tone = "default", pulse = false }: { label: string; tone?: "default" | "amber" | "green"; pulse?: boolean }) {
  const toneClass = tone === "amber" ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : tone === "green" ? "border-green-400/40 bg-green-400/10 text-green-300" : "border-white/10 bg-zinc-800 text-zinc-300";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClass} ${pulse ? "animate-pulse" : ""}`}>
      {label}
    </span>
  );
}

function TeamRow({
  side,
  name,
  conference,
  points,
  apRank,
  adjRank,
}: {
  side: "Away" | "Home";
  name: string;
  conference: string;
  points: number | null;
  apRank?: number;
  adjRank?: number;
}) {
  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3">
      <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">{side}</span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-zinc-100">{name}</p>
          {apRank != null && (
            <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
              AP #{apRank}
            </span>
          )}
          <span className="rounded border border-white/10 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
            Adj #{adjRank ?? "—"}
          </span>
        </div>
        <p className="text-xs text-zinc-400">{conference}</p>
      </div>
      <p className="font-mono text-lg font-semibold text-zinc-100">{points ?? "—"}</p>
    </div>
  );
}

export function GameCard({ game, line, homeRating, awayRating, homeApRank, awayApRank }: GameCardProps) {
  const primaryLine = line?.lines?.[0];
  const isFinal = game.status.toUpperCase().includes("FINAL");
  const isLive = game.status.toUpperCase().includes("LIVE") || game.status.toUpperCase().includes("IN PROGRESS");

  return (
    <Link
      href={`/game/${game.id}`}
      className="grid gap-4 rounded-xl border border-white/5 bg-zinc-900/80 p-4 transition hover:border-amber-400/40 hover:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {game.conferenceGame && <StatusBadge label="Conf" />}
          {game.neutralSite && <StatusBadge label="Neutral" tone="amber" />}
          {isFinal && <StatusBadge label="Final" tone="green" />}
          {isLive && <StatusBadge label="Live" tone="amber" pulse />}
        </div>
        <p className="font-mono text-xs text-zinc-400">{formatTimeWithZone(game.startDate)}</p>
      </div>

      <div className="grid gap-2">
        <TeamRow
          side="Away"
          name={game.awayTeam}
          conference={game.awayConference}
          points={game.awayPoints}
          apRank={awayApRank}
          adjRank={awayRating?.rankings.net}
        />
        <div className="pl-[52px] font-mono text-sm text-zinc-500">{game.homePoints == null && game.awayPoints == null ? "VS" : ""}</div>
        <TeamRow
          side="Home"
          name={game.homeTeam}
          conference={game.homeConference}
          points={game.homePoints}
          apRank={homeApRank}
          adjRank={homeRating?.rankings.net}
        />
      </div>

      <div className="grid gap-3 border-t border-white/5 pt-3 md:grid-cols-[1fr_auto] md:items-end">
        <p className="text-xs text-zinc-400">
          {game.venue ?? "TBD venue"}
          {(game.city || game.state) && ` · ${[game.city, game.state].filter(Boolean).join(", ")}`}
          {game.attendance ? ` · Att: ${game.attendance.toLocaleString()}` : ""}
        </p>

        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 font-mono text-xs text-zinc-200">
          {primaryLine ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-zinc-400">Spread</span>
              <span>{sign(primaryLine.spread)}</span>
              <span className="text-zinc-400">O/U</span>
              <span>{dec(primaryLine.overUnder)}</span>
              <span className="text-zinc-400">ML (H/A)</span>
              <span>
                {moneyline(primaryLine.homeMoneyline)} / {moneyline(primaryLine.awayMoneyline)}
              </span>
            </div>
          ) : (
            <p className="text-zinc-400">No betting line available</p>
          )}
        </div>
      </div>
    </Link>
  );
}
