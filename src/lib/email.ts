import "server-only";
import { serverEnv } from "@/lib/env.server";

/** Sends an email through Resend's HTTP API. Returns false when email isn't configured. */
export async function sendEmail(o: { to: string; subject: string; html: string; text: string; unsubscribeUrl?: string }) {
  if (!serverEnv.RESEND_API_KEY) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${serverEnv.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: serverEnv.RESEND_FROM,
      to: [o.to],
      subject: o.subject,
      html: o.html,
      text: o.text,
      headers: o.unsubscribeUrl
        ? { "List-Unsubscribe": `<${o.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
        : undefined,
    }),
  });
  if (!res.ok) console.error(JSON.stringify({ level: "error", msg: "resend failed", status: res.status }));
  return res.ok;
}

/** Plain, branded email body. Inline styles only, because email clients ignore stylesheets. */
export function emailHtml(title: string, body: string, cta?: { label: string; url: string }, footer = "") {
  return `<!doctype html><html><body style="margin:0;background:#F7F3EE;font-family:Georgia,serif;color:#1D1C15">
<div style="max-width:520px;margin:0 auto;padding:40px 28px">
<p style="font-size:26px;margin:0 0 28px">NOT<i style="color:#7A1F2B">te</i>odo</p>
<h1 style="font-size:28px;font-weight:normal;line-height:1.2;margin:0 0 16px">${title}</h1>
<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#424849">${body}</div>
${cta ? `<p style="margin:28px 0"><a href="${cta.url}" style="background:#7A1F2B;color:#FFFFFF;text-decoration:none;padding:14px 22px;border-radius:999px;font-family:Arial,sans-serif;font-size:15px">${cta.label}</a></p>` : ""}
<p style="font-family:Arial,sans-serif;font-size:12px;color:#6B605A;margin-top:36px">${footer}</p>
</div></body></html>`;
}

/** Builds the release announcement email for confirmed subscribers (sent from the admin portal). */
export function releaseEmail(o: { version: string; notes: string; url: string; unsubscribeUrl: string; playLive: boolean }) {
  const title = o.playLive ? "NOTtEodo is on Google Play." : `NOTtEodo ${o.version} is here.`;
  return {
    subject: title,
    text: `${title}\n\n${o.notes}\n\n${o.url}\n\nUnsubscribe: ${o.unsubscribeUrl}`,
    html: emailHtml(title, `<p>${o.notes.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`, { label: "Get it", url: o.url }, `<a href="${o.unsubscribeUrl}" style="color:#6B605A">Unsubscribe</a>`),
  };
}
