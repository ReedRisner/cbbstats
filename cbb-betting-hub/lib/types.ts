// --- Games ---
export interface Game {
  id: number;
  sourceId: string;
  seasonLabel: string;
  season: number;
  seasonType: string;
  startDate: string;
  startTimeTbd: boolean;
  neutralSite: boolean;
  conferenceGame: boolean;
  gameType: string;
  tournament: string | null;
  gameNotes: string | null;
  status: string;
  attendance: number | null;
  homeTeamId: number;
  homeTeam: string;
  homeConferenceId: number;
  homeConference: string;
  homeSeed: number | null;
  homePoints: number | null;
  homePeriodPoints: number[];
  homeWinner: boolean | null;
  homeTeamEloStart: number | null;
  homeTeamEloEnd: number | null;
  awayTeamId: number;
  awayTeam: string;
  awayConferenceId: number;
  awayConference: string;
  awaySeed: number | null;
  awayPoints: number | null;
  awayPeriodPoints: number[];
  awayWinner: boolean | null;
  awayTeamEloStart: number | null;
  awayTeamEloEnd: number | null;
  excitement: number | null;
  venueId: number | null;
  venue: string | null;
  city: string | null;
  state: string | null;
}

// --- Shooting Stats (shared shape) ---
export interface ShootingPctStat {
  pct: number;
  attempted: number;
  made: number;
}

export interface AssistedShootingStat extends ShootingPctStat {
  assistedPct: number;
  assisted: number;
}

// --- Team Game Stats ---
export interface TeamGameStatsBlock {
  fieldGoals: ShootingPctStat;
  twoPointFieldGoals: ShootingPctStat;
  threePointFieldGoals: ShootingPctStat;
  freeThrows: ShootingPctStat;
  rebounds: { total: number; defensive: number; offensive: number };
  turnovers: { teamTotal: number; total: number };
  fouls: { flagrant: number; technical: number; total: number };
  points: {
    fastBreak: number; offTurnovers: number; inPaint: number;
    byPeriod?: number[]; largestLead?: number; total: number;
  };
  fourFactors: {
    freeThrowRate: number; offensiveReboundPct: number;
    turnoverRatio: number; effectiveFieldGoalPct: number;
  };
  assists: number;
  blocks: number;
  steals: number;
  possessions: number;
  rating: number;
  trueShooting: number;
  gameScore?: number;
}

export interface GameTeamStats {
  gameId: number;
  season: number;
  seasonLabel: string;
  seasonType: string;
  tournament: string | null;
  startDate: string;
  startTimeTbd: boolean;
  teamId: number;
  team: string;
  conference: string;
  teamSeed: number | null;
  opponentId: number;
  opponent: string;
  opponentConference: string;
  opponentSeed: number | null;
  neutralSite: boolean;
  isHome: boolean;
  conferenceGame: boolean;
  gameType: string;
  notes: string | null;
  gameMinutes: number;
  pace: number;
  teamStats: TeamGameStatsBlock;
  opponentStats: TeamGameStatsBlock;
}

// --- Player Game Stats ---
export interface PlayerGameEntry {
  rebounds: { total: number; defensive: number; offensive: number };
  freeThrows: ShootingPctStat;
  threePointFieldGoals: ShootingPctStat;
  twoPointFieldGoals: ShootingPctStat;
  fieldGoals: ShootingPctStat;
  offensiveReboundPct: number;
  freeThrowRate: number;
  assistsTurnoverRatio: number;
  gameScore: number;
  trueShootingPct: number;
  effectiveFieldGoalPct: number;
  netRating: number;
  defensiveRating: number;
  offensiveRating: number;
  usage: number;
  blocks: number;
  steals: number;
  assists: number;
  fouls: number;
  turnovers: number;
  points: number;
  minutes: number;
  ejected: boolean;
  starter: boolean;
  position: string;
  name: string;
  athleteSourceId: string;
  athleteId: number;
}

export interface GamePlayerStats {
  gameId: number;
  season: number;
  seasonLabel: string;
  seasonType: string;
  tournament: string | null;
  startDate: string;
  startTimeTbd: boolean;
  teamId: number;
  team: string;
  conference: string;
  teamSeed: number | null;
  opponentId: number;
  opponent: string;
  opponentConference: string;
  opponentSeed: number | null;
  neutralSite: boolean;
  isHome: boolean;
  conferenceGame: boolean;
  gameType: string;
  notes: string | null;
  gameMinutes: number;
  gamePace: number;
  players: PlayerGameEntry[];
}

// --- Play-by-Play ---
export interface Play {
  id: number;
  sourceId: string;
  gameId: number;
  gameSourceId: string;
  gameStartDate: string;
  season: number;
  seasonType: string;
  gameType: string;
  tournament: string | null;
  playType: string;
  isHomeTeam: boolean;
  teamId: number;
  team: string;
  conference: string;
  teamSeed: number | null;
  opponentId: number;
  opponent: string;
  opponentConference: string;
  opponentSeed: number | null;
  period: number;
  clock: string;
  secondsRemaining: number;
  homeScore: number;
  awayScore: number;
  homeWinProbability: number;
  scoringPlay: boolean;
  shootingPlay: boolean;
  scoreValue: number;
  wallclock: string;
  playText: string;
  participants: { name: string; id: number }[];
  onFloor: { team: string; name: string; id: number }[];
  shotInfo: {
    shooter: { name: string; id: number };
    made: boolean;
    range: string;
    assisted: boolean;
    assistedBy: { name: string; id: number } | null;
    location: { x: number; y: number };
  } | null;
}

