# CBB Betting Hub — Phased Build Guide for Codex

## Quick Start

Feed each phase file to Codex **in order**. Each phase is self-contained with its own Codex prompt, files to create, API endpoints, and acceptance criteria.

---

## Phase Overview

| Phase | Name | What It Builds | Key Files |
|-------|------|---------------|-----------|
| **0** | Setup | Project scaffold, API wrapper, all TypeScript types, UI primitives, layout | `lib/api.ts`, `lib/types.ts`, `lib/utils.ts`, all `components/ui/*` |
| **1** | Dashboard | Today's games with betting lines, AP Top 25, efficiency ratings | `app/page.tsx`, `components/GameCard.tsx` |
| **2** | Game Page | Full game detail — overview, box score, lineups, betting analysis | `app/game/[id]/page.tsx`, `BoxScore.tsx`, `LineupCard.tsx`, `BettingLines.tsx` |
| **3** | Player Page | Player stats, game log, shooting breakdown | `app/player/[id]/page.tsx`, `PlayerGameLog.tsx`, `ShootingBreakdown.tsx` |
| **4** | Team Page | Team overview, roster, schedule, shooting | `app/team/[name]/page.tsx` |
| **5** | Search & Rankings | Player search, AP Poll, efficiency rankings, ELO | `app/search/page.tsx`, `app/rankings/page.tsx` |
| **6** | Betting Tools | Line shopping, ATS records, O/U tracker, implied probability | `app/betting/page.tsx` |
| **7** | Visualizations | Shot chart, win probability chart, efficiency scatter plot | `ShotChart.tsx`, `WinProbChart.tsx`, `EfficiencyScatter.tsx` |
| **8** | Polish & Deploy | Play-by-play feed, substitutions, skeletons, errors, SEO, deploy | Various updates + new files |

---

## Build Order & Dependencies

```
Phase 0 (Setup)
  ├── Phase 1 (Dashboard)
  │     └── Phase 2 (Game Page)
  │           └── Phase 7 (Visualizations — shot chart, win prob)
  ├── Phase 3 (Player Page)
  ├── Phase 4 (Team Page)
  ├── Phase 5 (Search & Rankings)
  │     └── Phase 7 (Visualizations — scatter plot)
  ├── Phase 6 (Betting Tools)
  └── Phase 8 (Polish & Deploy) — depends on all above
```

---

## API Key

```
Bearer 0/5PdgRvOqvcUo9VqUAcXFUEYqXxU3T26cGqt9c6FFArBcyqE4BD3njMuwOnQz+3
```

Store as `NEXT_PUBLIC_CBB_API_KEY` in `.env.local`. **Do not commit to git.**

---

## API Endpoints Used Across All Phases

| # | Endpoint | Phases |
|---|----------|--------|
| 1 | `/games` | 1, 2, 4, 6 |
| 2 | `/games/teams` | 2 |
| 3 | `/games/players` | 2, 3 |
| 4 | `/plays/game/{gameId}` | 7, 8 |
| 5 | `/plays/player/{playerId}` | 8 |
| 6 | `/plays/types` | 8 |
| 7 | `/substitutions/game/{gameId}` | 8 |
| 8 | `/teams` | 4, 8 |
| 9 | `/teams/roster` | 3, 4 |
| 10 | `/conferences` | 8 |
| 11 | `/lineups/team` | 8 |
| 12 | `/lineups/game/{gameId}` | 2 |
| 13 | `/stats/team/season` | 4 |
| 14 | `/stats/team/shooting/season` | 4 |
| 15 | `/stats/player/season` | 3, 5, 8 |
| 16 | `/stats/player/shooting/season` | 3 |
| 17 | `/rankings` | 1, 5 |
| 18 | `/ratings/adjusted` | 1, 5, 6, 7 |
| 19 | `/ratings/elo` | 5 |
| 20 | `/lines` | 1, 2, 6 |

---

## Design System (All Phases)

```
Background:   zinc-950 (#09090b)
Cards:        zinc-900/80 + border-white/5
Accent:       amber-400 (#fbbf24)
Green:        green-400 (#4ade80) — wins, covers, overs
Red:          red-400 (#f87171) — losses, misses
Blue:         blue-400 — conference games
Purple:       purple-400 — neutral site
Headings:     'Playfair Display', serif
Body:         'DM Sans', sans-serif
Stats/Mono:   'JetBrains Mono', monospace
```

---

## Final App Structure After All Phases

```
app/
├── page.tsx                    (Phase 1)
├── game/[id]/page.tsx          (Phase 2, updated 7+8)
├── player/[id]/page.tsx        (Phase 3, updated 8)
├── team/[name]/page.tsx        (Phase 4, updated 8)
├── search/page.tsx             (Phase 5)
├── rankings/page.tsx           (Phase 5, updated 7)
├── betting/page.tsx            (Phase 6)
├── conferences/page.tsx        (Phase 8)
└── layout.tsx                  (Phase 0)

components/
├── ui/StatPill.tsx             (Phase 0)
├── ui/FourFactorsBar.tsx       (Phase 0)
├── ui/Loader.tsx               (Phase 0)
├── ui/ErrorMsg.tsx             (Phase 0)
├── ui/Tabs.tsx                 (Phase 0)
├── Navbar.tsx                  (Phase 0, updated 6+8)
├── GameCard.tsx                (Phase 1)
├── BoxScore.tsx                (Phase 2)
├── LineupCard.tsx              (Phase 2)
├── BettingLines.tsx            (Phase 2)
├── PlayerGameLog.tsx           (Phase 3)
├── ShootingBreakdown.tsx       (Phase 3)
├── ShotChart.tsx               (Phase 7)
├── WinProbChart.tsx            (Phase 7)
├── EfficiencyScatter.tsx       (Phase 7)
├── PlayByPlayFeed.tsx          (Phase 8)
├── SubstitutionTracker.tsx     (Phase 8)
├── SkeletonCard.tsx            (Phase 8)
├── SkeletonTable.tsx           (Phase 8)
└── ErrorBoundary.tsx           (Phase 8)

lib/
├── api.ts                      (Phase 0)
├── types.ts                    (Phase 0)
├── utils.ts                    (Phase 0)
└── constants.ts                (Phase 0)
```

---

## Tips for Working with Codex

1. **Feed one phase at a time.** Each phase document contains a complete Codex prompt — copy the text inside the code block.

2. **Verify each phase works before moving on.** Run `npm run dev` and check the acceptance criteria.

