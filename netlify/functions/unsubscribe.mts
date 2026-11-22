import type { Config } from "@netlify/functions";
import { checkUnsubscribeToken } from "../lib/auth.mts";
import { block } from "../lib/crm.mts";
import { clean, escapeHtml, isEmail } from "../lib/shared.mts";

// Lien de désinscription présent dans chaque e-mail de prospection (GET et désinscription en un clic POST).
const page = (title: string, text: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head><body style="font-family:Arial,sans-serif;background:#eef0f4;color:#0c1530;display:grid;place-items:center;min-height:100vh;margin:0;padding:20px"><div style="background:#fff;border-radius:16px;padding:32px;max-width:460px"><h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1><p style="line-height:1.5;margin:0">${escapeHtml(text)}</p><p style="margin:20px 0 0"><a href="/" style="color:#2f45ff">motion-eleven.fr</a></p></div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
  );

export default async (req: Request) => {
  const url = new URL(req.url);
  const email = clean(url.searchParams.get("e"), 200).toLowerCase();
  const token = clean(url.searchParams.get("t"), 100);
  if (!isEmail(email) || !token || !(await checkUnsubscribeToken(email, token))) {
    return page("Lien invalide", "Ce lien de désinscription n'est pas valide. Écrivez-nous et nous retirerons votre adresse.", 400);
  }
  await block(email);
  return page("C'est noté", `L'adresse ${email} ne recevra plus de messages de Motion Eleven.`);
};

export const config: Config = { path: "/api/unsubscribe", method: ["GET", "POST"] };
