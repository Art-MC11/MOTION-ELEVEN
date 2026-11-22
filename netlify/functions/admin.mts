import type { Config } from "@netlify/functions";
import { isAuthed } from "../lib/auth.mts";
import { clean, isEmail, json, resendReady, sendEmail, env } from "../lib/shared.mts";
import {
  STATUSES, type Contact, type Status, type Template,
  listContacts, getContact, saveContact, deleteContact, createContact, indexContact, isBlocked, now,
  listTemplates, saveTemplate, deleteTemplate, getSettings, saveSettings, countSentToday, recordSent,
} from "../lib/crm.mts";
import { findCommune, getActivity, searchEntreprises, searchOsm, searchGoogle, googleReady } from "../lib/prospect.mts";
import { render, emailBodies, whatsappNumber } from "../lib/messaging.mts";
import { activities } from "../../src/data/activities.ts";

// API de l'espace administrateur (CRM, prospection, messages). Toutes les routes exigent la session.
export default async (req: Request) => {
  if (!(await isAuthed(req))) return json({ error: "Session expirée, reconnectez-vous." }, 401);

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/admin\/?/, "").split("/").filter(Boolean);
  const [resource, id, sub] = parts;
  const method = req.method;
  const body = async () => { try { return (await req.json()) as Record<string, any>; } catch { return {}; } };

  try {
    // ---------- Tableau de bord ----------
    if (resource === "overview" && method === "GET") {
      const [contacts, settings, sentToday] = await Promise.all([listContacts(), getSettings(), countSentToday()]);
      const today = new Date().toISOString().slice(0, 10);
      const byStatus = Object.fromEntries(STATUSES.map((s) => [s, contacts.filter((c) => c.status === s).length]));
      const clients = contacts.filter((c) => c.status === "client");
      return json({
        byStatus,
        total: contacts.length,
        mrr: clients.reduce((s, c) => s + (Number(c.monthly) || 0), 0),
        signed: clients.reduce((s, c) => s + (Number(c.value) || 0), 0),
        pipeline: contacts.filter((c) => ["interesse", "devis_envoye"].includes(c.status)).reduce((s, c) => s + (Number(c.value) || 0), 0),
        dueToday: contacts.filter((c) => c.nextActionAt && c.nextActionAt <= today && !["client", "perdu", "ne_plus_contacter"].includes(c.status)).map(slim),
        newLeads: contacts.filter((c) => c.source === "site" && c.status === "prospect").slice(0, 10).map(slim),
        sentToday,
        dailyLimit: settings.dailyLimit,
        features: { email: resendReady(), google: googleReady() },
      });
    }

    if (resource === "meta" && method === "GET") {
      return json({ activities: activities.map((a) => ({ key: a.key, label: a.label })), statuses: STATUSES, features: { email: resendReady(), google: googleReady() } });
    }

    // ---------- Prospection ----------
    if (resource === "search" && method === "GET") {
      const act = getActivity(clean(url.searchParams.get("activity"), 40));
      const commune = await findCommune(clean(url.searchParams.get("city"), 80));
      if (!commune) return json({ error: "Commune introuvable. Essayez un nom de ville ou un code postal." }, 404);
      const source = url.searchParams.get("source") || "osm";
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
      const r =
        source === "entreprises" ? await searchEntreprises(act, commune, page)
        : source === "google" ? await searchGoogle(act, commune, url.searchParams.get("pageToken") || undefined)
        : await searchOsm(act, commune, Number(url.searchParams.get("radius")) || 5);
      // Signale ceux qui sont déjà dans le CRM
      const contacts = await listContacts();
      const known = new Set(contacts.map((c) => `${c.source}:${c.sourceId}`));
      return json({ commune, ...r, results: r.results.map((p) => ({ ...p, inCrm: known.has(`${p.source}:${p.sourceId}`) })) });
    }

    // ---------- Contacts ----------
    if (resource === "contacts") {
      if (!id && method === "GET") return json({ contacts: await listContacts() });

      if (!id && method === "POST") {
        const b = await body();
        const items: any[] = Array.isArray(b.items) ? b.items.slice(0, 100) : [b];
        const created: Contact[] = [];
        let duplicates = 0;
        for (const it of items) {
          const company = clean(it.company, 160);
          if (!company) continue;
          const email = clean(it.email, 160).toLowerCase();
          const r = await createContact(
            {
              company,
              source: ["osm", "entreprises", "google", "manuel"].includes(it.source) ? it.source : "manuel",
              sourceId: clean(it.sourceId, 200) || undefined,
              name: clean(it.name, 120) || undefined,
              email: isEmail(email) ? email : undefined,
              phone: clean(it.phone, 30) || undefined,
              website: clean(it.website, 300) || undefined,
              hasWebsite: typeof it.hasWebsite === "boolean" ? it.hasWebsite : it.website ? true : null,
              address: clean(it.address, 300) || undefined,
              postalCode: clean(it.postalCode, 10) || undefined,
              city: clean(it.city, 80) || undefined,
              activity: clean(it.activity, 80) || undefined,
              siren: clean(it.siren, 14) || undefined,
              rating: typeof it.rating === "number" ? it.rating : undefined,
              mapsUrl: clean(it.mapsUrl, 400) || undefined,
              notes: clean(it.notes, 5000) || undefined,
            },
            it.source && it.source !== "manuel" ? `Ajouté depuis la prospection (${sourceLabel(it.source)})` : "Contact créé manuellement"
          );
          if (r.duplicate) duplicates++;
          else created.push(r.contact);
        }
        return json({ created, duplicates });
      }

      const contact = id ? await getContact(id) : null;
      if (!contact) return json({ error: "Contact introuvable" }, 404);

      if (!sub && method === "GET") return json({ contact });

      if (!sub && method === "PATCH") {
        const b = await body();
        const fields = ["company", "name", "email", "phone", "website", "address", "postalCode", "city", "activity", "notes", "formule", "nextActionAt"] as const;
        for (const f of fields) if (typeof b[f] === "string") (contact as any)[f] = clean(b[f], f === "notes" ? 5000 : 300) || undefined;
        if (contact.email && !isEmail(contact.email)) return json({ error: "E-mail invalide" }, 422);
        if (contact.nextActionAt && !/^\d{4}-\d{2}-\d{2}$/.test(contact.nextActionAt)) contact.nextActionAt = undefined;
        for (const f of ["value", "monthly"] as const) if (b[f] !== undefined) (contact as any)[f] = Number(b[f]) || 0;
        if (typeof b.status === "string" && b.status !== contact.status) {
          if (!STATUSES.includes(b.status as Status)) return json({ error: "Statut invalide" }, 400);
          contact.history.unshift({ at: now(), type: "statut", text: `Statut : ${statusLabel(contact.status)} → ${statusLabel(b.status)}` });
          contact.status = b.status as Status;
        }
        await saveContact(contact);
        await indexContact(contact);
        return json({ contact });
      }

      if (!sub && method === "DELETE") {
        await deleteContact(contact.id);
        return json({ ok: true });
      }

      if (sub === "log" && method === "POST") {
        const b = await body();
        const type = ["note", "appel", "whatsapp", "sms", "email"].includes(b.type) ? b.type : "note";
        const text = clean(b.text, 3000);
        if (!text) return json({ error: "Texte vide" }, 422);
        contact.history.unshift({ at: now(), type, text, subject: clean(b.subject, 200) || undefined });
        if (["whatsapp", "sms", "email", "appel"].includes(type) && contact.status === "prospect") contact.status = "contacte";
        if (typeof b.nextActionAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.nextActionAt)) contact.nextActionAt = b.nextActionAt;
        await saveContact(contact);
        return json({ contact });
      }

      if (sub === "render" && method === "POST") {
        const b = await body();
        const settings = await getSettings();
        return json({ subject: render(clean(b.subject, 300), contact, settings), body: render(clean(b.body, 10000), contact, settings), whatsapp: whatsappNumber(contact.phone) });
      }
    }

    // ---------- Envoi d'e-mails ----------
    if (resource === "send" && method === "POST") {
      const b = await body();
      const ids: string[] = Array.isArray(b.contactIds) ? b.contactIds.slice(0, 100) : [];
      const subjectTpl = clean(b.subject, 300);
      const bodyTpl = clean(b.body, 10000);
      if (!subjectTpl || !bodyTpl) return json({ error: "Objet et message requis." }, 422);
      if (!resendReady()) return json({ error: "L'envoi automatique d'e-mails nécessite Resend (RESEND_API_KEY et RESEND_FROM). En attendant, utilisez « Ouvrir dans ma messagerie »." }, 503);
      const settings = await getSettings();
      let sentToday = await countSentToday();
      const report = { sent: 0, skipped: [] as { company: string; reason: string }[] };
      const followUp = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
      for (const cid of ids) {
        const c = await getContact(cid);
        if (!c) continue;
        if (!c.email) { report.skipped.push({ company: c.company, reason: "pas d'e-mail" }); continue; }
        if (c.status === "ne_plus_contacter" || (await isBlocked(c.email))) { report.skipped.push({ company: c.company, reason: "désinscrit" }); continue; }
        if (sentToday >= settings.dailyLimit) { report.skipped.push({ company: c.company, reason: `limite de ${settings.dailyLimit} envois par jour atteinte` }); continue; }
        const subject = render(subjectTpl, c, settings);
        const { html, text, unsub } = await emailBodies(render(bodyTpl, c, settings), c.email);
        const r = await sendEmail({
          to: c.email, subject, html, text,
          replyTo: env("REPLY_TO_EMAIL") || "cohenmeir91@gmail.com",
          headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        });
        if (!r.ok) { report.skipped.push({ company: c.company, reason: r.error || "échec d'envoi" }); continue; }
        sentToday++;
        report.sent++;
        await recordSent(c.id);
        c.history.unshift({ at: now(), type: "email", subject, text: render(bodyTpl, c, settings) });
        if (c.status === "prospect") c.status = "contacte";
        if (!c.nextActionAt) c.nextActionAt = followUp;
        await saveContact(c);
        await new Promise((res) => setTimeout(res, 250)); // espace les envois
      }
      return json(report);
    }

    // ---------- Modèles ----------
    if (resource === "templates") {
      if (method === "GET") return json({ templates: await listTemplates() });
      if (method === "PUT" || method === "POST") {
        const b = await body();
        const t: Template = {
          id: clean(b.id, 60).replace(/[^a-z0-9-]/gi, "") || crypto.randomUUID(),
          name: clean(b.name, 120) || "Sans titre",
          channel: b.channel === "whatsapp" ? "whatsapp" : "email",
          subject: clean(b.subject, 300) || undefined,
          body: clean(b.body, 10000),
          updatedAt: now(),
        };
        if (!t.body) return json({ error: "Message vide" }, 422);
        return json({ template: await saveTemplate(t) });
      }
      if (method === "DELETE" && id) { await deleteTemplate(id); return json({ ok: true }); }
    }

    // ---------- Réglages ----------
    if (resource === "settings") {
      if (method === "GET") return json({ settings: await getSettings() });
      if (method === "PUT") {
        const b = await body();
        const s = await getSettings();
        if (typeof b.signature === "string") s.signature = clean(b.signature, 1000);
        if (typeof b.senderName === "string") s.senderName = clean(b.senderName, 120);
        if (b.dailyLimit !== undefined) s.dailyLimit = Math.min(200, Math.max(1, Number(b.dailyLimit) || 40));
        await saveSettings(s);
        return json({ settings: s });
      }
    }

    // ---------- Export CSV ----------
    if (resource === "export" && method === "GET") {
      const contacts = await listContacts();
      const cols = ["company", "name", "status", "email", "phone", "website", "address", "city", "activity", "value", "monthly", "nextActionAt", "source", "createdAt"] as const;
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [cols.join(";"), ...contacts.map((c) => cols.map((k) => esc((c as any)[k])).join(";"))].join("\n");
      return new Response("﻿" + csv, {
        headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="motion-eleven-contacts.csv"`, "cache-control": "no-store" },
      });
    }

    return json({ error: "Route inconnue" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message || "Erreur serveur" }, 500);
  }
};

const slim = (c: Contact) => ({ id: c.id, company: c.company, city: c.city, status: c.status, nextActionAt: c.nextActionAt, phone: c.phone, email: c.email, source: c.source });
const sourceLabel = (s: string) => ({ osm: "OpenStreetMap", entreprises: "Annuaire des entreprises", google: "Google Maps" } as Record<string, string>)[s] || s;
const statusLabel = (s: string) =>
  ({ prospect: "Prospect", contacte: "Contacté", interesse: "Intéressé", devis_envoye: "Devis envoyé", client: "Client", perdu: "Perdu", ne_plus_contacter: "Ne plus contacter" } as Record<string, string>)[s] || s;

export const config: Config = {
  path: "/api/admin/*",
  excludedPath: ["/api/admin/login", "/api/admin/logout", "/api/admin/session"],
  rateLimit: { windowLimit: 180, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