3. **If Codex misses something**, paste the acceptance criteria as a follow-up prompt: "The following items are not working yet: [items]. Please fix them."

4. **For Phase 0**, you may want to paste the full `lib/types.ts` content rather than asking Codex to generate it — the types are long but well-defined in the phase doc.

5. **The .jsx prototype file** (cbb-betting-tool.jsx) is a working reference implementation. If Codex gets stuck on any component, reference that file for working logic.

---
---

# Phase 0 — Project Setup, API Layer & Shared Code

## Goal
Scaffold the Next.js project, create the API wrapper, define all TypeScript types, build reusable UI primitives, and configure styling. **No pages yet** — this phase is pure infrastructure.

---

## Codex Prompt

```
Create a Next.js 14 app (App Router) with TypeScript and Tailwind CSS. Do NOT create any pages beyond a placeholder app/page.tsx. Focus entirely on infrastructure:

1. Initialize the project with: npx create-next-app@latest cbb-betting-hub --typescript --tailwind --app
2. Install dependencies: recharts, lucide-react, clsx
3. Create .env.local with NEXT_PUBLIC_CBB_API_KEY
4. Create the files listed below with the exact code specified.

The app connects to the College Basketball Data API at https://api.collegebasketballdata.com
Auth: Bearer token in Authorization header.
Current season: 2025

Follow the design system:
- Background: zinc-950 (#09090b)
- Cards: zinc-900/80 with border-white/5
- Accent: amber-400 (#fbbf24)
- Fonts: 'Playfair Display' (headings), 'DM Sans' (body), 'JetBrains Mono' (stats/numbers)
- Dark theme only
```

---

## Files to Create

### `lib/constants.ts`
```typescript
export const API_BASE = "https://api.collegebasketballdata.com";
export const SEASON = 2025;
```

### `lib/api.ts`
```typescript
import { API_BASE } from "./constants";

const headers: HeadersInit = {
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_CBB_API_KEY}`,
  Accept: "application/json",
};

