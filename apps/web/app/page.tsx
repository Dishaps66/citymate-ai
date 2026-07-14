"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { features } from "@/lib/features";

const cities = ["Bengaluru", "Hyderabad", "Chennai", "Pune", "Mumbai", "Delhi", "Mysuru"];
const languages = ["English", "Hindi", "Kannada", "Telugu", "Tamil"];

export default function HomePage() {
  const [city, setCity] = useState("Bengaluru");
  const [language, setLanguage] = useState("English");
  const primary = features.filter((feature) => ["travel-planner", "pg-finder", "budget-planner", "emergency", "weather-air", "transparency"].includes(feature.slug));

  return (
    <main>
      <section className="hero-shell">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Evidence-first city intelligence</p>
            <h1 className="hero-title">CITYMATE AI</h1>
            <p className="hero-copy">
              Choose a city, language, budget, route, stay preference, and emergency context. CityMate then shows source-backed analysis, map previews, unavailable fields, and no invented PGs, bus numbers, rents, ratings, or contacts.
            </p>
            <div className="hero-search">
              <label>
                <Search size={18} />
                <select value={city} onChange={(event) => setCity(event.target.value)}>
                  {cities.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                {languages.map((item) => <option key={item}>{item}</option>)}
              </select>
              <Link className="btn primary" href={`/relocation-planner?city=${encodeURIComponent(city)}&language=${encodeURIComponent(language)}`}>Plan move</Link>
              <Link className="btn" href={`/travel-planner?city=${encodeURIComponent(city)}&language=${encodeURIComponent(language)}`}>Plan route</Link>
            </div>
            <div className="trust-row">
              {["Live source labels", "Map preview", "Selection analysis", "No demo facts"].map((item) => (
                <span key={item}><CheckCircle2 size={16} /> {item}</span>
              ))}
            </div>
          </div>
          <aside className="hero-preview panel">
            <p className="eyebrow">Selected city preview</p>
            <h2>{city} starter analysis</h2>
            {[
              "Route source and destination are geocoded before distance is shown.",
              "PG and flat results require verified owner submissions.",
              "Emergency results are restricted to hospitals, police, fire, and pharmacies.",
              "Evidence mode shows source URLs, timestamps, warnings, and request IDs."
            ].map((item, index) => (
              <div className="preview-step" key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section className="container" style={{ padding: "42px 0 18px" }}>
        <div className="grid cols-3" aria-label="Core modules">
          {primary.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link className="panel module-card" href={`/${feature.slug}`} key={feature.slug}>
                <Icon color="var(--accent)" />
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
                <span>Open analysis <ArrowRight size={15} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container" style={{ padding: "24px 0 72px" }}>
        <div className="analysis-band">
          {[
            ["1", "Select city, language, budget, stay, route, and category options."],
            ["2", "CityMate calls live/provider-backed endpoints or transparent formulas."],
            ["3", "Readable cards explain verified results, unavailable fields, and sources."]
          ].map(([step, text]) => (
            <article className="result-card" key={step}>
              <strong>Step {step}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
