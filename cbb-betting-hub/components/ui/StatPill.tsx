import clsx from "clsx";

interface StatPillProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export function StatPill({ label, value, accent = false }: StatPillProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border px-3 py-2",
        accent
          ? "border-amber-400/40 bg-amber-400/10"
          : "border-white/5 bg-zinc-900/80"
      )}
    >
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="font-mono text-lg text-zinc-100">{value}</p>
    </div>
  );
}
