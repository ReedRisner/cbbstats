"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ErrorMsg } from "@/components/ui/ErrorMsg";
import { Loader } from "@/components/ui/Loader";
import { StatPill } from "@/components/ui/StatPill";
import { Tabs } from "@/components/ui/Tabs";
import { apiFetch } from "@/lib/api";
import { AdjustedRating, Game, Lineup, PlayerSeasonStats, ShootingSeasonStats, Team, TeamRoster, TeamSeasonStats } from "@/lib/types";
import { dec, formatDate, heightStr, pct, perGame } from "@/lib/utils";

const SEASON = 2026;

type TeamTab = "Overview" | "Roster" | "Schedule" | "Shooting" | "Lineups";
type RosterSortKey = "jersey" | "name" | "position" | "height" | "weight" | "points" | "rebounds" | "assists";
type LineupSortKey = "netRating" | "offenseRating" | "defenseRating" | "pace" | "minutes" | "possessions" | "trueShooting" | "effectiveFieldGoalPct" | "turnoverRatio" | "offensiveReboundPct" | "freeThrowRate";

interface RosterRow {
  player: TeamRoster["players"][number];
  seasonStats: PlayerSeasonStats | null;
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function toHex(color: string | null | undefined): string {
  const raw = (color ?? "").trim();
  if (!raw) return "#f59e0b";
  if (raw.startsWith("#")) return raw;
  return `#${raw}`;
}

function namesMatch(candidate: string | null | undefined, routeName: string): boolean {
  const normalizedCandidate = normalizeName(candidate);
  const normalizedRoute = normalizeName(routeName);
  if (!normalizedCandidate || !normalizedRoute) return false;
  return (
    normalizedCandidate === normalizedRoute ||
    normalizedCandidate.includes(normalizedRoute) ||
    normalizedRoute.includes(normalizedCandidate)
  );
}

function findTeamByName(teams: Team[], routeName: string): Team | null {
  return (
    teams.find((entry) => {
      const candidates = [entry.displayName, entry.school, entry.shortDisplayName, entry.abbreviation];
      return candidates.some((candidate) => namesMatch(candidate, routeName));
    }) ?? teams[0] ?? null
  );
}

export default function TeamDetailPage() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  const teamName = decodeURIComponent(params.name ?? "");
  const normalizedRouteName = normalizeName(teamName);