export async function apiFetch<T>(
  endpoint: string,
  params: Record<string, string | number | undefined | null> = {}
): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "")
      url.searchParams.append(k, String(v));
  });
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}
```

### `lib/types.ts`
Define full TypeScript interfaces for EVERY API response:

```typescript
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
```

### `lib/utils.ts`
```typescript
export function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(d: string | null): string {
  if (!d) return "TBD";
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function pct(v: number | null | undefined): string {
  return v != null ? `${(v * 100).toFixed(1)}%` : "—";
}

export function dec(v: number | null | undefined, d = 1): string {
  return v != null ? v.toFixed(d) : "—";
}

export function sign(v: number): string {
  return v > 0 ? `+${v}` : `${v}`;
}

export function moneyline(v: number | null | undefined): string {
  if (v == null) return "—";
  return v > 0 ? `+${v}` : `${v}`;
}

export function heightStr(inches: number | null): string {
  if (!inches) return "—";
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

export function perGame(total: number, games: number): string {
  if (!games) return "0.0";
  return (total / games).toFixed(1);
}

export function impliedProbability(ml: number): number {
  if (ml < 0) return Math.abs(ml) / (Math.abs(ml) + 100);
  return 100 / (ml + 100);
}

export function coverMargin(homePoints: number, awayPoints: number, spread: number): number {
  return (homePoints - awayPoints) + spread;
}
```

### `components/ui/StatPill.tsx`
Reusable stat display component with label + value + optional accent highlight.

### `components/ui/FourFactorsBar.tsx`
Dual-bar comparison for team vs opponent four factors.

### `components/ui/Loader.tsx`
Centered spinner with amber accent.

### `components/ui/ErrorMsg.tsx`
Red error text, centered.

### `components/ui/Tabs.tsx`
Reusable tab bar component accepting `tabs: string[]`, `active: string`, `onChange: (tab: string) => void`.

### `components/Navbar.tsx`
Sticky top nav with logo, Dashboard/Players/Rankings links. Uses `next/link`.

### `app/layout.tsx`
Root layout importing Google Fonts (Playfair Display, DM Sans, JetBrains Mono), Navbar, global styles.

### `styles/globals.css`
Tailwind directives + custom scrollbar styles + font-family overrides.

### `tailwind.config.ts`
Extend with font families and amber accent color.

### `.env.local`
```
NEXT_PUBLIC_CBB_API_KEY=0/5PdgRvOqvcUo9VqUAcXFUEYqXxU3T26cGqt9c6FFArBcyqE4BD3njMuwOnQz+3
```

---

## Acceptance Criteria
- [ ] `npm run dev` starts without errors
- [ ] `lib/api.ts` exports `apiFetch` function
- [ ] `lib/types.ts` exports all 20+ interfaces
- [ ] `lib/utils.ts` exports all formatting helpers
- [ ] All UI primitives render correctly in isolation
- [ ] Navbar renders with working links
- [ ] Placeholder `app/page.tsx` renders "Dashboard coming in Phase 1"
- [ ] Tailwind configured with custom fonts and colors
- [ ] `.env.local` created with API key

---
---

# Phase 1 — Dashboard (Today's Games + Rankings + Ratings)

## Goal
Build the main dashboard page showing today's games with betting lines, AP Top 25, and adjusted efficiency ratings. This is the landing page users see first.

## Depends On
Phase 0 (API layer, types, UI primitives, layout)

---

## Codex Prompt

```
Build the dashboard page at app/page.tsx for the CBB Betting Hub.

This page fetches data from 4 API endpoints on load (client-side with useEffect):
1. GET /games?season=2025&date={today's date as YYYY-MM-DD} → today's games
2. GET /lines?season=2025 → betting lines (match to games by gameId)
3. GET /rankings?season=2025 → AP Top 25 poll data
4. GET /ratings/adjusted?season=2025 → adjusted efficiency ratings

Use the apiFetch function from lib/api.ts. Use types from lib/types.ts.
Use formatting helpers from lib/utils.ts.

Page layout:
1. HERO SECTION: "College Basketball Betting Hub" title, "2024-25 Season" subtitle, amber accent
2. GAMES SECTION with date filter toggle (Today / Recent):
   - Each game is a clickable card (links to /game/[id]) showing:
     - Status badges: CONF, NEUTRAL, FINAL, LIVE (animated pulse)
     - Game time
     - Away team name + conference + adjusted rank
     - Score (or "VS" if not started)
     - Home team name + conference + adjusted rank
     - Betting line sidebar: spread, O/U, moneylines (from first provider)
     - Venue, city, state, attendance
   - If no games today, show "No games found" message
3. TWO-COLUMN GRID below games:
   - LEFT: AP Top 25 (filter rankings for pollType containing "AP", sort by ranking)
     - Each row: rank number, team name, conference, first-place votes
     - Clickable rows → /team/[name]
   - RIGHT: Top 20 Adjusted Efficiency
     - Sort by rankings.net ascending, take top 20
     - Each row: rank, team, offensive rating, defensive rating, net rating
     - Clickable rows → /team/[name]

Build a GameCard component at components/GameCard.tsx for reuse.

Styling: dark zinc-950 bg, zinc-900/80 cards with border-white/5, amber-400 accents.
Font: Playfair Display for headings, JetBrains Mono for stats.
Make it "use client" since it uses useEffect/useState.

Create a linesMap (gameId → BettingLine) and ratingsMap (teamId → AdjustedRating) 
with useMemo for efficient lookups.
```

---

## Files to Create/Modify

### `app/page.tsx`
Main dashboard page. "use client" directive. Fetches 4 endpoints, renders game cards + rankings.

### `components/GameCard.tsx`
Reusable game card component. Props:
```typescript
interface GameCardProps {
  game: Game;
  line?: BettingLine;
  homeRating?: AdjustedRating;
  awayRating?: AdjustedRating;
}
```

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /games?season=2025&date={YYYY-MM-DD}` | Today's games |
| `GET /lines?season=2025` | All betting lines for season |
| `GET /rankings?season=2025` | Poll rankings (AP Top 25) |
| `GET /ratings/adjusted?season=2025` | Adjusted efficiency ratings |

---

## Acceptance Criteria
- [ ] Dashboard loads and shows today's games (or "no games" message)
- [ ] Each game card shows both teams, score/time, status badges
- [ ] Betting lines (spread, O/U, ML) display on each game card
- [ ] "Today" / "Recent" toggle works
- [ ] AP Top 25 panel shows ranked teams, clickable to /team/[name]
- [ ] Efficiency ratings panel shows top 20 with Off/Def/Net ratings
- [ ] Clicking a game card navigates to /game/[id]
- [ ] Loading spinner shows while data loads
- [ ] Adjusted efficiency rank numbers show next to team names on game cards

---
---

# Phase 2 — Game Detail Page

## Goal
Build the full game detail page at `/game/[id]` with tabs for Overview, Box Score, Lineups, and Betting. This is the most data-rich page in the app.

## Depends On
Phase 0 (types, API, UI primitives), Phase 1 (navigation from dashboard)

---

## Codex Prompt

```
Build the game detail page at app/game/[id]/page.tsx for the CBB Betting Hub.

This is a "use client" page. Extract the game ID from the URL params.

On mount, fetch all data in parallel using Promise.allSettled:
1. GET /games?season=2025&id={gameId}              → game info
2. GET /games/teams?season=2025&gameId={gameId}    → team box stats
3. GET /games/players?season=2025&gameId={gameId}  → player box stats  
4. GET /lines?season=2025&gameId={gameId}          → betting lines
5. GET /lineups/game/{gameId}                      → lineup stats

Use Promise.allSettled so partial failures don't break the page.

PAGE HEADER:
- Back button → dashboard
- Status badges (FINAL, LIVE with pulse animation, CONFERENCE)
- Date + time
- Away team (left, clickable → /team/[name]) with conference + seed
- Score in large mono font (winner highlighted amber-400)
- Home team (right, clickable → /team/[name]) with conference + seed
- Venue, city, state, attendance
- ELO ratings: start → end for both teams
- Excitement index

TAB BAR with 4 tabs: Overview | Box Score | Lineups | Betting

OVERVIEW TAB:
- Period-by-period scoring table (H1, H2, OT1, etc. + Total)
- Team stats comparison grid using StatPill:
  FG%, 3PT%, Rebounds, Turnovers, Assists, Steals, Blocks, Pace
- Four Factors visualization using FourFactorsBar (Away vs Home):
  eFG%, TO Ratio, OREB%, FT Rate
- Betting line summary if available: spread, O/U, home/away ML

BOX SCORE TAB (components/BoxScore.tsx):
- One table per team (away first, then home)
- Columns: Player (sticky left), MIN, PTS, FG (made-att), 3PT, FT, REB, AST, STL, BLK, TO, PF, +/- (netRating), Usage, eFG%, GameScore
- Starters marked with ★ and sorted first, then by minutes
- Player names clickable → /player/[id]
- Starter rows full opacity, bench rows slightly dimmed

LINEUPS TAB (components/LineupCard.tsx):
- Sort lineups by totalSeconds descending, show top 15
- Each lineup card shows:
  - Team name + time played (formatted as M:SS)
  - Offensive rating (green), defensive rating (red), net rating (amber)
  - Player name pills (clickable → /player/[id])
  - Bottom row: pace, points, possessions, true shooting %

BETTING TAB (components/BettingLines.tsx):
- All provider lines in a comparison table:
  Provider, Spread, O/U, Home ML, Away ML, Open Spread, Open O/U
- Line movement section: opening → current for spread and O/U
  Show point movement amount
- ATS Result (if game is complete):
  Calculate: actualDiff = homePoints - awayPoints
  coverMargin = actualDiff + spread
  Display: HOME COVERS (green) / AWAY COVERS (red) / PUSH
- O/U Result (if complete):
  total = homePoints + awayPoints
  Display: total, OVER (green) / UNDER (red) / PUSH
- Actual margin display

Styling: same dark theme. Use amber-400 for betting accent.
```

---

## Files to Create

### `app/game/[id]/page.tsx`
Main game page with all tab logic.

### `components/BoxScore.tsx`
Full player box score table. Props:
```typescript
interface BoxScoreProps {
  teamData: GamePlayerStats;
  onPlayerClick: (id: number, name: string) => void;
}
```

### `components/LineupCard.tsx`
Single lineup display card. Props:
```typescript
interface LineupCardProps {
  lineup: Lineup;
  onPlayerClick: (id: number, name: string) => void;
}
```

### `components/BettingLines.tsx`
Full betting tab content. Props:
```typescript
interface BettingLinesProps {
  lines: BettingLine | null;
  game: Game;
}
```

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /games?season=2025&id={gameId}` | Game metadata |
| `GET /games/teams?season=2025&gameId={gameId}` | Team-level box stats |
| `GET /games/players?season=2025&gameId={gameId}` | Player-level box stats |
| `GET /lines?season=2025&gameId={gameId}` | Betting lines |
| `GET /lineups/game/{gameId}` | Lineup combinations + stats |

---

## Acceptance Criteria
- [ ] Game page loads for any valid game ID
- [ ] Header shows both teams, score, venue, ELO ratings
- [ ] Tab switching works between all 4 tabs
- [ ] Overview shows period scoring, stat comparison, four factors
- [ ] Box score shows full player stats for both teams with all columns
- [ ] Player names link to /player/[id]
- [ ] Lineups sorted by minutes, show ratings and player pills
- [ ] Betting tab shows all providers, line movement, ATS/O/U results
- [ ] Partial API failures don't crash the page (allSettled)
- [ ] Back button navigates to dashboard

---
---

# Phase 3 — Player Detail Page

## Goal
Build the player detail page at `/player/[id]` with tabs for Season Stats, Game Log, and Shooting breakdown. This is the primary player analysis tool for betting (player props, matchup research).

## Depends On
Phase 0 (types, API, UI primitives), Phase 2 (navigation from box scores)

---

## Codex Prompt

```
Build the player detail page at app/player/[id]/page.tsx for the CBB Betting Hub.

This is a "use client" page. Extract the player ID from URL params.
Also accept an optional searchParam for the player's name (passed from linking pages).

On mount, fetch data in parallel with Promise.allSettled:
1. GET /stats/player/season?season=2025&athleteId={playerId}    → season stats
2. GET /games/players?season=2025&athleteId={playerId}          → game-by-game stats
3. GET /stats/player/shooting/season?season=2025&athleteId={playerId} → shooting breakdown

After season stats load, use the team name to fetch roster info:
4. GET /teams/roster?season=2025&team={teamName}                → find player's bio

PAGE HEADER:
- Back button
- Player name (large, Playfair Display)
- Team name (clickable → /team/[name]), conference, position
- Bio row (from roster): jersey number, height, weight, hometown
- Large PPG number on the right (season points / games)

TAB BAR: Season Stats | Game Log | Shooting

SEASON STATS TAB:
Section 1 - Per-Game Averages grid (StatPill):
  Games/Starts, Minutes/G, PPG, RPG, APG, SPG, BPG, TO/G, FG%, 3PT%

Section 2 - Advanced Metrics (StatPill in card):
  Usage, Off Rating, Def Rating, Net Rating, eFG%, TS%, AST/TO, FT Rate, OREB%, PORPAG
  Accent the key ones: Usage, Net Rating, TS%, PORPAG

Section 3 - Shooting Splits:
  Three cards side by side for FG, 3PT, FT
  Each shows: made-attempted (large), percentage (amber), label

Section 4 - Win Shares (if available):
  Total, Offensive, Defensive, Per 40 min

GAME LOG TAB (components/PlayerGameLog.tsx):
- Table with all games this season
- Data: flatten gameStats array → find entries where player.athleteId matches
- Sort by startDate descending (most recent first)
- Columns: Date, Opp (with @/vs prefix), MIN, PTS, FG (made-att), 3PT, FT, REB, AST, STL, BLK, TO, Usage, eFG%, GameScore
- Clickable rows → /game/[gameId]

SHOOTING TAB (components/ShootingBreakdown.tsx):
- Top row: Tracked Shots, Assisted %, FT Rate
- For each shot type (dunks, layups, twoPointJumpers, threePointJumpers, tipIns, freeThrows):
  - Card with name, percentage, made/attempted, assisted count, assisted %
  - Progress bar showing pct (amber fill on zinc-800 bg)
  - Skip types with 0 attempts
- Attempts Breakdown: 5-column grid showing count for each shot type

Use the utils from lib/utils.ts: pct(), dec(), heightStr(), perGame().
Styling: same dark theme. Amber accents on key betting-relevant stats.
```

---

## Files to Create

### `app/player/[id]/page.tsx`
Main player page with all tab logic.

### `components/PlayerGameLog.tsx`
Game-by-game log table. Props:
```typescript
interface PlayerGameLogProps {
  gameStats: GamePlayerStats[];
  playerId: number;
  onGameClick: (gameId: number) => void;
}
```

### `components/ShootingBreakdown.tsx`
Shot type breakdown display. Props:
```typescript
interface ShootingBreakdownProps {
  stats: ShootingSeasonStats;
}
```

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /stats/player/season?season=2025&athleteId={id}` | Season averages + advanced stats |
| `GET /games/players?season=2025&athleteId={id}` | Every game this season with full stats |
| `GET /stats/player/shooting/season?season=2025&athleteId={id}` | Shot type breakdown |
| `GET /teams/roster?season=2025&team={name}` | Bio info (height, weight, jersey, hometown) |

---

## Key Betting-Relevant Stats to Highlight
These are the stats bettors care about most for player props:
- **PPG** (points prop)
- **RPG** (rebounds prop)
- **APG** (assists prop)
- **3PT made per game** (threes prop)
- **Usage** (how involved in the offense)
- **Minutes** (correlation to all counting stats)
- **Game-by-game variance** (consistency for props)
- **Recent form** (last 5 games trending)

---

## Acceptance Criteria
- [ ] Player page loads with season stats, game log, shooting data
- [ ] Header shows name, team (clickable), position, bio info
- [ ] PPG displayed prominently
- [ ] Season tab shows per-game averages, advanced metrics, shooting splits, win shares
- [ ] Game log shows all games sorted by date with full stat columns
- [ ] Game log rows clickable → /game/[id]
- [ ] Shooting tab shows breakdown by shot type with progress bars
- [ ] Attempts breakdown grid renders
- [ ] Missing data handled gracefully (dashes, hidden sections)
- [ ] Back button works

---
---

# Phase 4 — Team Detail Page

## Goal
Build the team detail page at `/team/[name]` with tabs for Overview, Roster, Schedule, and Shooting. This is where bettors research team tendencies, form, and matchup data.

## Depends On
Phase 0 (types, API, UI), Phase 1 (navigation from dashboard/rankings)

---

## Codex Prompt

```
Build the team detail page at app/team/[name]/page.tsx for the CBB Betting Hub.

This is a "use client" page. The team name comes from the URL (decoded).

On mount, fetch all data in parallel with Promise.allSettled:
1. GET /teams?team={name}                                    → team info (colors, venue)
2. GET /stats/team/season?season=2025&team={name}            → season stats
3. GET /teams/roster?season=2025&team={name}                 → roster
4. GET /stats/team/shooting/season?season=2025&team={name}   → shooting breakdown
5. GET /ratings/adjusted?season=2025&team={name}             → adjusted efficiency
6. GET /games?season=2025&team={name}                        → schedule/results

PAGE HEADER:
- Back button
- 1px color bar at top using team's primaryColor (from /teams response)
- Team display name (Playfair Display, large)
- Conference, mascot
- Venue, city, state
- Record: W-L (large mono, green wins / red losses)
- Adjusted efficiency: Off (green), Def (red), Net (amber) with national ranks

TAB BAR: Overview | Roster | Schedule | Shooting

OVERVIEW TAB:
Section 1 - Key Stats grid (StatPill):
  PPG (total points / games), Opp PPG, Pace, FG%, 3PT%, FT%,
  RPG, APG, TO/G, Rating
  Accent: PPG, Pace, Rating

Section 2 - Four Factors (FourFactorsBar, team vs opponent):
  eFG%, TO Ratio, OREB%, FT Rate
  Uses teamStats.fourFactors vs opponentStats.fourFactors

ROSTER TAB:
- Table: Jersey #, Name, Position, Height, Weight, Hometown
- Sort by jersey number
- Player names clickable → /player/[id]
- Use heightStr() for height display

SCHEDULE TAB:
- List of all games sorted by date descending
- Each row: date, home/away indicator (vs/@), opponent name, 
  W/L badge (green/red), score
- Clickable rows → /game/[id]

SHOOTING TAB:
- Top row: Tracked Shots, Assisted %, FT Rate
- Shot type cards (same as player shooting but for team):
  dunks, layups, twoPointJumpers, threePointJumpers, tipIns, freeThrows
  Each: name, made/attempted, pct, progress bar
- Attempts breakdown grid

Use team primaryColor from the API as an accent where possible 
(border color on header, subtle glow). Fall back to amber if no color.

Styling: same dark theme.
```

---

## Files to Create

### `app/team/[name]/page.tsx`
Main team page with all tab logic.

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /teams?team={name}` | Team info (colors, venue, conference, mascot) |
| `GET /stats/team/season?season=2025&team={name}` | Full season stats (W/L, shooting, rebounds, etc.) |
| `GET /teams/roster?season=2025&team={name}` | Full roster with bio info |
| `GET /stats/team/shooting/season?season=2025&team={name}` | Shot type breakdown |
| `GET /ratings/adjusted?season=2025&team={name}` | Adjusted Off/Def/Net efficiency + ranks |
| `GET /games?season=2025&team={name}` | All games for schedule display |

---

## Key Betting-Relevant Team Data
- **Pace** (impacts totals / over-unders)
- **Offensive / Defensive Rating** (team quality indicator)
- **3PT%** (impacts scoring variance)
- **Turnover ratio** (opponent forcing turnovers = edge)
- **Free throw rate** (indicates foul-drawing ability)
- **OREB%** (second chance points)
- **Recent schedule** (W/L streak, quality of opponents)

---

## Acceptance Criteria
- [ ] Team page loads for any valid team name
- [ ] Header shows team name, colors, record, venue, efficiency ratings
- [ ] Team primary color used as accent (top bar, border)
- [ ] Overview shows per-game stats + four factors comparison
- [ ] Roster table shows all players with bio info
- [ ] Player names clickable → /player/[id]
- [ ] Schedule shows all games with W/L indicators
- [ ] Game rows clickable → /game/[id]
- [ ] Shooting tab shows shot type breakdown with progress bars
- [ ] Handles teams with no data gracefully

---
---

# Phase 5 — Player Search & Rankings Page

## Goal
Build the player search page at `/search` and a dedicated rankings page at `/rankings`. These are the discovery/browse tools.

## Depends On
Phase 0 (types, API, UI), Phase 3 (player page to navigate to)

---

## Codex Prompt

```
Build two pages for the CBB Betting Hub:

=== PAGE 1: Player Search at app/search/page.tsx ===

"use client" page with a search input and results table.

How search works:
- When user clicks Search (or presses Enter), fetch ALL player season stats:
  GET /stats/player/season?season=2025
- Filter client-side by player name (case-insensitive includes)
- Show top 50 results in a table
- Cache the full player list in state so subsequent searches are instant

Search UI:
- Large heading "Player Search" with search icon
- Text input with placeholder "Search by player name..."
- Search button (amber-400 bg, black text)
- Keyboard support: Enter triggers search

Results Table columns:
  Name (white, clickable → /player/[athleteId]), Team, Position, Games,
  PPG (points/games), RPG (rebounds.total/games), APG (assists/games),
  FG%, 3PT%, TS% (amber), Net Rating (amber)

States:
- Initial: no results, no message
- Loading: show Loader
- Results: show table
- No results: show "No players found matching '{query}'"

=== PAGE 2: Rankings at app/rankings/page.tsx ===

"use client" page showing three ranking views.

Fetch on mount:
1. GET /rankings?season=2025       → poll data
2. GET /ratings/adjusted?season=2025  → efficiency ratings  
3. GET /ratings/elo?season=2025    → ELO ratings

TAB BAR: AP Poll | Efficiency | ELO

AP POLL TAB:
- Filter rankings for pollType containing "AP"
- Sort by ranking ascending
- Table: Rank, Team (clickable → /team/[name]), Conference, Points, 1st Place Votes
- Show all 25 ranked teams

EFFICIENCY TAB:
- Show ALL teams sorted by rankings.net ascending
- Table: Rank (#net), Team (clickable), Conference, 
  Off Rating, Def Rating, Net Rating,
  Off Rank, Def Rank
- Make table sortable: clicking column headers sorts by that column
- Highlight top 25 with subtle amber left border
- This is the most useful view for bettors (KenPom-style)

ELO TAB:
- Sort by elo descending
- Table: Rank (by position), Team (clickable), Conference, ELO
- Show top 50

All team names link to /team/[name].
Styling: same dark theme. JetBrains Mono for all numbers.
```

---

## Files to Create

### `app/search/page.tsx`
Player search page with input, button, and results table.

### `app/rankings/page.tsx`
Rankings page with AP Poll, Efficiency, and ELO tabs.

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /stats/player/season?season=2025` | All player stats (searched client-side) |
| `GET /rankings?season=2025` | AP Poll rankings |
| `GET /ratings/adjusted?season=2025` | All adjusted efficiency ratings |
| `GET /ratings/elo?season=2025` | All ELO ratings |

---

## Sorting Implementation (Efficiency Tab)

```typescript
const [sortKey, setSortKey] = useState<string>("net");
const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

const sorted = useMemo(() => {
  return [...ratings].sort((a, b) => {
    let aVal, bVal;
    switch (sortKey) {
      case "net": aVal = a.rankings?.net ?? 999; bVal = b.rankings?.net ?? 999; break;
      case "offense": aVal = a.offensiveRating; bVal = b.offensiveRating; break;
      case "defense": aVal = a.defensiveRating; bVal = b.defensiveRating; break;
      // etc.
    }
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });
}, [ratings, sortKey, sortDir]);
```

---

## Acceptance Criteria
- [ ] Search page renders with input and button
- [ ] Searching a name returns matching players in a table
- [ ] Subsequent searches are instant (cached player list)
- [ ] Player names clickable → /player/[id]
- [ ] Rankings page shows AP Top 25 with points and first-place votes
- [ ] Efficiency tab shows all teams with sortable columns
- [ ] Clicking column headers toggles sort
- [ ] ELO tab shows top 50 by ELO rating
- [ ] All team names link to /team/[name]
- [ ] Loading states and empty states handled

---
---

# Phase 6 — Betting Tools Page

## Goal
Build a dedicated `/betting` page with advanced betting-specific features: line shopping, ATS records, O/U tracking, implied probability, and cover margin analysis. This is the core value-add for bettors.

## Depends On
Phase 0 (types, API, utils), Phase 1 (dashboard navigation), Phase 2 (game page links)

---

## Codex Prompt

```
Build a dedicated betting tools page at app/betting/page.tsx for the CBB Betting Hub.
Add a "Betting" link to the Navbar.

This is a "use client" page. On mount, fetch:
1. GET /lines?season=2025                    → all betting lines
2. GET /games?season=2025                    → all games (for results)
3. GET /ratings/adjusted?season=2025         → efficiency (for power ratings)

TAB BAR: Today's Lines | Line Shopping | ATS Records | O/U Tracker | Probability

=== TODAY'S LINES TAB ===
- Filter games to today's date
- For each game, show a card with:
  - Teams, time, conference
  - ALL provider lines side by side in a mini table:
    Provider | Spread | O/U | Home ML | Away ML
  - Best spread highlighted (most favorable for each side)
  - Best total highlighted
  - Adjusted efficiency ratings for each team (from /ratings/adjusted)
  - Clickable → /game/[id]

=== LINE SHOPPING TAB ===
- Show ALL games with lines, grouped by date
- For each game, compare across providers:
  - Spread: show best home spread and best away spread (highlight in green)
  - O/U: show highest and lowest total
  - ML: show best home ML and best away ML
- Calculate "edge" = difference between best and worst line per game
- Sort games by biggest edge first (most shopping value)

=== ATS RECORDS TAB ===
- Compute ATS records for every team from completed games + lines:
  For each completed game with lines:
    coverMargin = (homePoints - awayPoints) + spread
    if coverMargin > 0: home team covers
    if coverMargin < 0: away team covers  
    if coverMargin === 0: push
  Track: covers, non-covers, pushes per team
- Display table: Team, Record, ATS Record (covers-losses-pushes), ATS%, 
  Cover Margin Avg, Home ATS, Away ATS
- Sortable by ATS%
- Highlight teams with ATS > 60% (profitable) in green
- Highlight teams with ATS < 40% (fading targets) in red

=== O/U TRACKER TAB ===
- For each completed game with lines:
  total = homePoints + awayPoints
  if total > overUnder: OVER
  if total < overUnder: UNDER
  if total === overUnder: PUSH
- Track over/under/push per team
- Display table: Team, Games, Overs, Unders, Pushes, Over%, Avg Total, Avg O/U Line
- Sort by Over% descending
- Highlight teams > 60% over (high-scoring trends) 

=== PROBABILITY TAB ===
- Show all upcoming games with moneylines
- For each game, calculate implied probability from moneylines:
  Negative ML: |ML| / (|ML| + 100)
  Positive ML: 100 / (ML + 100)
- Show: Teams, Home ML, Away ML, Home Implied%, Away Implied%, 
  Total Implied% (usually >100% due to vig), Vig amount
- Compare implied probability vs adjusted efficiency rank
  (if team is ranked higher but has lower implied prob = potential value)
- Flag "value bets": where efficiency ranking disagrees with line

Use lib/utils.ts functions: impliedProbability(), coverMargin(), moneyline(), sign().
All team names link to /team/[name], game rows link to /game/[id].

Styling: amber-400 accent for betting elements. Green for profitable/covers.
Red for losses/fades. Mono font for all numbers.
```

---

## Files to Create

### `app/betting/page.tsx`
Main betting tools page with 5 tabs.

### Update `components/Navbar.tsx`
Add "Betting" link with dollar icon.

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /lines?season=2025` | All betting lines for season |
| `GET /games?season=2025` | All games (for results matching) |
| `GET /ratings/adjusted?season=2025` | Efficiency ratings (for value analysis) |

---

## Derived Metrics to Compute

```typescript
// Implied probability from moneyline
function impliedProbability(ml: number): number {
  if (ml < 0) return Math.abs(ml) / (Math.abs(ml) + 100);
  return 100 / (ml + 100);
}

// Vig (overround)
function calculateVig(homeMl: number, awayMl: number): number {
  return (impliedProbability(homeMl) + impliedProbability(awayMl) - 1) * 100;
}

// ATS result
function atsResult(homePoints: number, awayPoints: number, spread: number): "home" | "away" | "push" {
  const margin = (homePoints - awayPoints) + spread;
  if (margin > 0) return "home";
  if (margin < 0) return "away";
  return "push";
}

// O/U result
function ouResult(homePoints: number, awayPoints: number, overUnder: number): "over" | "under" | "push" {
  const total = homePoints + awayPoints;
  if (total > overUnder) return "over";
  if (total < overUnder) return "under";
  return "push";
}

// Average cover margin per team
function avgCoverMargin(team: string, games: Game[], lines: BettingLine[]): number {
  // For each game where team played and line exists:
  // If home: margin = (homePoints - awayPoints) + spread
  // If away: margin = (awayPoints - homePoints) - spread
  // Average all margins
}
```

---

## Acceptance Criteria
- [ ] Betting page accessible from navbar
- [ ] Today's Lines shows all games with all provider lines
- [ ] Line Shopping highlights best spread/total/ML per game
- [ ] ATS Records computed correctly for all teams with completed games
- [ ] ATS table sortable, profitable teams highlighted green
- [ ] O/U Tracker shows over/under percentages per team
- [ ] Probability tab shows implied probability from moneylines
- [ ] Vig calculation shown
- [ ] Value bets flagged where efficiency disagrees with line
- [ ] All links to game/team pages work
- [ ] Empty states handled (no lines available, no completed games)

---
---

# Phase 7 — Advanced Visualizations

## Goal
Add three data visualizations: Shot Chart (court diagram), Win Probability Chart (line graph), and Pace vs Efficiency Scatter Plot. These use play-by-play data and Recharts.

## Depends On
Phase 0 (types, API), Phase 2 (game page to embed charts), Phase 4 (team page for scatter)

---

## Codex Prompt

```
Add three advanced visualization components to the CBB Betting Hub using Recharts.
Install recharts if not already installed.

=== COMPONENT 1: Shot Chart (components/ShotChart.tsx) ===

A visual half-court diagram that plots shot locations from play-by-play data.

Data source: GET /plays/game/{gameId}
Filter plays where shotInfo exists and shotInfo.location has x/y coordinates.

Implementation:
- Render an SVG half-court (47ft x 50ft scaled to container width)
  - Court outline (rectangle)
  - Three-point arc
  - Free throw line and lane
  - Basket circle
  - All in zinc-700 stroke, no fill
- Plot each shot as a circle at (x, y) coordinates:
  - Made shots: green (#4ade80), filled, radius 4
  - Missed shots: red (#f87171), unfilled (stroke only), radius 4
  - Opacity 0.7
- Filter controls:
  - Team filter (home / away / both)
  - Shot range filter (rim / mid-range / 3pt / all)
  - Player filter (dropdown of players who took shots)
- Legend: green circle = made, red circle = missed
- Stats summary below: total shots, FG%, by range

Props:
```typescript
interface ShotChartProps {
  plays: Play[];
  homeTeam: string;
  awayTeam: string;
}
```

Add to Game Page: new "Shots" tab between Lineups and Betting.
Fetch plays on game page: GET /plays/game/{gameId}

=== COMPONENT 2: Win Probability Chart (components/WinProbChart.tsx) ===

A Recharts line chart showing win probability over the course of a game.

Data source: GET /plays/game/{gameId}
Use the homeWinProbability field from each play.

Implementation:
- X-axis: game time
  Convert period + secondsRemaining to a continuous timeline:
  gameSeconds = ((period - 1) * 1200) + (1200 - secondsRemaining)
  (assuming 20-minute halves = 1200 seconds each)
- Y-axis: Home Win Probability (0% to 100%)
- Line chart with area fill:
  - Area above 50% filled with subtle green
  - Area below 50% filled with subtle red
  - 50% dashed reference line
- Tooltip: shows play text, score, probability on hover
- Period dividers: vertical dashed lines at half / OT boundaries
- Team labels at top-left (away) and top-right (home)

Props:
```typescript
interface WinProbChartProps {
  plays: Play[];
  homeTeam: string;
  awayTeam: string;
}
```

Add to Game Page: embed at the top of the Overview tab (or as its own "Win Prob" tab).

=== COMPONENT 3: Efficiency Scatter Plot (components/EfficiencyScatter.tsx) ===

A Recharts scatter plot showing all teams by offensive vs defensive efficiency.

Data source: GET /ratings/adjusted?season=2025

Implementation:
- X-axis: Offensive Rating (higher = better offense) 
- Y-axis: Defensive Rating (LOWER = better defense, so invert or note this)
- Each team is a dot:
  - Default: zinc-500
  - Top 25 net: amber-400
  - Selected/hovered: white with glow
- Quadrant labels:
  - Top-right: "Elite" (good offense, good defense)
  - Top-left: "Defensive" (bad offense, good defense)
  - Bottom-right: "Offensive" (good offense, bad defense)
  - Bottom-left: "Weak" (bad offense, bad defense)
  Note: because low defensive rating = good, the Y axis is inverted
- Average lines: dashed lines at average offensive and defensive rating
- Tooltip: team name, conference, Off/Def/Net rating, national rank
- Click on a dot → navigate to /team/[name]

Props:
```typescript
interface EfficiencyScatterProps {
  ratings: AdjustedRating[];
  onTeamClick: (teamName: string) => void;
}
```

Add to Rankings page as a new "Scatter" tab.

Use Recharts components: 
ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine, 
ResponsiveContainer, LineChart, Line, Area, AreaChart
```

---

## Files to Create

### `components/ShotChart.tsx`
SVG court + shot location overlay with filters.

### `components/WinProbChart.tsx`
Recharts area chart for win probability timeline.

### `components/EfficiencyScatter.tsx`
Recharts scatter plot for team efficiency.

### Update `app/game/[id]/page.tsx`
- Add play-by-play fetch: `GET /plays/game/{gameId}`
- Add "Shots" tab using ShotChart
- Add WinProbChart to Overview tab or own tab

### Update `app/rankings/page.tsx`
- Add "Scatter" tab using EfficiencyScatter

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /plays/game/{gameId}` | Play-by-play with shot locations + win probability |
| `GET /ratings/adjusted?season=2025` | Team efficiency for scatter plot |

---

## Court Dimensions Reference
The shot chart coordinates from the API use:
- x: 0 to ~94 (full court length in feet, but likely 0-47 for half court)
- y: 0 to ~50 (court width)

Scale to SVG viewBox. You may need to experiment with coordinate mapping based on actual API data. Start with viewBox="0 0 470 500" (10x scale).

---

## Acceptance Criteria
- [ ] Shot chart renders court lines correctly
- [ ] Shots plotted at correct locations, color-coded made/missed
- [ ] Shot chart filters work (team, range, player)
- [ ] Win probability chart shows smooth line across game timeline
- [ ] Period dividers and 50% reference line visible
- [ ] Tooltip shows play details on hover
- [ ] Efficiency scatter shows all teams with correct quadrant labels
- [ ] Average reference lines drawn
- [ ] Top 25 teams highlighted in amber
- [ ] Clicking team dots navigates to team page
- [ ] All charts responsive (work on mobile)

---
---

# Phase 8 — Polish, Extras & Deployment

## Goal
Final polish pass: add play-by-play feed, substitution data, team lineup seasons, conference browser, loading skeletons, error boundaries, SEO, and deploy.

## Depends On
All previous phases (0–7)

---

## Codex Prompt

```
Final polish pass for the CBB Betting Hub. Add these features and improvements:

=== 1. PLAY-BY-PLAY FEED (Game Page) ===
Add a "Plays" tab to the game detail page.

Fetch: GET /plays/game/{gameId}

Display:
- Scrollable feed of all plays, grouped by period
- Each play row shows: clock, team, play text, score (home-away)
- Scoring plays highlighted with amber left border
- Shooting plays show shot info (range, made/missed)
- Win probability shown as tiny inline bar
- Filter controls: All / Scoring Only / by team
- Play type badges (Shot, Rebound, Turnover, Foul, etc.)

=== 2. SUBSTITUTION TRACKER (Game Page) ===
Fetch: GET /substitutions/game/{gameId}

Add to the Lineups tab:
- Player stint tracker showing when each player was on the court
- For each player: sub-in time, sub-out time, period, plus/minus during stint
  (teamPoints gained minus opponentPoints gained during stint)
- Visual timeline bars showing stints

=== 3. TEAM SEASON LINEUPS (Team Page) ===
Add a "Lineups" tab to the team detail page.

Fetch: GET /lineups/team?season=2025&team={name}

Display:
- Same LineupCard component from game page
- Sort by totalSeconds descending
- Show top 20 lineup combinations
- Highlight the starting lineup (most minutes)

=== 4. TEAM PLAYER STATS (Team Page) ===  
Add a "Players" tab to the team detail page.

Fetch: GET /stats/player/season?season=2025&team={name}

Display:
- Table of all players with season stats
- Columns: Name, Pos, G, GS, MPG, PPG, RPG, APG, FG%, 3PT%, FT%, 
  Usage, eFG%, TS%, Net Rating, PORPAG, Win Shares
- Sortable columns
- Player names clickable → /player/[id]

=== 5. CONFERENCE BROWSER ===
Add app/conferences/page.tsx

Fetch: GET /conferences → list of all conferences

Display:
- Grid of conference cards
- Click a conference → show all teams in that conference
  (fetch /teams?conference={name})
- Click a team → /team/[name]

=== 6. PLAYER PLAYS PAGE ===
On the player detail page, add a "Plays" tab.

Fetch: GET /plays/player/{playerId}?season=2025

Display:
- All plays involving this player
- Same feed format as game play-by-play
- Shot chart overlay using this player's shot data only
- Group by game (with game date + opponent headers)

=== 7. LOADING SKELETONS ===
Replace the Loader spinner with skeleton screens on all pages:
- Dashboard: skeleton game cards (pulsing zinc-800 rectangles)
- Game page: skeleton header + tab content
- Player/Team pages: skeleton bio + stat grids

Use Tailwind animate-pulse on zinc-800 backgrounds.

=== 8. ERROR BOUNDARIES ===
Add error handling:
- Create components/ErrorBoundary.tsx (React error boundary)
- Wrap each page section in error boundaries
- Show friendly "Something went wrong" with retry button
- Log errors to console

=== 9. SEO & METADATA ===
Add metadata to each page:
- Dashboard: "CBB Betting Hub — College Basketball Betting Tool"
- Game: "{Away} vs {Home} — Game Analysis"
- Player: "{Name} — Player Stats & Props"
- Team: "{Team} — Team Analysis"

=== 10. MOBILE RESPONSIVENESS ===
Ensure all pages work on mobile:
- Game cards stack vertically, betting line moves below
- Tables get horizontal scroll on mobile
- Tab bars scroll horizontally if needed
- Nav collapses to icons only on small screens

=== 11. DEPLOYMENT ===
- Create vercel.json if needed
- Set up environment variable NEXT_PUBLIC_CBB_API_KEY
- Build and deploy: npm run build && npx vercel --prod
```

---

## Files to Create/Modify

### New Files
- `app/conferences/page.tsx` — Conference browser
- `components/PlayByPlayFeed.tsx` — Play-by-play feed component
- `components/SubstitutionTracker.tsx` — Player stint tracker
- `components/SkeletonCard.tsx` — Skeleton loading card
- `components/SkeletonTable.tsx` — Skeleton loading table
- `components/ErrorBoundary.tsx` — React error boundary

### Modified Files
- `app/game/[id]/page.tsx` — Add Plays tab, substitution data
- `app/player/[id]/page.tsx` — Add Plays tab
- `app/team/[name]/page.tsx` — Add Lineups tab, Players tab
- `components/Navbar.tsx` — Add Conferences link, mobile responsive

---

## API Endpoints Used (New in This Phase)

| Endpoint | Purpose |
|----------|---------|
| `GET /plays/game/{gameId}` | Full play-by-play feed |
| `GET /substitutions/game/{gameId}` | Player substitution stints |
| `GET /lineups/team?season=2025&team={name}` | Season lineup combinations |
| `GET /stats/player/season?season=2025&team={name}` | All player stats for a team |
| `GET /conferences` | List of all conferences |
| `GET /teams?conference={name}` | Teams in a conference |
| `GET /plays/player/{id}?season=2025` | All plays for a player |

---

## Deployment Checklist
- [ ] All pages load without errors
- [ ] API key stored in environment variable (not hardcoded)
- [ ] `npm run build` completes without errors
- [ ] All links/navigation work
- [ ] Mobile responsive on all pages
- [ ] Loading skeletons show on all pages
- [ ] Error boundaries catch and display errors gracefully
- [ ] SEO metadata on every page
- [ ] Deploy to Vercel with `npx vercel --prod`
- [ ] Verify production build works with API

---

## Final Page/Tab Summary

| Page | Tabs |
|------|------|
| Dashboard (`/`) | Today / Recent toggle |
| Game (`/game/[id]`) | Overview, Box Score, Lineups, Shots, Plays, Betting |
| Player (`/player/[id]`) | Season, Game Log, Shooting, Plays |
| Team (`/team/[name]`) | Overview, Roster, Schedule, Lineups, Shooting, Players |
| Search (`/search`) | — |
| Rankings (`/rankings`) | AP Poll, Efficiency, ELO, Scatter |
| Betting (`/betting`) | Today's Lines, Line Shopping, ATS Records, O/U Tracker, Probability |
| Conferences (`/conferences`) | — |
