import { GamePlayerStats } from "@/lib/types";
import { dec, formatDate, pct } from "@/lib/utils";

export interface PlayerGameLogProps {
  gameStats: GamePlayerStats[];
  playerId: number;
  playerName?: string;
  onGameClick: (gameId: number) => void;
}

type PlayerGameRow = {
  gameId: number;
  startDate: string;
  opponentLabel: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  usage: number;
  efg: number;
  gameScore: number;
  fgMade: number;
  fgAtt: number;
  threeMade: number;
  threeAtt: number;
  ftMade: number;
  ftAtt: number;
};

const normalizeName = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

export function PlayerGameLog({ gameStats, playerId, playerName, onGameClick }: PlayerGameLogProps) {
  const normalizedTargetName = normalizeName(playerName);

  const rows: PlayerGameRow[] = gameStats
    .flatMap((game) => {
      const player = game.players.find((entry) => {
        const normalizedEntryName = normalizeName(entry.name);
        const nameMatch =
          normalizedTargetName &&
          (normalizedEntryName === normalizedTargetName ||
            normalizedEntryName.includes(normalizedTargetName) ||
            normalizedTargetName.includes(normalizedEntryName));
        return entry.athleteId === playerId || Boolean(nameMatch);
      });

      if (!player) return [];

      return {
        gameId: game.gameId,
        startDate: game.startDate,
        opponentLabel: `${game.isHome ? "vs" : "@"} ${game.opponent}`,
        minutes: player.minutes,
        points: player.points,
        rebounds: player.rebounds.total,
        assists: player.assists,
        steals: player.steals,
        blocks: player.blocks,
        turnovers: player.turnovers,
        usage: player.usage,
        efg: player.effectiveFieldGoalPct,
        gameScore: player.gameScore,
        fgMade: player.fieldGoals.made,
        fgAtt: player.fieldGoals.attempted,
        threeMade: player.threePointFieldGoals.made,
        threeAtt: player.threePointFieldGoals.attempted,
        ftMade: player.freeThrows.made,
        ftAtt: player.freeThrows.attempted,
      };
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  if (!rows.length) {
    return <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 text-sm text-zinc-400">No game log available.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/50">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-400">
          <tr>
            {[
              "Date",
              "Opp",
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
              "Usage",
              "eFG%",
              "GameScore",
            ].map((header) => (
              <th key={header} className="px-3 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.gameId}-${row.startDate}`}
              className="cursor-pointer border-t border-white/5 text-zinc-200 transition hover:bg-zinc-800/70"
              onClick={() => onGameClick(row.gameId)}
            >
              <td className="px-3 py-2">{formatDate(row.startDate)}</td>
              <td className="px-3 py-2">{row.opponentLabel}</td>
              <td className="px-3 py-2 font-mono">{dec(row.minutes)}</td>
              <td className="px-3 py-2 font-mono">{row.points}</td>
              <td className="px-3 py-2 font-mono">{row.fgMade}-{row.fgAtt}</td>
              <td className="px-3 py-2 font-mono">{row.threeMade}-{row.threeAtt}</td>
              <td className="px-3 py-2 font-mono">{row.ftMade}-{row.ftAtt}</td>
              <td className="px-3 py-2 font-mono">{row.rebounds}</td>
              <td className="px-3 py-2 font-mono">{row.assists}</td>
              <td className="px-3 py-2 font-mono">{row.steals}</td>
              <td className="px-3 py-2 font-mono">{row.blocks}</td>
              <td className="px-3 py-2 font-mono">{row.turnovers}</td>
              <td className="px-3 py-2 font-mono">{pct(row.usage)}</td>
              <td className="px-3 py-2 font-mono">{pct(row.efg)}</td>
              <td className="px-3 py-2 font-mono">{dec(row.gameScore, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
