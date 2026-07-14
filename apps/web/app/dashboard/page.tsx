import Link from "next/link";
import { features } from "@/lib/features";

export default function DashboardPage() {
  return (
    <main className="container" style={{ padding: "34px 0 56px" }}>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 4.8rem)", margin: 0 }}>City readiness workspace</h1>
      <p style={{ color: "var(--muted)", maxWidth: 780 }}>Readiness is calculated from your completed tasks and saved preferences, not from fabricated city statistics.</p>
      <section className="grid cols-3" style={{ margin: "22px 0" }}>
        <div className="panel" style={{ padding: 18 }}><strong>Readiness score</strong><p style={{ fontSize: 42, margin: "12px 0" }}>0%</p><p style={{ color: "var(--muted)" }}>Complete onboarding to begin.</p></div>
        <div className="panel" style={{ padding: 18 }}><strong>Evidence mode</strong><p style={{ color: "var(--muted)" }}>Available on live and agent-backed modules.</p></div>
        <div className="panel" style={{ padding: 18 }}><strong>Freshness monitor</strong><p style={{ color: "var(--muted)" }}>Live, recent, stale, and user-submitted labels are tracked per source.</p></div>
      </section>
      <section className="grid cols-3">
        {features.filter((feature) => feature.slug !== "dashboard").map((feature) => (
          <Link className="panel" href={`/${feature.slug}`} key={feature.slug} style={{ padding: 16 }}>
            <strong>{feature.title}</strong>
            <p style={{ color: "var(--muted)" }}>{feature.status}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
