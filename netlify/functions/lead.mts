import type { Config } from "@netlify/functions";
import { clean, isEmail, json, sendEmail, notifyTo, leadEmailHtml } from "../lib/shared.mts";
import { createContact, getContact, saveContact, now } from "../lib/crm.mts";

// Reçoit les demandes de devis, de rendez-vous et de contact.
// Enregistre la demande dans le CRM (Netlify Blobs) et envoie une notification e-mail si Resend est configuré.
export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requête invalide" }, 400);
  }

  // Pot de miel anti-spam : on répond « ok » sans rien faire.
  if (clean(body.bot_field)) return json({ ok: true });

  const formName = clean(body["form-name"], 30);
  const type = formName === "rendez-vous" ? "rdv" : formName === "contact" ? "contact" : "devis";
  const lead = {
    type,
    name: clean(body.name, 120),
    company: clean(body.company, 160),
    email: clean(body.email, 160).toLowerCase(),
    phone: clean(body.phone, 30),
    sector: clean(body.sector, 60),
    project_type: clean(body.project_type, 80),
    budget: clean(body.budget, 60),
    timeline: clean(body.timeline, 60),
    message: clean(body.message, 3000),
    formule: clean(body.formule, 20),
    appointment_date: clean(body.appointment_date, 10) || null,
    appointment_slot: clean(body.appointment_slot, 60),
    appointment_mode: clean(body.appointment_mode, 30),
    source_page: clean(body.page, 300),
    utm: (() => {
      try { return body.utm ? JSON.parse(clean(body.utm, 1000)) : null; } catch { return null; }
    })(),
  };

  if (!lead.name || !isEmail(lead.email) || lead.phone.replace(/\D/g, "").length < 8) {
    return json({ error: "Merci de renseigner votre nom, un e-mail et un téléphone valides." }, 422);
  }
  if (clean(body.consent) !== "oui") return json({ error: "Consentement requis." }, 422);
  if (lead.appointment_date && !/^\d{4}-\d{2}-\d{2}$/.test(lead.appointment_date)) lead.appointment_date = null;

  // Enregistrement dans le CRM (Netlify Blobs)
  let stored = false;
  try {
    const leadInfo = Object.fromEntries(
      Object.entries({
        Projet: lead.project_type, Secteur: lead.sector, Budget: lead.budget, Délai: lead.timeline, Formule: lead.formule,
        "Rendez-vous": [lead.appointment_date, lead.appointment_slot, lead.appointment_mode].filter(Boolean).join(" — "),
        Page: lead.source_page,
      }).filter(([, v]) => v)
    ) as Record<string, string>;
    const historyText = `${type === "rdv" ? "Demande de rendez-vous" : type === "contact" ? "Message" : "Demande de devis"} depuis le site${lead.message ? ` : ${lead.message}` : ""}`;
    const r = await createContact(
      {
        company: lead.company || lead.name,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        activity: lead.sector || undefined,
        source: "site",
        notes: lead.message || undefined,
        lead: leadInfo,
        status: "prospect",
        nextActionAt: new Date().toISOString().slice(0, 10),
      },
      historyText
    );
    if (r.duplicate) {
      const c = await getContact(r.contact.id);
      if (c) {
        c.history.unshift({ at: now(), type: "demande", text: historyText });
        c.lead = leadInfo;
        c.nextActionAt = new Date().toISOString().slice(0, 10);
        if (["perdu", "contacte"].includes(c.status)) c.status = "interesse";
        await saveContact(c);
      }
    }
    stored = true;
  } catch (e) {
    console.error("CRM", e);
  }

  const titles = { devis: "Nouvelle demande de devis", rdv: "Nouvelle demande de rendez-vous", contact: "Nouveau message" };
  const notified = await sendEmail({
    to: notifyTo(),
    replyTo: lead.email,
    subject: `${titles[type]} — ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
    html: leadEmailHtml(titles[type], [
      ["Nom", lead.name],
      ["Entreprise", lead.company],
      ["E-mail", lead.email],
      ["Téléphone", lead.phone],
      ["Secteur", lead.sector],
      ["Projet", lead.project_type],
      ["Formule", lead.formule],
      ["Budget", lead.budget],
      ["Délai", lead.timeline],
      ["Rendez-vous", [lead.appointment_date, lead.appointment_slot, lead.appointment_mode].filter(Boolean).join(" — ")],
      ["Message", lead.message],
      ["Page", lead.source_page],
    ]),
  });

  return json({ ok: true, stored, notified });
};

export const config: Config = {
  path: "/api/lead",
  method: "POST",
  rateLimit: { windowLimit: 8, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
