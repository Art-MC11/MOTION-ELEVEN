// Stockage du CRM dans Netlify Blobs : un objet par contact (pas de fichier partagé
// réécrit en entier), un objet par modèle de message, une entrée par adresse désinscrite.
import { getStore } from "@netlify/blobs";

export type Status =
  | "prospect" | "contacte" | "interesse" | "devis_envoye" | "client" | "perdu" | "ne_plus_contacter";
export const STATUSES: Status[] = ["prospect", "contacte", "interesse", "devis_envoye", "client", "perdu", "ne_plus_contacter"];

export type HistoryItem = {
  at: string;
  type: "email" | "whatsapp" | "sms" | "appel" | "note" | "statut" | "demande" | "paiement" | "creation";
  text: string;
  subject?: string;
};

export type Contact = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: Status;
  source: "site" | "osm" | "entreprises" | "google" | "manuel" | "stripe";
  sourceId?: string;
  company: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  hasWebsite?: boolean | null;
  address?: string;
  postalCode?: string;
  city?: string;
  activity?: string;
  siren?: string;
  rating?: number;
  mapsUrl?: string;
  tags?: string[];
  notes?: string;
  value?: number;       // montant du projet (création), en euros
  monthly?: number;     // abonnement mensuel, en euros
  formule?: string;
  nextActionAt?: string; // date de relance (AAAA-MM-JJ)
  lead?: Record<string, string>;
  history: HistoryItem[];
};

const STORE = "crm";
const store = () => getStore({ name: STORE, consistency: "strong" });

export const newId = () => crypto.randomUUID();
export const now = () => new Date().toISOString();