  const [activeTab, setActiveTab] = useState<TeamTab>("Overview");
  const [team, setTeam] = useState<Team | null>(null);
  const [teamStats, setTeamStats] = useState<TeamSeasonStats | null>(null);
  const [roster, setRoster] = useState<TeamRoster | null>(null);
  const [shooting, setShooting] = useState<ShootingSeasonStats | null>(null);
  const [adjusted, setAdjusted] = useState<AdjustedRating | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerSeasonStats[]>([]);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [sortKey, setSortKey] = useState<RosterSortKey>("jersey");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [lineupSortKey, setLineupSortKey] = useState<LineupSortKey>("netRating");
  const [lineupSortDirection, setLineupSortDirection] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        apiFetch<Team[]>("/teams", { team: teamName }),
        apiFetch<TeamSeasonStats[]>("/stats/team/season", { season: SEASON, team: teamName }),
        apiFetch<TeamRoster[]>("/teams/roster", { season: SEASON, team: teamName }),
        apiFetch<ShootingSeasonStats[]>("/stats/team/shooting/season", { season: SEASON, team: teamName }),
        apiFetch<AdjustedRating[]>("/ratings/adjusted", { season: SEASON, team: teamName }),
        apiFetch<Game[]>("/games", { season: SEASON, team: teamName }),
        apiFetch<PlayerSeasonStats[]>("/stats/player/season", { season: SEASON, team: teamName }),
        apiFetch<Lineup[]>("/lineups/team", { season: SEASON, team: teamName }),
      ]);

      if (cancelled) return;

      const teams = results[0].status === "fulfilled" ? results[0].value : [];
      const teamStatRows = results[1].status === "fulfilled" ? results[1].value : [];
      const rosterRows = results[2].status === "fulfilled" ? results[2].value : [];
      const shootingRows = results[3].status === "fulfilled" ? results[3].value : [];
      const adjustedRows = results[4].status === "fulfilled" ? results[4].value : [];
      const gamesRows = results[5].status === "fulfilled" ? results[5].value : [];
      const playerRows = results[6].status === "fulfilled" ? results[6].value : [];
      const lineupRows = results[7].status === "fulfilled" ? results[7].value : [];

      const matchedTeam = findTeamByName(teams, teamName);
      const matchedTeamStats =
        teamStatRows.find((row) => matchedTeam && row.teamId === matchedTeam.id) ??
        teamStatRows.find((row) => normalizeName(row.team) === normalizedRouteName) ??
        teamStatRows[0] ??
        null;

      const matchedRoster =
        rosterRows.find((row) => matchedTeam && row.teamId === matchedTeam.id) ??
        rosterRows.find((row) => normalizeName(row.team) === normalizedRouteName) ??
        rosterRows[0] ??
        null;

      const matchedShooting =
        shootingRows.find((row) => matchedTeam && row.teamId === matchedTeam.id) ??
        shootingRows.find((row) => normalizeName(row.team) === normalizedRouteName) ??
        shootingRows[0] ??
        null;

      const resolvedTeamId = matchedTeam?.id ?? matchedTeamStats?.teamId ?? matchedRoster?.teamId ?? matchedShooting?.teamId;
      const resolvedTeamLabel = matchedTeam?.displayName ?? matchedTeam?.school ?? matchedTeamStats?.team ?? matchedRoster?.team ?? teamName;

      const matchedAdjusted =
        adjustedRows.find((row) => resolvedTeamId != null && row.teamId === resolvedTeamId) ??
        adjustedRows.find((row) => namesMatch(row.team, resolvedTeamLabel)) ??
        adjustedRows.find((row) => namesMatch(row.team, teamName)) ??
        null;

      const resolvedTeamNames = new Set(
        [
          matchedTeam?.displayName,
          matchedTeam?.school,
          matchedTeam?.shortDisplayName,
          matchedTeamStats?.team,
          matchedRoster?.team,
          matchedAdjusted?.team,
          teamName,
        ]
          .map((entry) => normalizeName(entry))
          .filter(Boolean)
      );

      const filteredGames = gamesRows.filter(
        (game) => resolvedTeamNames.has(normalizeName(game.homeTeam)) || resolvedTeamNames.has(normalizeName(game.awayTeam))
      );

      const matchedLineups = lineupRows.filter((lineup) => {
        const matchesId = resolvedTeamId != null && lineup.teamId === resolvedTeamId;
        const matchesName = resolvedTeamNames.has(normalizeName(lineup.team));
        return matchesId || matchesName;
      });

      setTeam(matchedTeam);
      setTeamStats(matchedTeamStats);
      setRoster(matchedRoster);
      setShooting(matchedShooting);
      setAdjusted(matchedAdjusted);
      setGames(filteredGames);
      setPlayerStats(playerRows);
      setLineups(matchedLineups);

      const noCoreData = !matchedTeam && !matchedTeamStats && !matchedRoster && !filteredGames.length;
      if (noCoreData) setError("Unable to load team details.");

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [normalizedRouteName, teamName]);

  const accentColor = toHex(team?.primaryColor);

  const keyStats = useMemo(() => {
    if (!teamStats) return [];
    return [
      { label: "PPG", value: perGame(teamStats.teamStats.points.total, teamStats.games) },
      { label: "Opp PPG", value: perGame(teamStats.opponentStats.points.total, teamStats.games) },
      { label: "Pace", value: dec(teamStats.pace, 1) },
      { label: "FG%", value: pct(teamStats.teamStats.fieldGoals.pct) },
      { label: "3PT%", value: pct(teamStats.teamStats.threePointFieldGoals.pct) },
      { label: "FT%", value: pct(teamStats.teamStats.freeThrows.pct) },
      { label: "RPG", value: perGame(teamStats.teamStats.rebounds.total, teamStats.games) },
      { label: "APG", value: perGame(teamStats.teamStats.assists, teamStats.games) },
      { label: "TO/G", value: perGame(teamStats.teamStats.turnovers.total, teamStats.games) },
      { label: "Rating", value: dec(teamStats.teamStats.rating, 1) },
    ];
  }, [teamStats]);

  const fourFactors = useMemo(() => {
    if (!teamStats) return [];
    return [
      {
        label: "eFG%",
        team: teamStats.teamStats.fourFactors.effectiveFieldGoalPct,
        opponent: teamStats.opponentStats.fourFactors.effectiveFieldGoalPct,
      },
      {
        label: "TO Ratio",
        team: teamStats.teamStats.fourFactors.turnoverRatio,
        opponent: teamStats.opponentStats.fourFactors.turnoverRatio,
      },
      {
        label: "OREB%",
        team: teamStats.teamStats.fourFactors.offensiveReboundPct,
        opponent: teamStats.opponentStats.fourFactors.offensiveReboundPct,
      },
      {
        label: "FT Rate",
        team: teamStats.teamStats.fourFactors.freeThrowRate,
        opponent: teamStats.opponentStats.fourFactors.freeThrowRate,
      },
    ];
  }, [teamStats]);

  const sortedRosterRows = useMemo(() => {
    const players = [...(roster?.players ?? [])];
    const statByAthleteId = new Map(playerStats.map((entry) => [entry.athleteId, entry]));

    const rows: RosterRow[] = players.map((player) => ({
      player,
      seasonStats: statByAthleteId.get(player.id) ?? null,
    }));

    const sortValue = (row: RosterRow): string | number => {
      switch (sortKey) {
        case "jersey":
          return Number.parseInt(row.player.jersey || "999", 10) || 999;
        case "name":
          return row.player.name;
        case "position":
          return row.player.position || "";
        case "height":
          return row.player.height || 0;
        case "weight":
          return row.player.weight || 0;
        case "points":
          return row.seasonStats ? row.seasonStats.points / Math.max(row.seasonStats.games, 1) : -1;
        case "rebounds":
          return row.seasonStats ? row.seasonStats.rebounds.total / Math.max(row.seasonStats.games, 1) : -1;
        case "assists":
          return row.seasonStats ? row.seasonStats.assists / Math.max(row.seasonStats.games, 1) : -1;
      }
    };

    rows.sort((a, b) => {
      const aValue = sortValue(a);
      const bValue = sortValue(b);
      const direction = sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "number" && typeof bValue === "number") return (aValue - bValue) * direction;
      return String(aValue).localeCompare(String(bValue)) * direction;
    });

    return rows;
  }, [playerStats, roster?.players, sortDirection, sortKey]);

  const sortedGames = useMemo(
    () => [...games].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [games]
  );

  const sortedLineups = useMemo(() => {
    const getValue = (lineup: Lineup): number => {
      switch (lineupSortKey) {
        case "offenseRating":
          return lineup.offenseRating;
        case "defenseRating":
          return lineup.defenseRating;
        case "pace":
          return lineup.pace;
        case "minutes":
          return lineup.totalSeconds / 60;
        case "possessions":
          return lineup.teamStats.possessions;
        case "trueShooting":
          return lineup.teamStats.trueShooting;
        case "effectiveFieldGoalPct":
          return lineup.teamStats.fourFactors.effectiveFieldGoalPct;
        case "turnoverRatio":
          return lineup.teamStats.fourFactors.turnoverRatio;
        case "offensiveReboundPct":
          return lineup.teamStats.fourFactors.offensiveReboundPct;
        case "freeThrowRate":
          return lineup.teamStats.fourFactors.freeThrowRate;
        case "netRating":
        default:
          return lineup.netRating;
      }
    };

    return [...lineups].sort((a, b) => {
      const left = getValue(a);
      const right = getValue(b);
      return lineupSortDirection === "asc" ? left - right : right - left;
    });
  }, [lineupSortDirection, lineupSortKey, lineups]);

  const shotRows = useMemo(
    () =>
      shooting
        ? [
            { label: "Dunks", stat: shooting.dunks },
            { label: "Layups", stat: shooting.layups },
            { label: "2PT Jumpers", stat: shooting.twoPointJumpers },
            { label: "3PT Jumpers", stat: shooting.threePointJumpers },
            { label: "Tip-ins", stat: shooting.tipIns },
            { label: "Free Throws", stat: shooting.freeThrows },
          ]
        : [],
    [shooting]
  );

  if (loading) return <Loader />;
  if (error) return <ErrorMsg message={error} />;

  const displayName = team?.displayName ?? teamStats?.team ?? roster?.team ?? adjusted?.team ?? teamName;

  const onSort = (key: RosterSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "name" || key === "position" ? "asc" : "desc");
  };

  const onLineupSort = (key: LineupSortKey) => {
    if (lineupSortKey === key) {
      setLineupSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setLineupSortKey(key);
    setLineupSortDirection(key === "defenseRating" || key === "turnoverRatio" ? "asc" : "desc");
  };

  return (
    <div className="space-y-6">
      <header
        className="overflow-hidden rounded-2xl border bg-zinc-900/70 shadow-[0_0_30px_rgba(245,158,11,0.08)]"
        style={{ borderColor: `${accentColor}66`, boxShadow: `0 0 30px ${accentColor}22` }}
      >
        <div className="h-px w-full" style={{ backgroundColor: accentColor }} />
        <div className="space-y-5 p-5">
          <button
            type="button"
            className="rounded-md border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-amber-400/50 hover:text-amber-300"
            onClick={() => router.back()}
          >
            ← Back
          </button>

          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-2">
              <h1 className="font-heading text-4xl text-zinc-100">{displayName}</h1>
              <p className="text-sm text-zinc-300">
                {team?.conference ?? teamStats?.conference ?? roster?.conference ?? adjusted?.conference ?? "—"} • {team?.mascot || "—"}
              </p>
              <p className="text-sm text-zinc-400">
                {team?.currentVenue || "Venue —"}
                {team?.currentCity || team?.currentState ? ` • ${team?.currentCity ?? ""}, ${team?.currentState ?? ""}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Record</p>
                <p className="font-mono text-3xl">
                  <span className="text-emerald-400">{teamStats?.wins ?? "—"}</span>
                  <span className="px-1 text-zinc-400">-</span>
                  <span className="text-rose-400">{teamStats?.losses ?? "—"}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-zinc-950/50 p-3 text-center">
                <div>
                  <p className="text-xs text-zinc-400">Adj Off</p>
                  <p className="font-mono text-lg text-emerald-400">{dec(adjusted?.offensiveRating, 1)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Adj Def</p>
                  <p className="font-mono text-lg text-rose-400">{dec(adjusted?.defensiveRating, 1)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Adj Net</p>
                  <p className="font-mono text-lg text-amber-300">{dec(adjusted?.netRating, 1)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Tabs tabs={["Overview", "Roster", "Schedule", "Shooting", "Lineups"]} active={activeTab} onChange={(tab) => setActiveTab(tab as TeamTab)} />

      {activeTab === "Overview" && (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {keyStats.length ? keyStats.map((stat) => <StatPill key={stat.label} label={stat.label} value={stat.value} />) : <p className="text-zinc-400">No season stats available.</p>}
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
            <h2 className="mb-3 text-sm uppercase tracking-wide text-zinc-400">Four Factors (Team vs Opponent)</h2>
            {fourFactors.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/10 text-zinc-400">
                    <tr>
                      <th className="px-2 py-2 text-left">Factor</th>
                      <th className="px-2 py-2 text-right">Team</th>
                      <th className="px-2 py-2 text-right">Opponent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fourFactors.map((factor) => (
                      <tr key={factor.label} className="border-b border-white/5 text-zinc-200">
                        <td className="px-2 py-2">{factor.label}</td>
                        <td className="px-2 py-2 text-right font-mono">{pct(factor.team)}</td>
                        <td className="px-2 py-2 text-right font-mono">{pct(factor.opponent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-zinc-400">No four factors data available.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === "Roster" && (
        <section className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/70">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10 text-zinc-300">
              <tr>
                {[
                  ["#", "jersey"],
                  ["Name", "name"],
                  ["Pos", "position"],
                  ["Height", "height"],
                  ["Weight", "weight"],
                  ["Hometown", "name"],
                  ["PPG", "points"],
                  ["RPG", "rebounds"],
                  ["APG", "assists"],
                ].map(([label, key]) => (
                  <th key={label} className="px-3 py-2 text-left">
                    {key === "name" && label === "Hometown" ? (
                      label
                    ) : (
                      <button type="button" className="hover:text-amber-300" onClick={() => onSort(key as RosterSortKey)}>
                        {label}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRosterRows.map(({ player, seasonStats }) => (
                <tr key={player.id} className="border-b border-white/5 text-zinc-200">
                  <td className="px-3 py-2 font-mono">{player.jersey || "—"}</td>
                  <td className="px-3 py-2">
                    <Link className="text-amber-300 hover:text-amber-200" href={`/player/${player.id}?name=${encodeURIComponent(player.name)}`}>
                      {player.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{player.position || "—"}</td>
                  <td className="px-3 py-2">{heightStr(player.height)}</td>
                  <td className="px-3 py-2">{player.weight ? `${player.weight} lbs` : "—"}</td>
                  <td className="px-3 py-2 text-zinc-400">{player.hometown?.city && player.hometown?.state ? `${player.hometown.city}, ${player.hometown.state}` : "—"}</td>
                  <td className="px-3 py-2 font-mono">{seasonStats ? perGame(seasonStats.points, seasonStats.games) : "—"}</td>
                  <td className="px-3 py-2 font-mono">{seasonStats ? perGame(seasonStats.rebounds.total, seasonStats.games) : "—"}</td>
                  <td className="px-3 py-2 font-mono">{seasonStats ? perGame(seasonStats.assists, seasonStats.games) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sortedRosterRows.length ? <p className="p-4 text-zinc-400">No roster data available.</p> : null}
        </section>
      )}

      {activeTab === "Schedule" && (
        <section className="space-y-2">
          {sortedGames.map((game) => {
            const isHomeTeam = normalizeName(game.homeTeam) === normalizedRouteName;
            const opponent = isHomeTeam ? game.awayTeam : game.homeTeam;
            const teamScore = isHomeTeam ? game.homePoints : game.awayPoints;
            const oppScore = isHomeTeam ? game.awayPoints : game.homePoints;
            const isUnplayed = teamScore == null || oppScore == null || (teamScore === 0 && oppScore === 0);
            const won = !isUnplayed ? teamScore > oppScore : null;

            return (
              <Link
                key={game.id}
                href={`/game/${game.id}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 transition hover:border-amber-400/40"
              >
                <div className="space-y-0.5">
                  <p className="text-sm text-zinc-300">{formatDate(game.startDate)}</p>
                  <p className="text-zinc-100">
                    <span className="mr-1 text-zinc-400">{isHomeTeam ? "vs" : "@"}</span>
                    {opponent}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {won != null ? (
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${won ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                      {won ? "W" : "L"}
                    </span>
                  ) : (
                    <span className="rounded bg-zinc-700/50 px-2 py-1 text-xs text-zinc-300">TBD</span>
                  )}
                  <p className="font-mono text-zinc-100">{isUnplayed ? "TBD" : `${teamScore}-${oppScore}`}</p>
                </div>
              </Link>
            );
          })}
          {!sortedGames.length ? <p className="text-zinc-400">No schedule data available.</p> : null}
        </section>
      )}


      {activeTab === "Lineups" && (
        <section className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wide text-zinc-400">Best Lineups (sortable)</h2>
            <p className="text-xs text-zinc-500">Sorted by {lineupSortKey} ({lineupSortDirection})</p>
          </div>

          {sortedLineups.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/10 text-zinc-300">
                  <tr>
                    {[
                      ["Lineup", null],
                      ["Minutes", "minutes"],
                      ["Net", "netRating"],
                      ["Off", "offenseRating"],
                      ["Def", "defenseRating"],
                      ["Pace", "pace"],
                      ["TS%", "trueShooting"],
                      ["eFG%", "effectiveFieldGoalPct"],
                      ["TO Ratio", "turnoverRatio"],
                      ["OREB%", "offensiveReboundPct"],
                      ["FT Rate", "freeThrowRate"],
                    ].map(([label, key]) => (
                      <th key={label} className="px-3 py-2 text-left">
                        {key ? (
                          <button type="button" className="hover:text-amber-300" onClick={() => onLineupSort(key as LineupSortKey)}>
                            {label}
                          </button>
                        ) : (
                          label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedLineups.map((lineup) => (
                    <tr key={lineup.idHash} className="border-b border-white/5 text-zinc-200">
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {lineup.athletes.map((athlete) => (
                            <Link key={athlete.id} href={`/player/${athlete.id}?name=${encodeURIComponent(athlete.name)}`} className="rounded border border-white/10 px-1.5 py-0.5 text-xs hover:border-amber-400/40 hover:text-amber-300">
                              {athlete.name}
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono">{dec(lineup.totalSeconds / 60, 1)}</td>
                      <td className="px-3 py-2 font-mono text-amber-300">{dec(lineup.netRating, 1)}</td>
                      <td className="px-3 py-2 font-mono">{dec(lineup.offenseRating, 1)}</td>
                      <td className="px-3 py-2 font-mono">{dec(lineup.defenseRating, 1)}</td>
                      <td className="px-3 py-2 font-mono">{dec(lineup.pace, 1)}</td>
                      <td className="px-3 py-2 font-mono">{pct(lineup.teamStats.trueShooting)}</td>
                      <td className="px-3 py-2 font-mono">{pct(lineup.teamStats.fourFactors.effectiveFieldGoalPct)}</td>
                      <td className="px-3 py-2 font-mono">{pct(lineup.teamStats.fourFactors.turnoverRatio)}</td>
                      <td className="px-3 py-2 font-mono">{pct(lineup.teamStats.fourFactors.offensiveReboundPct)}</td>
                      <td className="px-3 py-2 font-mono">{pct(lineup.teamStats.fourFactors.freeThrowRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-zinc-400">No lineup data available.</p>
          )}
        </section>
      )}

      {activeTab === "Shooting" && (
        <section className="space-y-4">
          {shooting ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatPill label="Tracked Shots" value={shooting.trackedShots} />
                <StatPill label="Assisted %" value={pct(shooting.assistedPct)} />
                <StatPill label="FT Rate" value={pct(shooting.freeThrowRate)} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {shotRows.map((row) => {
                  const progress = Math.max(0, Math.min(100, Math.abs(row.stat.pct) <= 1 ? row.stat.pct * 100 : row.stat.pct));
                  return (
                    <div key={row.label} className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-zinc-200">{row.label}</p>
                        <p className="font-mono text-sm text-zinc-300">
                          {row.stat.made}/{row.stat.attempted} ({pct(row.stat.pct)})
                        </p>
                      </div>
                      <div className="h-2 rounded bg-zinc-800">
                        <div className="h-2 rounded bg-amber-400" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-zinc-400">No shooting data available.</p>
          )}
        </section>
      )}
    </div>
  );
}
