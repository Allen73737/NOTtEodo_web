/**
 * 1:1 port of the app's password_policy.dart: NIST SP 800-63B style. Favour length, block
 * known-bad passwords, no arbitrary composition rules. Keep in step with the app.
 */
export type PasswordCheck = { score: 0 | 1 | 2 | 3 | 4; label: string; problem: string | null };

export const MIN_LENGTH = 10;

// A short blocklist of the most common passwords and keyboard walks; the breach check catches the long tail.
const COMMON = new Set([
  "password", "password1", "password123", "123456789", "1234567890", "qwertyuiop", "qwerty123",
  "iloveyou", "sunshine", "princess", "football", "baseball", "welcome1", "letmein123", "admin123",
  "abc123456", "passw0rd", "p@ssw0rd", "trustno1", "dragon123", "monkey123", "master123",
  "superman", "starwars", "whatever", "asdfghjkl", "zxcvbnm123", "1q2w3e4r5t", "qazwsxedc",
  "notteodo", "notteodo123", "changeme", "secret123", "computer", "internet", "11111111111",
]);

const LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;

function isSequence(s: string) {
  const runs = ["0123456789", "abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm"];
  return runs.some((r) => r.includes(s) || [...r].reverse().join("").includes(s));
}

/** Rough character-pool entropy, discounted for repeated characters. */
function entropyBits(pw: string) {
  if (!pw) return 0;
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  const unique = new Set(pw).size;
  const effective = (pw.length + unique) / 2;
  return effective * (pool === 0 ? 0 : Math.log2(pool));
}

export function evaluatePassword(password: string, email?: string): PasswordCheck {
  const pw = password.trim();
  const lower = pw.toLowerCase();
  const local = email?.split("@")[0]?.toLowerCase() ?? "";
  let problem: string | null = null;
  if (pw.length < MIN_LENGTH) problem = `Use at least ${MIN_LENGTH} characters. A short phrase works well.`;
  else if (COMMON.has(lower) || /^(.)\1+$/.test(pw) || isSequence(lower)) problem = "This password is too common or predictable.";
  else if (local.length >= 3 && lower.includes(local)) problem = "Don't include your email name in the password.";

  const bits = entropyBits(pw);
  const score = (problem !== null ? (pw.length >= 6 ? 1 : 0) : bits >= 80 ? 4 : bits >= 60 ? 3 : bits >= 45 ? 2 : 1) as PasswordCheck["score"];
  if (problem === null && score < 2) problem = "Make it longer or mix in words, numbers or symbols.";
  return { score, label: LABELS[score], problem };
}

/**
 * How many times the password appears in known breaches, via Have I Been Pwned's k-anonymity
 * range API: only the first 5 hex characters of its SHA-1 leave the browser, and responses are
 * padded. Returns null if the service is unreachable.
 */
export async function breachCount(password: string, fetchImpl: typeof fetch = fetch): Promise<number | null> {
  try {
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetchImpl(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { "Add-Padding": "true" }, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    for (const line of (await res.text()).split(/\r?\n/)) {
      const [s, n] = line.split(":");
      if (s?.trim() === suffix) return Number.parseInt(n ?? "0", 10) || 0;
    }
    return 0;
  } catch {
    return null;
  }
}
