export function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(d: string | null): string {
  if (!d) return "TBD";
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatTimeWithZone(d: string | null): string {
  if (!d) return "TBD";
  const dt = new Date(d);
  const formatInZone = (timeZone: string) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).format(dt);

  return `${formatInZone("America/New_York")} ET / ${formatInZone("America/Chicago")} CT / ${formatInZone("America/Los_Angeles")} PT`;
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
