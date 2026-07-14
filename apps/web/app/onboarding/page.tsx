import Link from "next/link";

export default function OnboardingPage() {
  return (
    <main className="container" style={{ padding: "34px 0 56px" }}>
      <section className="panel" style={{ padding: 22, maxWidth: 760 }}>
        <h1>Onboarding</h1>
        <p style={{ color: "var(--muted)" }}>Capture city, budget, workplace or college, accessibility needs, safety preferences, dietary choices, and saved plan intent. Store these fields in Supabase per user before enabling personalized recommendations.</p>
        <Link className="btn primary" href="/profile">Continue to profile</Link>
      </section>
    </main>
  );
}