// --- Substitutions ---
export interface Substitution {
  gameId: number;
  startDate: string;
  teamId: number;
  team: string;
  conference: string;
  athleteId: number;
  athlete: string;
  position: string;
  opponentId: number;
  opponent: string;
  opponentConference: string;
  subIn: { opponentPoints: number; teamPoints: number; secondsRemaining: number; period: number };
  subOut: { opponentPoints: number; teamPoints: number; secondsRemaining: number; period: number };
}

// --- Teams ---
export interface Team {
  id: number;
  sourceId: string;
  school: string;
  mascot: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  primaryColor: string;
  secondaryColor: string;
  currentVenueId: number;
  currentVenue: string;
  currentCity: string;
  currentState: string;
  conferenceId: number;
  conference: string;
}

// --- Roster ---
export interface RosterPlayer {
  id: number;
  sourceId: string;
  name: string;
  firstName: string;
  lastName: string;
  jersey: string;
  position: string;
  height: number;
  weight: number;
  hometown: {
    countyFips: string; longitude: number; latitude: number;
    country: string; state: string; city: string;
  };
  dateOfBirth: string;
  startSeason: number;
  endSeason: number;
}

export interface TeamRoster {
  teamId: number;
  teamSourceId: string;
  team: string;
  conference: string;
  season: number;
  players: RosterPlayer[];
}

// --- Conferences ---
export interface Conference {
  id: number;
  sourceId: string;
  name: string;
  abbreviation: string;
  shortName: string;
}

// --- Lineups ---
export interface LineupStatsBlock {
  possessions: number;
  points: number;
  blocks: number;
  assists: number;
  steals: number;
  turnovers: number;
  defensiveRebounds: number;
  offensiveRebounds: number;
  trueShooting: number;
  fieldGoals: ShootingPctStat;
  twoPointers: ShootingPctStat | string;
  threePointers: ShootingPctStat;
  freeThrows: ShootingPctStat;
  fourFactors: {
    freeThrowRate: number; offensiveReboundPct: number;
    turnoverRatio: number; effectiveFieldGoalPct: number;
  };
}

export interface Lineup {
  teamId: number;
  team: string;
  conference: string;
  idHash: string;
  athletes: { name: string; id: number }[];
  totalSeconds: number;
  pace: number;
  offenseRating: number;
  defenseRating: number;
  netRating: number;
  teamStats: LineupStatsBlock;
  opponentStats: LineupStatsBlock;
}

// --- Team Season Stats ---
export interface TeamSeasonStats {
  season: number;
  seasonLabel: string;
  teamId: number;
  team: string;
  conference: string;
  games: number;
  wins: number;
  losses: number;
  totalMinutes: number;
  pace: number;
  teamStats: TeamGameStatsBlock;
  opponentStats: TeamGameStatsBlock;
}

// --- Shooting Season Stats (team & player share this shape) ---
export interface ShootingSeasonStats {
  season: number;
  teamId: number;
  team: string;
  conference: string;
  trackedShots: number;
  assistedPct: number;
  freeThrowRate: number;
  dunks: AssistedShootingStat;
  layups: AssistedShootingStat;
  tipIns: ShootingPctStat;
  twoPointJumpers: AssistedShootingStat;
  threePointJumpers: AssistedShootingStat;
  freeThrows: ShootingPctStat;
  attemptsBreakdown: {
    threePointJumpers: number; twoPointJumpers: number;
    tipIns: number; layups: number; dunks: number;
  };
  athleteId?: number;
  athleteName?: string;
}

// --- Player Season Stats ---
export interface PlayerSeasonStats {
  season: number;
  seasonLabel: string;
  teamId: number;
  team: string;
  conference: string;
  athleteId: number;
  athleteSourceId: string;
  name: string;
  position: string;
  games: number;
  starts: number;
  minutes: number;
  points: number;
  turnovers: number;
  fouls: number;
  assists: number;
  steals: number;
  blocks: number;
  usage: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  PORPAG: number;
  effectiveFieldGoalPct: number;
  trueShootingPct: number;
  assistsTurnoverRatio: number;
  freeThrowRate: number;
  offensiveReboundPct: number;
  fieldGoals: ShootingPctStat;
  twoPointFieldGoals: ShootingPctStat;
  threePointFieldGoals: ShootingPctStat;
  freeThrows: ShootingPctStat;
  rebounds: { total: number; defensive: number; offensive: number };
  winShares: { totalPer40: number; total: number; defensive: number; offensive: number };
}

// --- Rankings ---
export interface Ranking {
  season: number;
  seasonType: string;
  week: number;
  pollDate: string;
  pollType: string;
  teamId: number;
  team: string;
  conference: string;
  ranking: number;
  points: number;
  firstPlaceVotes: number;
}

// --- Adjusted Ratings ---
export interface AdjustedRating {
  season: number;
  teamId: number;
  team: string;
  conference: string;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  rankings: { net: number; defense: number; offense: number };
}

// --- ELO ---
export interface EloRating {
  season: number;
  teamId: number;
  team: string;
  conference: string;
  elo: number;
}

// --- Betting Lines ---
export interface BettingLineProvider {
  provider: string;
  spread: number;
  overUnder: number;
  homeMoneyline: number;
  awayMoneyline: number;
  spreadOpen: number;
  overUnderOpen: number;
}

export interface BettingLine {
  gameId: number;
  season: number;
  seasonType: string;
  startDate: string;
  homeTeamId: number;
  homeTeam: string;
  homeConference: string;
  homeScore: number | null;
  awayTeamId: number;
  awayTeam: string;
  awayConference: string;
  awayScore: number | null;
  lines: BettingLineProvider[];
}

// --- Play Types ---
export interface PlayType {
  id: number;
  name: string;
}
