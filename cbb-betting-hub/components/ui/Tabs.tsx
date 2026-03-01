import clsx from "clsx";

interface TabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={clsx(
            "rounded-md border px-3 py-1.5 text-sm transition",
            active === tab
              ? "border-amber-400 bg-amber-400/20 text-amber-300"
              : "border-white/5 bg-zinc-900/80 text-zinc-300 hover:border-white/20"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