export async function listContacts(): Promise<Contact[]> {
  const s = store();
  const { blobs } = await s.list({ prefix: "contacts/" });
  const out: Contact[] = [];
  const batch = 40;
  for (let i = 0; i < blobs.length; i += batch) {
    const part = await Promise.all(blobs.slice(i, i + batch).map((b) => s.get(b.key, { type: "json" }) as Promise<Contact | null>));
    part.forEach((c) => c && out.push(c));
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getContact(id: string): Promise<Contact | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return (await store().get(`contacts/${id}`, { type: "json" })) as Contact | null;
}

export async function saveContact(c: Contact) {
  c.updatedAt = now();
  await store().setJSON(`contacts/${c.id}`, c);
  return c;
}

export async function deleteContact(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await store().delete(`contacts/${id}`);
}

// Index de dédoublonnage : une clé par identifiant externe (source + id), e-mail et téléphone
const norm = {
  email: (e?: string) => (e || "").trim().toLowerCase(),
  phone: (p?: string) => {
    const d = (p || "").replace(/[^\d+]/g, "");
    if (d.startsWith("+33")) return "0" + d.slice(3);
    if (d.startsWith("0033")) return "0" + d.slice(4);
    return d;
  },
};
const keyOf = (kind: string, v: string) => `index/${kind}/${encodeURIComponent(v).slice(0, 500)}`;

export async function findDuplicate(c: Partial<Contact>): Promise<string | null> {
  const s = store();
  const keys = [
    c.sourceId && keyOf("source", `${c.source}:${c.sourceId}`),
    norm.email(c.email) && keyOf("email", norm.email(c.email)),
    norm.phone(c.phone).length >= 9 && keyOf("phone", norm.phone(c.phone)),
  ].filter(Boolean) as string[];
  for (const k of keys) {
    const id = await s.get(k);
    if (id && (await getContact(id))) return id;
  }
  return null;
}

export async function indexContact(c: Contact) {
  const s = store();
  const writes: Promise<unknown>[] = [];
  if (c.sourceId) writes.push(s.set(keyOf("source", `${c.source}:${c.sourceId}`), c.id));
  if (norm.email(c.email)) writes.push(s.set(keyOf("email", norm.email(c.email)), c.id));
  if (norm.phone(c.phone).length >= 9) writes.push(s.set(keyOf("phone", norm.phone(c.phone)), c.id));
  await Promise.all(writes);
}

export async function createContact(input: Partial<Contact> & { company: string }, historyText = "Contact créé"): Promise<{ contact: Contact; duplicate: boolean }> {
  const dup = await findDuplicate(input);
  if (dup) {
    const existing = (await getContact(dup))!;
    return { contact: existing, duplicate: true };
  }
  const blocked = input.email ? await isBlocked(input.email) : false;
  const c: Contact = {
    id: newId(),
    createdAt: now(),
    updatedAt: now(),
    status: blocked ? "ne_plus_contacter" : "prospect",
    source: "manuel",
    history: [],
    ...input,
  } as Contact;
  c.history = [{ at: now(), type: "creation", text: historyText }, ...(input.history || [])];
  await saveContact(c);
  await indexContact(c);
  return { contact: c, duplicate: false };
}

// Désinscriptions (opposition à la prospection)
const hashEmail = async (email: string) => {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(norm.email(email)));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
export async function isBlocked(email: string) {
  if (!norm.email(email)) return false;
  return (await store().get(`blocklist/${await hashEmail(email)}`)) !== null;
}
export async function block(email: string) {
  await store().set(`blocklist/${await hashEmail(email)}`, now());
  const id = await store().get(keyOf("email", norm.email(email)));
  if (id) {
    const c = await getContact(id);
    if (c) {
      c.status = "ne_plus_contacter";
      c.history.unshift({ at: now(), type: "statut", text: "Désinscription via le lien de l'e-mail" });
      await saveContact(c);
    }
  }
}

// Modèles de messages
export type Template = { id: string; name: string; channel: "email" | "whatsapp"; subject?: string; body: string; updatedAt: string };

export const DEFAULT_TEMPLATES: Omit<Template, "updatedAt">[] = [
  {
    id: "premier-contact-sans-site",
    name: "Premier contact : pas de site",
    channel: "email",
    subject: "{{entreprise}} : un site pour vous trouver sur Google",
    body:
      "Bonjour,\n\nJe me permets de vous contacter car je n'ai pas trouvé de site internet pour {{entreprise}}{{a_ville}}.\n\nAujourd'hui, la plupart des clients cherchent sur Google avant de choisir {{un_activite}}. Je crée des sites professionnels pour les entreprises d'Île-de-France : clairs, rapides sur mobile, avec un formulaire de contact ou de réservation.\n\nÀ partir de 590 € HT, hébergement et maintenance compris. Seriez-vous disponible pour un appel de 10 minutes cette semaine ?\n\nBien à vous,\n{{signature}}",
  },
  {
    id: "premier-contact-refonte",
    name: "Premier contact : site à moderniser",
    channel: "email",
    subject: "Une idée pour le site de {{entreprise}}",
    body:
      "Bonjour,\n\nEn visitant le site de {{entreprise}}, j'ai pensé qu'une version plus moderne, plus rapide sur mobile et avec une prise de contact plus directe pourrait vous apporter davantage de demandes.\n\nJe suis designer et je crée des sites pour les entreprises d'Île-de-France. Je peux vous montrer en 10 minutes ce que je changerais, gratuitement et sans engagement.\n\nQuand seriez-vous disponible ?\n\nBien à vous,\n{{signature}}",
  },
  {
    id: "relance",
    name: "Relance",
    channel: "email",
    subject: "Re : {{entreprise}}",
    body:
      "Bonjour,\n\nJe me permets de revenir vers vous au sujet de mon précédent message. Si le sujet vous intéresse, je peux vous envoyer un exemple de site adapté à votre activité.\n\nBonne journée,\n{{signature}}",
  },
  {
    id: "whatsapp-premier-contact",
    name: "WhatsApp : premier contact",
    channel: "whatsapp",
    body:
      "Bonjour, je suis {{prenom_signature}} de Motion Eleven. Je crée des sites internet pour les entreprises d'Île-de-France. J'ai vu {{entreprise}} et j'ai quelques idées pour vous apporter plus de clients en ligne. Puis-je vous en parler 5 minutes ?",
  },
];

export async function listTemplates(): Promise<Template[]> {
  const s = store();
  const { blobs } = await s.list({ prefix: "templates/" });
  if (blobs.length === 0) {
    const seeded = DEFAULT_TEMPLATES.map((t) => ({ ...t, updatedAt: now() }));
    await Promise.all(seeded.map((t) => s.setJSON(`templates/${t.id}`, t)));
    return seeded;
  }
  const all = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" }) as Promise<Template | null>));
  return all.filter(Boolean).sort((a, b) => a!.name.localeCompare(b!.name)) as Template[];
}
export async function saveTemplate(t: Template) {
  t.updatedAt = now();
  await store().setJSON(`templates/${t.id}`, t);
  return t;
}
export async function deleteTemplate(id: string) {
  await store().delete(`templates/${id}`);
}

// Réglages
export type Settings = { signature: string; senderName: string; dailyLimit: number };
export async function getSettings(): Promise<Settings> {
  const s = (await store().get("settings", { type: "json" })) as Partial<Settings> | null;
  return {
    signature: "Meir Cohen\nMotion Eleven — Digital Agency & Technology\n06 86 69 46 14\nhttps://motion-eleven.fr",
    senderName: "Meir Cohen — Motion Eleven",
    dailyLimit: 40,
    ...(s || {}),
  };
}
export async function saveSettings(v: Settings) {
  await store().setJSON("settings", v);
}

// Compteur d'envois du jour : une entrée par envoi, comptée par liste (pas de compteur réécrit)
export async function countSentToday() {
  const day = new Date().toISOString().slice(0, 10);
  const { blobs } = await store().list({ prefix: `sent/${day}/` });
  return blobs.length;
}
export async function recordSent(contactId: string) {
  const day = new Date().toISOString().slice(0, 10);
  await store().set(`sent/${day}/${Date.now()}-${contactId}`, "1");
}
