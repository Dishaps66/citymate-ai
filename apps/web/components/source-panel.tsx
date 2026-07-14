import type { ApiResponse } from "@/types/api";

export function SourcePanel<T>({ response }: { response?: ApiResponse<T> }) {
  if (!response) {
    return (
      <section className="panel" style={{ padding: 18 }}>
        <h2>Evidence mode</h2>
        <p style={{ color: "var(--muted)" }}>Run a query to inspect source URLs, freshness, retrieved timestamps, warnings, and unavailable fields.</p>
      </section>
    );
  }

  return (
    <section className="panel" style={{ padding: 18 }}>
      <h2>Evidence mode</h2>
      <p style={{ color: "var(--muted)" }}>Request ID: {response.request_id}</p>
      {response.sources.length === 0 ? <p>No source returned yet.</p> : null}
      <div className="grid">
        {response.sources.map((source) => (
          <a key={`${source.name}-${source.retrieved_at}`} className="panel" href={source.url} target="_blank" rel="noreferrer" style={{ padding: 14 }}>
            <strong>{source.name}</strong>
            <p style={{ color: "var(--muted)" }}>{source.data_type} · {source.freshness} · {source.verification_status}</p>
            <small>{new Date(source.retrieved_at).toLocaleString()}</small>
          </a>
        ))}
      </div>
      {response.warnings.length ? <p style={{ color: "var(--accent-2)" }}>{response.warnings.join(" ")}</p> : null}
    </section>
  );
}
