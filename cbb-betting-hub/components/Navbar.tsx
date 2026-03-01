import Link from "next/link";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/players", label: "Players" },
  { href: "/rankings", label: "Rankings" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-heading text-xl text-amber-400">
          CBB Betting Hub
        </Link>
        <div className="flex items-center gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-zinc-300 transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
