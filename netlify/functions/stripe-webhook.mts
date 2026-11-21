import type { Config } from "@netlify/functions";
import { OFFERS, type OfferKey, env, json, supabase, supabaseReady, sendEmail, notifyTo, leadEmailHtml } from "../lib/shared.mts";

// Webhook Stripe : enregistre chaque acompte payé dans le CRM et prévient par e-mail.
// Dans Stripe > Développeurs > Webhooks : URL https://motion-eleven.fr/api/stripe-webhook,
// évènement checkout.session.completed, puis copiez le secret dans STRIPE_WEBHOOK_SECRET.

async function verify(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t;
  const signatures = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // 5 min de tolérance
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return signatures.some((s) => {
    if (s.length !== expected.length) return false;
    let d = 0;
    for (let i = 0; i < s.length; i++) d |= s.charCodeAt(i) ^ expected.charCodeAt(i);
    return d === 0;
  });
}

export default async (req: Request) => {
  const secret = env("STRIPE_WEBHOOK_SECRET");
  if (!secret) return json({ error: "Webhook non configuré" }, 503);
  const payload = await req.text();
  const ok = await verify(payload, req.headers.get("stripe-signature") || "", secret);
  if (!ok) return json({ error: "Signature invalide" }, 400);

  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed") return json({ received: true });

  const s = event.data.object;
  if (s.payment_status !== "paid") return json({ received: true });
  const key = (s.metadata?.offer || "") as OfferKey;
  const offer = OFFERS[key];
  const lead = {
    type: "commande",
    status: "gagne",
    name: s.metadata?.name || s.customer_details?.name || "",
    company: s.metadata?.company || "",
    email: s.customer_details?.email || s.customer_email || "",
    phone: s.metadata?.phone || "",
    project_type: "Commande en ligne",
    formule: key,
    message: `Acompte payé : ${(s.amount_total / 100).toLocaleString("fr-FR")} €`,
    amount_cents: s.amount_total,
    stripe_session_id: s.id,
    source_page: "/commander/",
  };

  if (supabaseReady()) {
    const r = await supabase("leads?on_conflict=stripe_session_id", {
      method: "POST",
      headers: { Prefer: "return=minimal,resolution=ignore-duplicates" },
      body: JSON.stringify(lead),
    });
    if (!r.ok) console.error("Supabase insert", r.status, await r.text());
  }
  await sendEmail({
    to: notifyTo(),
    replyTo: lead.email || undefined,
    subject: `Acompte payé — formule ${offer?.name ?? key} — ${lead.company || lead.name}`,
    html: leadEmailHtml("Nouvelle commande payée", [
      ["Client", lead.name],
      ["Entreprise", lead.company],
      ["E-mail", lead.email],
      ["Téléphone", lead.phone],
      ["Formule", offer?.name ?? key],
      ["Montant", lead.message],
      ["Session Stripe", s.id],
    ]),
  });
  return json({ received: true });
};

export const config: Config = { path: "/api/stripe-webhook", method: "POST" };
