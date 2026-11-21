import type { Config } from "@netlify/functions";
import { env, json, safeEqual, supabase, supabaseReady, clean } from "../lib/shared.mts";

// API du mini CRM. Protégée par ADMIN_PASSWORD (variable d'environnement Netlify).
const STATUSES = ["nouveau", "contacte", "devis_envoye", "gagne", "perdu"];

export default async (req: Request) => {
  const password = env("ADMIN_PASSWORD");
  if (!password || password.length < 12) {
    return json({ error: "Définissez ADMIN_PASSWORD (12 caractères minimum) dans les variables d'environnement Netlify." }, 503);
  }
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!(await safeEqual(token, password))) return json({ error: "Mot de passe incorrect." }, 401);

  if (!supabaseReady()) {
    return json({ error: "Supabase n'est pas encore configuré (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY). Les demandes restent consultables dans Netlify > Forms." }, 503);
  }

  if (req.method === "GET") {
    const r = await supabase("leads?select=*&order=created_at.desc&limit=500");
    if (!r.ok) return json({ error: "Lecture impossible." }, 502);
    return json({ leads: await r.json() });
  }

  if (req.method === "PATCH") {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Requête invalide" }, 400); }
    const id = clean(body.id, 40);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Identifiant invalide" }, 400);
    const patch: Record<string, string> = { updated_at: new Date().toISOString() };
    if (typeof body.status === "string") {
      if (!STATUSES.includes(body.status)) return json({ error: "Statut invalide" }, 400);
      patch.status = body.status;
    }
    if (typeof body.notes === "string") patch.notes = clean(body.notes, 5000);
    const r = await supabase(`leads?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
    if (!r.ok) return json({ error: "Mise à jour impossible." }, 502);
    return json({ ok: true });
  }

  return json({ error: "Méthode non autorisée" }, 405);
};

export const config: Config = {
  path: "/api/admin/leads",
  method: ["GET", "PATCH"],
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
