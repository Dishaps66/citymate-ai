"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email.trim()) return "Email is required";
    if (!password) return "Password is required";
    if (mode === "signup" && password.length < 8) return "Password must be at least 8 characters";
    return undefined;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setMessage(undefined);
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (mode === "signin") {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        if (data.session) router.replace("/dashboard");
        else setError("Sign in did not return a session.");
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } });
        if (authError) throw authError;
        if (data.session) router.replace("/profile");
        else setMessage("Check your email to confirm your account before signing in.");
      }
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError(undefined);
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Google sign-in failed");
    }
  }

  return (
    <main className="container" style={{ padding: "42px 0" }}>
      <form className="panel" noValidate onSubmit={submit} style={{ maxWidth: 460, margin: "0 auto", padding: 22, display: "grid", gap: 14 }}>
        <h1>{mode === "signin" ? "Sign in" : "Create account"}</h1>
        {mode === "signup" ? <input className="input" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} /> : null}
        <input className="input" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        {message ? <p style={{ color: "var(--accent)" }}>{message}</p> : null}
        <button className="btn primary" type="submit" disabled={loading}>{loading ? "Working" : mode === "signin" ? "Sign in" : "Sign up"}</button>
        <button className="btn" type="button" onClick={google}>Continue with Google</button>
        <p style={{ color: "var(--muted)" }}>
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <Link href={mode === "signin" ? "/signup" : "/signin"}>{mode === "signin" ? "Create an account" : "Sign in"}</Link>
        </p>
      </form>
    </main>
  );
}
