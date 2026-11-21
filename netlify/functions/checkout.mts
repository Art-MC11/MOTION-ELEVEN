import type { Config } from "@netlify/functions";
import { OFFERS, type OfferKey, clean, env, isEmail, json } from "../lib/shared.mts";

// Crée une session Stripe Checkout pour l'acompte (50 %) d'une formule standard.
// Le montant est calculé ici, côté serveur : le navigateur n'envoie que le nom de la formule.
export default async (req: Request) => {
  const secret = env("STRIPE_SECRET_KEY");
  if (!secret) return json({ error: "Le paiement en ligne n'est pas encore activé." }, 503);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Requête invalide" }, 400); }

  const key = clean(body.offer, 20) as OfferKey;
  const offer = OFFERS[key];
  if (!offer) return json({ error: "Formule inconnue." }, 400);
  if (clean(body.accept_cgv) !== "oui") return json({ error: "Vous devez accepter les conditions générales de vente." }, 422);

  const name = clean(body.name, 120);
  const company = clean(body.company, 160);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 30);
  if (!name || !company || !isEmail(email) || phone.replace(/\D/g, "").length < 8) {
    return json({ error: "Merci de compléter vos coordonnées." }, 422);
  }

  const deposit = Math.round(offer.setup * 100 * 0.5); // en centimes
  const origin = env("URL") || new URL(req.url).origin;

  const params = new URLSearchParams({
    mode: "payment",
    locale: "fr",
    customer_email: email,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(deposit),
    "line_items[0][price_data][product_data][name]": `Acompte 50 % — Création de site, formule ${offer.name}`,
    "line_items[0][price_data][product_data][description]": `Création ${offer.setup} € HT. Solde à la mise en ligne. Abonnement ${offer.monthly} € HT/mois à partir de la mise en ligne.`,
    "metadata[offer]": key,
    "metadata[name]": name,
    "metadata[company]": company,
    "metadata[phone]": phone,
    "payment_intent_data[description]": `Motion Eleven — acompte formule ${offer.name} — ${company}`,
    "payment_intent_data[metadata][offer]": key,
    success_url: `${origin}/merci/?paiement=ok&formule=${key}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/commander/?formule=${key}&annule=1`,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Stripe", res.status, data?.error?.message);
    return json({ error: "Impossible de créer la page de paiement pour le moment." }, 502);
  }
  return json({ url: data.url });
};

export const config: Config = {
  path: "/api/checkout",
  method: "POST",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
