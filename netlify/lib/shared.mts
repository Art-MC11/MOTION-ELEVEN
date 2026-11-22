// Outils partagés par les fonctions Netlify (exécutés côté serveur uniquement).

export const env = (k: string) => Netlify.env.get(k) ?? "";

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

export const clean = (v: unknown, max = 500): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const OFFERS = {
  starter: { name: "Starter", setup: 590, monthly: 39 },
  business: { name: "Business", setup: 990, monthly: 59 },
  ecommerce: { name: "E-commerce", setup: 1490, monthly: 79 },
} as const;
export type OfferKey = keyof typeof OFFERS;

export const siteUrl = () => env("URL") || "https://motion-eleven.fr";

// ---------- E-mail (Resend) ----------
export const resendReady = () => Boolean(env("RESEND_API_KEY") && env("RESEND_FROM"));

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string; replyTo?: string; headers?: Record<string, string> }) {
  if (!env("RESEND_API_KEY")) return { ok: false, error: "Resend non configuré" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("RESEND_FROM") || "Motion Eleven <onboarding@resend.dev>",
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.text ? { text: opts.text } : {}),
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      ...(opts.headers ? { headers: opts.headers } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Resend", res.status, err);
    return { ok: false, error: `Resend ${res.status}` };
  }
  return { ok: true };
}

export const notifyTo = () => env("LEAD_NOTIFY_EMAIL") || "cohenmeir91@gmail.com";

export function leadEmailHtml(title: string, rows: [string, string][]) {
  const body = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;color:#5a6378;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:8px 12px;color:#0c1530">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;max-width:640px"><h2 style="color:#0c1530">${escapeHtml(title)}</h2><table style="border-collapse:collapse;width:100%;border:1px solid #d6dbe5">${body}</table><p style="color:#5a6378;font-size:13px">Gérer ce contact : ${siteUrl()}/admin/</p></div>`;
}
