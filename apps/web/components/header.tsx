import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
        <ShieldCheck size={24} color="var(--accent)" />
        CityMate AI
      </Link>
      <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }} aria-label="Primary">
        <Link className="btn" href="/dashboard">Dashboard</Link>
        <Link className="btn" href="/concierge">Concierge</Link>
        <Link className="btn primary" href="/signin">Sign in</Link>
      </nav>
    </header>
  );
}
