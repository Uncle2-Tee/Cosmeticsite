"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin({ configured }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error || "Unable to sign in."); return; }
      router.refresh();
    } catch { setError("Unable to reach the secure sign-in service."); }
    finally { setSubmitting(false); }
  }

  return <main className="atelier-shell"><section className="login-card"><Link href="/" className="atelier-brand brand-mark"><span className="brand-word">Doresther</span><span className="brand-tradings">Tradings</span></Link><p className="atelier-kicker">Private workspace</p><h1>Store admin</h1>{configured ? <><p className="atelier-intro">Sign in to manage the Doresther Tradings product collection.</p><form onSubmit={submit}><label htmlFor="admin-password">Password</label><input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" autoFocus />{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in securely"}<span>→</span></button></form></> : <><p className="atelier-intro">Secure admin access is not configured yet.</p><div className="setup-note"><strong>Before publishing</strong><p>Add <code>ADMIN_PASSWORD</code> and a random 32+ character <code>ADMIN_SESSION_SECRET</code> to your deployment environment, then return here.</p></div></>}<Link className="return-link" href="/">← Return to storefront</Link></section></main>;
}
