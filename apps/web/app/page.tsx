import Link from "next/link";
import { features } from "@/lib/features";

export default function HomePage() {
  const primary = features.filter((feature) => ["concierge", "travel-planner", "pg-finder", "budget-planner", "emergency", "transparency"].includes(feature.slug));
  return (
    <main className="container" style={{ padding: "48px 0 72px" }}>
      <section style={{ minHeight: "62vh", display: "grid", alignContent: "center", gap: 24 }}>
        <p style={{ color: "var(--accent)", fontWeight: 800 }}>Evidence-first city intelligence</p>
        <h1 style={{ fontSize: "clamp(2.7rem, 8vw, 7.4rem)", lineHeight: 0.92, margin: 0, maxWidth: 980 }}>CITYMATE AI</h1>
        <p style={{ color: "var(--muted)", fontSize: 20, maxWidth: 780 }}>
          An intelligent multi-agent platform for city travel, relocation, verified accommodation, budgeting, emergency support, and transparent urban decision-making.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn primary" href="/dashboard">Open dashboard</Link>
          <Link className="btn" href="/transparency">View data sources</Link>
        </div>
      </section>

      <section className="grid cols-3" aria-label="Core modules">
        {primary.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link className="panel" href={`/${feature.slug}`} key={feature.slug} style={{ padding: 18, minHeight: 190 }}>
              <Icon color="var(--accent)" />
              <h2>{feature.title}</h2>
              <p style={{ color: "var(--muted)" }}>{feature.description}</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
