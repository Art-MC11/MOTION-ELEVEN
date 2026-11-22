import type { Contact, Settings } from "./crm.mts";
import { activities } from "../../src/data/activities.ts";
import { escapeHtml, siteUrl } from "./shared.mts";
import { unsubscribeToken } from "./auth.mts";

// Variables disponibles dans les modèles :
// {{entreprise}} {{nom}} {{ville}} {{a_ville}} {{activite}} {{un_activite}} {{signature}} {{prenom_signature}} {{site}}
export function render(tpl: string, c: Contact, s: Settings) {
  const act = activities.find((a) => a.label === c.activity);
  const vars: Record<string, string> = {
    entreprise: c.company || "votre entreprise",
    nom: c.name || "",
    ville: c.city || "",
    a_ville: c.city ? ` à ${c.city}` : "",
    activite: (c.activity || "").toLowerCase(),
    un_activite: act?.un || "un professionnel",
    signature: s.signature,
    prenom_signature: (s.senderName || "Meir").split(/[\s—-]/)[0],
    site: c.website || "",
  };
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (k in vars ? vars[k] : "")).replace(/ +([,.])/g, "$1");
}

export async function emailBodies(body: string, email: string) {
  const token = await unsubscribeToken(email);
  const unsub = `${siteUrl()}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${token}`;
  const footer = `Vous recevez ce message car votre entreprise est référencée publiquement. Pour ne plus recevoir de messages de Motion Eleven : ${unsub}`;
  const text = `${body}\n\n--\n${footer}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0c1530;max-width:600px">${escapeHtml(body)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("")}<p style="margin:28px 0 0;font-size:12px;color:#8a93a8">Vous recevez ce message car votre entreprise est référencée publiquement. <a href="${unsub}" style="color:#8a93a8">Ne plus recevoir de messages</a>.</p></div>`;
  return { text, html, unsub };
}

export function whatsappNumber(phone?: string) {
  const d = (phone || "").replace(/[^\d+]/g, "");
  if (!d) return "";
  if (d.startsWith("+")) return d.slice(1);
  if (d.startsWith("00")) return d.slice(2);
  if (d.startsWith("0")) return "33" + d.slice(1);
  return d;
}
