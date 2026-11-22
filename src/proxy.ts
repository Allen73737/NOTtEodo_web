import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { THEME_SCRIPT_HASH } from "@/lib/theme-script-hash";

/**
 * Runs before every page (Next 16 "proxy", formerly middleware):
 *  - security headers on every response;
 *  - a strict nonce-based CSP on signed-in areas (/account, /admin, /auth), where a stolen
 *    session matters most. Static marketing pages are prerendered and can't carry a per-request
 *    nonce, so they get a CSP without inline-script hashes (still no eval, no third-party scripts);
 *  - refreshes the Supabase session cookie on signed-in areas and sends signed-out visitors
 *    of /admin and /account to sign in. Admin rights are re-checked server-side on every
 *    request in the admin layout and in every server action (and enforced by RLS).
 */
const SECURE = /^\/(account|admin|auth)(\/|$)/;

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const secure = SECURE.test(url.pathname);
  const nonce = secure ? btoa(crypto.randomUUID()) : null;
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseWs = supabase.replace(/^https/, "wss");
  const dev = process.env.NODE_ENV !== "production";

  const csp = [
    "default-src 'self'",
    nonce
      ? `script-src 'self' 'nonce-${nonce}' '${THEME_SCRIPT_HASH}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`
      : `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabase}`,
    "font-src 'self'",
    `connect-src 'self' ${supabase} ${supabaseWs} https://api.pwnedpasswords.com`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const reqHeaders = new Headers(req.headers);
  if (nonce) {
    reqHeaders.set("x-nonce", nonce);
    reqHeaders.set("content-security-policy", csp);
  }
  let res = NextResponse.next({ request: { headers: reqHeaders } });

  if (secure && supabase && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const sb = createServerClient(supabase, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: { headers: reqHeaders } });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await sb.auth.getUser();
    const needsUser = /^\/(account|admin)(\/|$)/.test(url.pathname);
    if (needsUser && !data.user) {
      const to = url.clone();
      to.pathname = "/auth/sign-in";
      to.search = `?next=${encodeURIComponent(url.pathname + url.search)}`;
      res = NextResponse.redirect(to);
    }
  }

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=(), gyroscope=(self), accelerometer=(self)",
  );
  if (secure) res.headers.set("Cache-Control", "private, no-store");
  if (url.pathname.startsWith("/admin")) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|screenshots|posters|fonts|.*\\.(?:png|webp|avif|svg|ico|txt|xml|json|webmanifest)$).*)"],
};
