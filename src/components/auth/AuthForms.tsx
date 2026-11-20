"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { breachCount, evaluatePassword } from "@/lib/password-policy";
import { supabaseBrowser } from "@/lib/supabase/client";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

function NotConfigured() {
  return (
    <p className="callout" role="status">
      Sign-in isn&rsquo;t connected on this copy of the site yet. You can still use NOTtEodo fully without an account.
    </p>
  );
}

function ErrorText({ msg }: { msg: string | null }) {
  return msg ? (
    <p role="alert" style={{ color: "var(--c-error)", margin: 0 }}>
      {msg}
    </p>
  ) : null;
}

function GoogleButton({ next }: { next: string }) {
  const sb = supabaseBrowser();
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() =>
        sb?.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        })
      }
    >
      Continue with Google
    </button>
  );
}

export function SignInForm() {
  const sb = supabaseBrowser();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState<{ factorId: string } | null>(null);
  if (!sb) return <NotConfigured />;

  async function afterPassword() {
    // Accounts with two-step verification need an AAL2 session (the app's RLS requires it).
    const { data } = await sb!.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data && data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
      const { data: f } = await sb!.auth.mfa.listFactors();
      const totp = f?.totp?.[0];
      if (totp) return setMfa({ factorId: totp.id });
    }
    router.replace(next);
    router.refresh();
  }

  if (mfa) {
    return (
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s/g, "");
          const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: mfa.factorId, code });
          setBusy(false);
          if (error) return setErr("That code didn't work. Try the newest code from your authenticator app.");
          router.replace(next);
          router.refresh();
        }}
      >
        <label className="field">
          Code from your authenticator app
          <input className="input t-num" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required autoFocus />
        </label>
        <ErrorText msg={err} />
        <button className="btn" disabled={busy}>
          {busy ? "Checking" : "Verify"}
        </button>
      </form>
    );
  }

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setErr(null);
        const { error } = await sb.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
        setBusy(false);
        if (error) return setErr(error.message.includes("Invalid") ? "That email and password don't match." : error.message);
        await afterPassword();
      }}
    >
      <label className="field">
        Email
        <input className="input" type="email" name="email" autoComplete="email" required />
      </label>
      <label className="field">
        Password
        <input className="input" type="password" name="password" autoComplete="current-password" required />
      </label>
      <ErrorText msg={err} />
      <button className="btn" disabled={busy}>
        {busy ? "Signing in" : "Sign in"}
      </button>
      <GoogleButton next={next} />
      <p className="t-label" style={{ margin: 0 }}>
        <Link href="/auth/reset">Forgot password</Link> · <Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </form>
  );
}

function PasswordField({ email, onChange }: { email: string; onChange: (v: string) => void }) {
  const [pw, setPw] = useState("");
  const check = useMemo(() => evaluatePassword(pw, email), [pw, email]);
  return (
    <label className="field">
      Password
      <input
        className="input"
        type="password"
        name="password"
        autoComplete="new-password"
        minLength={10}
        required
        value={pw}
        onChange={(e) => {
          setPw(e.target.value);
          onChange(e.target.value);
        }}
        aria-describedby="pw-help"
      />
      <span id="pw-help" className="pw-meter" data-score={pw ? check.score : -1}>
        <span className="pw-meter__bar" />
        <span>{pw ? (check.problem ?? check.label) : "At least 10 characters. A short phrase works well."}</span>
      </span>
    </label>
  );
}

async function passwordProblem(pw: string, email: string) {
  const local = evaluatePassword(pw, email);
  if (local.problem) return local.problem;
  const n = await breachCount(pw);
  if (n && n > 0) return `This password has appeared in ${n.toLocaleString("en-IN")} data breaches. Choose another.`;
  return null;
}

export function SignUpForm() {
  const sb = supabaseBrowser();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  if (!sb) return <NotConfigured />;
  if (sent)
    return (
      <p className="callout" role="status">
        Check your email to confirm your address, then sign in here or in the app with the same details.
      </p>
    );
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (!fd.get("age")) return setErr("Please confirm the age statement to create an account.");
        setBusy(true);
        setErr(null);
        const problem = await passwordProblem(pw, email);
        if (problem) {
          setBusy(false);
          return setErr(problem);
        }
        const { error } = await sb.auth.signUp({
          email,
          password: pw,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            data: { age_confirmed_at: new Date().toISOString(), age_basis: String(fd.get("age")), signup_source: "web" },
          },
        });
        setBusy(false);
        if (error) return setErr(error.message);
        setSent(true);
      }}
    >
      <label className="field">
        Email
        <input className="input" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <PasswordField email={email} onChange={setPw} />
      <fieldset className="stack age">
        <legend className="t-label">Age</legend>
        <label className="check">
          <input type="radio" name="age" value="adult" /> I am 18 or older.
        </label>
        <label className="check">
          <input type="radio" name="age" value="guardian" /> I am under 18 and my parent or guardian has agreed to this account.
        </label>
        <p className="t-label" style={{ margin: 0 }}>
          Without an account, NOTtEodo works fully on your phone at any age.
        </p>
      </fieldset>
      <ErrorText msg={err} />
      <button className="btn" disabled={busy}>
        {busy ? "Creating" : "Create account"}
      </button>
      <GoogleButton next={next} />
      <p className="t-label" style={{ margin: 0 }}>
        By creating an account you accept the <Link href="/terms">terms</Link> and <Link href="/privacy">privacy policy</Link>.
        Already have one? <Link href="/auth/sign-in">Sign in</Link>
      </p>
    </form>
  );
}

export function ResetForm() {
  const sb = supabaseBrowser();
  const [sent, setSent] = useState(false);
  if (!sb) return <NotConfigured />;
  return sent ? (
    <p className="callout" role="status">
      If that address has an account, a reset link is on its way.
    </p>
  ) : (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email"));
        await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/auth/update-password` });
        setSent(true);
      }}
    >
      <label className="field">
        Email
        <input className="input" type="email" name="email" autoComplete="email" required />
      </label>
      <button className="btn">Send reset link</button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const sb = supabaseBrowser();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!sb) return <NotConfigured />;
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { data } = await sb.auth.getUser();
        const problem = await passwordProblem(pw, data.user?.email ?? "");
        if (problem) {
          setBusy(false);
          return setErr(problem);
        }
        const { error } = await sb.auth.updateUser({ password: pw });
        setBusy(false);
        if (error) return setErr(error.message);
        router.replace("/account?password=updated");
      }}
    >
      <PasswordField email="" onChange={setPw} />
      <ErrorText msg={err} />
      <button className="btn" disabled={busy}>
        Save new password
      </button>
    </form>
  );
}
