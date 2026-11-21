// Outils partagés par les fonctions Netlify (exécutés côté serveur uniquement).

export const env = (k: string) => Netlify.env.get(k) ?? "";

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export const clean = (v: unknown, max = 500): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, (c) => (c === "\n" ? "\n" : " ")).trim().slice(0, max) : "";

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const OFFERS = {
  starter: { name: "Starter", setup: 590, monthly: 39 },
  business: { name: "Business", setup: 990, monthly: 59 },
  ecommerce: { name: "E-commerce", setup: 1490, monthly: 79 },
} as const;
export type OfferKey = keyof typeof OFFERS;

// ---------- Supabase (REST, clé service uniquement côté serveur) ----------
export const supabaseReady = () => Boolean(env("SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY"));

export async function supabase(path: string, init: RequestInit = {}) {
  const url = `${env("SUPABASE_URL").replace(/\/$/, "")}/rest/v1/${path}`;
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return fetch(url, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

// ---------- E-mail (Resend) ----------
export const resendReady = () => Boolean(env("RESEND_API_KEY"));

export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  if (!resendReady()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("RESEND_FROM") || "Motion Eleven <onboarding@resend.dev>",
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });
  if (!res.ok) console.error("Resend", res.status, await res.text());
  return res.ok;
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
  return `<div style="font-family:Arial,sans-serif;max-width:640px"><h2 style="color:#0c1530">${escapeHtml(title)}</h2><table style="border-collapse:collapse;width:100%;border:1px solid #d6dbe5">${body}</table><p style="color:#5a6378;font-size:13px">Motion Eleven — tableau de bord : /admin/</p></div>`;
}

// ---------- Comparaison à temps constant ----------
export async function safeEqual(a: string, b: string) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0 && a.length > 0 && b.length > 0;
}
