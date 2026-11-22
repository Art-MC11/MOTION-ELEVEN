import type { Config } from "@netlify/functions";
import { authConfigured, checkPassword, clearCookie, isAuthed, sessionCookie } from "../lib/auth.mts";
import { clean, json } from "../lib/shared.mts";

// Connexion / déconnexion de l'espace administrateur. Fortement limité en débit.
export default async (req: Request) => {
  const action = new URL(req.url).pathname.split("/").pop();

  if (action === "logout") return json({ ok: true }, 200, { "set-cookie": clearCookie() });

  if (action === "session") return json({ authed: await isAuthed(req), configured: authConfigured() });

  if (action === "login" && req.method === "POST") {
    if (!authConfigured()) {
      return json({ error: "L'accès administrateur n'est pas configuré (ADMIN_PASSWORD et APP_SECRET dans Netlify)." }, 503);
    }
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* */ }
    const ok = await checkPassword(clean(body.password, 200));
    if (!ok) {
      await new Promise((r) => setTimeout(r, 600)); // ralentit les essais
      return json({ error: "Mot de passe incorrect." }, 401);
    }
    return json({ ok: true }, 200, { "set-cookie": await sessionCookie() });
  }
  return json({ error: "Introuvable" }, 404);
};

export const config: Config = {
  path: ["/api/admin/login", "/api/admin/logout", "/api/admin/session"],
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
