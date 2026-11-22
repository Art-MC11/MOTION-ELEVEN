// Espace administrateur Motion Eleven : prospection, contacts, messages.
type Status = "prospect" | "contacte" | "interesse" | "devis_envoye" | "client" | "perdu" | "ne_plus_contacter";
type History = { at: string; type: string; text: string; subject?: string };
type Contact = {
  id: string; createdAt: string; updatedAt: string; status: Status; source: string; sourceId?: string;
  company: string; name?: string; email?: string; phone?: string; website?: string; hasWebsite?: boolean | null;
  address?: string; postalCode?: string; city?: string; activity?: string; siren?: string; rating?: number; mapsUrl?: string;
  notes?: string; value?: number; monthly?: number; formule?: string; nextActionAt?: string; lead?: Record<string, string>; history: History[];
};
type Prospect = Partial<Contact> & { company: string; source: string; sourceId: string; inCrm?: boolean; createdOn?: string; ratingCount?: number };
type Template = { id: string; name: string; channel: "email" | "whatsapp"; subject?: string; body: string };

const STATUS: Record<Status, string> = {
  prospect: "Prospect", contacte: "Contacté", interesse: "Intéressé", devis_envoye: "Devis envoyé",
  client: "Client", perdu: "Perdu", ne_plus_contacter: "Ne plus contacter",
};
const HTYPE: Record<string, string> = { email: "E-mail", whatsapp: "WhatsApp", sms: "SMS", appel: "Appel", note: "Note", statut: "Statut", demande: "Demande", paiement: "Paiement", creation: "Création" };
const SOURCE: Record<string, string> = { site: "Site web", osm: "OpenStreetMap", entreprises: "Annuaire", google: "Google Maps", manuel: "Manuel", stripe: "Paiement" };

const $ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const eur = (n?: number) => (Number(n) || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
const date = (s?: string) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "");
const dateTime = (s: string) => new Date(s).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const waNumber = (p?: string) => {
  const d = (p || "").replace(/[^\d+]/g, "");
  if (!d) return "";
  if (d.startsWith("+")) return d.slice(1);
  if (d.startsWith("00")) return d.slice(2);
  return d.startsWith("0") ? "33" + d.slice(1) : d;
};

const state = {
  meta: { activities: [] as { key: string; label: string }[], features: { email: false, google: false } },
  contacts: [] as Contact[],
  templates: [] as Template[],
  filter: "actifs" as string,
  query: "",
  selected: new Set<string>(),
  search: { results: [] as Prospect[], page: 1, pageToken: "" as string | undefined, params: null as URLSearchParams | null, hasMore: false },
  pick: new Set<string>(),
};

async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "login") { showLogin(); throw new Error(data.error || "Session expirée"); }
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data as T;
}

function toast(msg: string, kind: "ok" | "err" = "ok") {
  const t = $("#toast");
  t.textContent = msg;
  t.className = `toast toast--${kind} is-on`;
  clearTimeout((t as any)._t);
  (t as any)._t = setTimeout(() => t.classList.remove("is-on"), 3200);
}

// ---------------- Connexion ----------------
function showLogin() {
  $("#login").hidden = false;
  $("#app").hidden = true;
}
async function boot() {
  const s = await fetch("/api/admin/session", { credentials: "same-origin" }).then((r) => r.json()).catch(() => ({ authed: false, configured: true }));
  if (!s.configured) {
    $("#login-error").textContent = "L'accès n'est pas encore configuré sur Netlify (ADMIN_PASSWORD et APP_SECRET).";
    $("#login-error").hidden = false;
  }
  if (!s.authed) return showLogin();
  await start();
}
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $<HTMLButtonElement>("#login-form button");
  btn.disabled = true;
  try {
    await api("login", { method: "POST", json: { password: $<HTMLInputElement>("#pw").value } });
    await start();
  } catch (err) {
    $("#login-error").textContent = (err as Error).message;
    $("#login-error").hidden = false;
  } finally {
    btn.disabled = false;
  }
});
$("#logout").addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
  location.reload();
});

async function start() {
  $("#login").hidden = true;
  $("#app").hidden = false;
  const meta = await api("meta");
  state.meta = meta;
  $<HTMLSelectElement>("#s-activity").innerHTML = meta.activities.map((a: any) => `<option value="${a.key}">${esc(a.label)}</option>`).join("");
  $<HTMLInputElement>("#src-google").disabled = !meta.features.google;
  $("#src-google-hint").hidden = meta.features.google;
  go(location.hash.slice(1) || "accueil");
}

// ---------------- Navigation ----------------
const views = ["accueil", "prospecter", "contacts", "messages", "reglages"];
function go(view: string) {
  if (!views.includes(view)) view = "accueil";
  views.forEach((v) => ($(`#v-${v}`).hidden = v !== view));
  $$(".nav a").forEach((a) => a.classList.toggle("is-on", a.dataset.view === view));
  history.replaceState(null, "", `#${view}`);
  window.scrollTo(0, 0);
  if (view === "accueil") loadOverview();
  if (view === "contacts") loadContacts();
  if (view === "messages") loadTemplates();
  if (view === "reglages") loadSettings();
}
$$(".nav a").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); go(a.dataset.view!); }));
document.addEventListener("click", (e) => {
  const g = (e.target as HTMLElement).closest<HTMLElement>("[data-go]");
  if (g) { e.preventDefault(); go(g.dataset.go!); }
});

// ---------------- Accueil ----------------
async function loadOverview() {
  const box = $("#v-accueil-body");
  box.innerHTML = `<p class="muted">Chargement…</p>`;
  try {
    const o = await api("overview");
    const row = (c: any) => `<button class="row" data-open="${c.id}"><strong>${esc(c.company)}</strong><span>${esc([c.city, c.nextActionAt ? `relance ${date(c.nextActionAt)}` : ""].filter(Boolean).join(" · "))}</span><em class="pill pill--${c.status}">${STATUS[c.status as Status]}</em></button>`;
    box.innerHTML = `
      <div class="kpis">
        <div><span>Revenu mensuel</span><strong>${eur(o.mrr)}</strong></div>
        <div><span>Clients</span><strong>${o.byStatus.client}</strong></div>
        <div><span>En négociation</span><strong>${o.byStatus.interesse + o.byStatus.devis_envoye}</strong><em>${eur(o.pipeline)}</em></div>
        <div><span>Prospects</span><strong>${o.byStatus.prospect + o.byStatus.contacte}</strong><em>${o.total} contacts</em></div>
      </div>
      <div class="quick">
        <a href="#" data-go="prospecter" class="btn">Trouver des clients</a>
        <a href="#" data-go="messages" class="btn btn--ghost">Campagne e-mail</a>
      </div>
      <section class="card">
        <h2>À relancer aujourd'hui <em>${o.dueToday.length}</em></h2>
        ${o.dueToday.length ? `<div class="rows">${o.dueToday.map(row).join("")}</div>` : `<p class="muted">Rien à relancer. Ajoutez des prospects pour remplir votre agenda.</p>`}
      </section>
      <section class="card">
        <h2>Demandes reçues sur le site <em>${o.newLeads.length}</em></h2>
        ${o.newLeads.length ? `<div class="rows">${o.newLeads.map(row).join("")}</div>` : `<p class="muted">Les demandes de devis et de rendez-vous du site arrivent ici automatiquement.</p>`}
      </section>
      <p class="muted small">E-mails envoyés aujourd'hui : ${o.sentToday} / ${o.dailyLimit}. ${o.features.email ? "" : "Envoi automatique désactivé : ajoutez Resend dans les réglages Netlify."}</p>`;
  } catch (e) {
    box.innerHTML = `<p class="err">${esc((e as Error).message)}</p>`;
  }
}

// ---------------- Prospection ----------------
$("#search-form").addEventListener("submit", (e) => { e.preventDefault(); runSearch(true); });
$$<HTMLInputElement>("input[name=source]").forEach((r) => r.addEventListener("change", syncSourceUi));
function syncSourceUi() {
  const src = $<HTMLInputElement>("input[name=source]:checked").value;
  $("#radius-field").hidden = src !== "osm";
  $("#nosite-field").hidden = src === "entreprises";
}
syncSourceUi();

async function runSearch(reset: boolean) {
  const out = $("#results");
  const btn = $<HTMLButtonElement>("#search-form button[type=submit]");
  if (reset) {
    const p = new URLSearchParams({
      source: $<HTMLInputElement>("input[name=source]:checked").value,
      activity: $<HTMLSelectElement>("#s-activity").value,
      city: $<HTMLInputElement>("#s-city").value.trim(),
      radius: $<HTMLSelectElement>("#s-radius").value,
    });
    if (!p.get("city")) { toast("Indiquez une ville ou un code postal", "err"); return; }
    state.search = { results: [], page: 1, pageToken: undefined, params: p, hasMore: false };
    state.pick.clear();
    out.innerHTML = `<p class="muted">Recherche en cours… OpenStreetMap peut prendre jusqu'à 20 secondes.</p>`;
  }
  const p = new URLSearchParams(state.search.params!);
  p.set("page", String(state.search.page));
  if (state.search.pageToken) p.set("pageToken", state.search.pageToken);
  btn.disabled = true;
  try {
    const r = await api(`search?${p}`);
    state.search.results.push(...r.results);
    state.search.hasMore = r.hasMore;
    state.search.pageToken = r.nextPageToken;
    renderResults(r.commune?.nom);
  } catch (e) {
    out.innerHTML = `<p class="err">${esc((e as Error).message)}</p>`;
  } finally {
    btn.disabled = false;
  }
}

function renderResults(communeName?: string) {
  const onlyNoSite = $<HTMLInputElement>("#s-nosite").checked && state.search.params?.get("source") !== "entreprises";
  const list = state.search.results.filter((r) => !onlyNoSite || r.hasWebsite === false);
  const withoutSite = state.search.results.filter((r) => r.hasWebsite === false).length;
  const out = $("#results");
  const pickable = list.filter((r) => !r.inCrm);
  const allPicked = pickable.length > 0 && pickable.every((r) => state.pick.has(r.sourceId));
  if (!list.length) {
    out.innerHTML = `<p class="muted">Aucun résultat${onlyNoSite ? " sans site" : ""}. Essayez une autre ville, un rayon plus grand ou une autre source.</p>`;
    return;
  }
  out.innerHTML = `
    <div class="res-head">
      <p><strong>${list.length}</strong> résultats${communeName ? ` autour de ${esc(communeName)}` : ""}${withoutSite ? ` · ${withoutSite} sans site` : ""}</p>
      ${pickable.length ? `<label class="check"><input type="checkbox" id="pick-all" ${allPicked ? "checked" : ""} /> Tout sélectionner</label>` : ""}
    </div>
    <div class="cards">${list.map(resultCard).join("")}</div>
    ${state.search.hasMore ? `<button class="btn btn--ghost btn--wide" id="more">Plus de résultats</button>` : ""}`;
  $("#more")?.addEventListener("click", () => { state.search.page++; runSearch(false); });
  $("#pick-all")?.addEventListener("change", (e) => {
    const on = (e.target as HTMLInputElement).checked;
    list.filter((r) => !r.inCrm).forEach((r) => (on ? state.pick.add(r.sourceId) : state.pick.delete(r.sourceId)));
    renderResults(communeName);
  });
  $$<HTMLInputElement>("[data-pick]", out).forEach((c) =>
    c.addEventListener("change", () => { c.checked ? state.pick.add(c.dataset.pick!) : state.pick.delete(c.dataset.pick!); updatePickBar(); })
  );
  $$<HTMLButtonElement>("[data-add]", out).forEach((b) => b.addEventListener("click", () => addProspects([b.dataset.add!])));
  updatePickBar();
}

function resultCard(r: Prospect) {
  const q = encodeURIComponent(`${r.company} ${r.city || ""}`);
  const site = r.hasWebsite === false
    ? `<span class="tag tag--hot">Sans site</span>`
    : r.website ? `<a class="tag" href="${esc(r.website)}" target="_blank" rel="noopener">Voir le site</a>` : `<span class="tag">Site inconnu</span>`;
  return `<article class="res${r.inCrm ? " is-in" : ""}">
    <label class="res__pick">${r.inCrm ? "" : `<input type="checkbox" data-pick="${esc(r.sourceId)}" ${state.pick.has(r.sourceId) ? "checked" : ""} aria-label="Sélectionner ${esc(r.company)}" />`}</label>
    <div class="res__main">
      <strong>${esc(r.company)}</strong>
      <span>${esc(r.address || r.city || "")}</span>
      <div class="res__tags">
        ${site}
        ${r.phone ? `<a class="tag" href="tel:${esc(r.phone.replace(/\s/g, ""))}">${esc(r.phone)}</a>` : `<a class="tag" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener">Chercher le téléphone</a>`}
        ${r.email ? `<span class="tag">${esc(r.email)}</span>` : ""}
        ${r.rating ? `<span class="tag">${r.rating} ★ (${r.ratingCount || 0})</span>` : ""}
        ${r.createdOn ? `<span class="tag">Créée ${new Date(r.createdOn).getFullYear()}</span>` : ""}
        ${r.name ? `<span class="tag">${esc(r.name)}</span>` : ""}
      </div>
    </div>
    ${r.inCrm ? `<span class="res__in">Dans le CRM</span>` : `<button class="btn btn--sm" data-add="${esc(r.sourceId)}">Ajouter</button>`}
  </article>`;
}

function updatePickBar() {
  const bar = $("#pick-bar");
  bar.hidden = state.pick.size === 0;
  $("#pick-count").textContent = String(state.pick.size);
}
$("#pick-add").addEventListener("click", () => addProspects([...state.pick]));

async function addProspects(ids: string[]) {
  const items = state.search.results.filter((r) => ids.includes(r.sourceId));
  if (!items.length) return;
  try {
    const r = await api("contacts", { method: "POST", json: { items } });
    items.forEach((i) => { i.inCrm = true; state.pick.delete(i.sourceId); });
    renderResults();
    toast(`${r.created.length} ajouté${r.created.length > 1 ? "s" : ""} au CRM${r.duplicates ? ` · ${r.duplicates} déjà présent${r.duplicates > 1 ? "s" : ""}` : ""}`);
  } catch (e) {
    toast((e as Error).message, "err");
  }
}

// ---------------- Contacts ----------------
async function loadContacts() {
  try {
    const r = await api("contacts");
    state.contacts = r.contacts;
    renderContacts();
  } catch (e) {
    $("#contact-list").innerHTML = `<p class="err">${esc((e as Error).message)}</p>`;
  }
}
const FILTERS: [string, string, (c: Contact) => boolean][] = [
  ["actifs", "En cours", (c) => !["client", "perdu", "ne_plus_contacter"].includes(c.status)],
  ["relance", "À relancer", (c) => Boolean(c.nextActionAt && c.nextActionAt <= today()) && !["client", "perdu", "ne_plus_contacter"].includes(c.status)],
  ...(Object.keys(STATUS) as Status[]).map((s) => [s, STATUS[s], (c: Contact) => c.status === s] as [string, string, (c: Contact) => boolean]),
  ["tous", "Tous", () => true],
];
function filtered() {
  const f = FILTERS.find((x) => x[0] === state.filter)![2];
  const q = state.query.toLowerCase();
  return state.contacts.filter(f).filter((c) => !q || [c.company, c.name, c.email, c.phone, c.city, c.activity].join(" ").toLowerCase().includes(q));
}
function renderContacts() {
  $("#filters").innerHTML = FILTERS.map(([k, label, fn]) => {
    const n = state.contacts.filter(fn).length;
    return `<button class="chip${state.filter === k ? " is-on" : ""}" data-filter="${k}">${label} <em>${n}</em></button>`;
  }).join("");
  const list = filtered();
  $("#contact-list").innerHTML = list.length
    ? list.map((c) => `
      <div class="crow">
        <input type="checkbox" data-sel="${c.id}" ${state.selected.has(c.id) ? "checked" : ""} aria-label="Sélectionner ${esc(c.company)}" />
        <button class="crow__main" data-open="${c.id}">
          <strong>${esc(c.company)}</strong>
          <span>${esc([c.activity, c.city].filter(Boolean).join(" · "))}</span>
          <span class="crow__meta">${c.email ? "✉︎ " : ""}${c.phone ? "☏ " : ""}${c.hasWebsite === false ? "Sans site · " : ""}${c.nextActionAt ? `Relance ${date(c.nextActionAt)}` : `Ajouté ${date(c.createdAt)}`}</span>
        </button>
        <em class="pill pill--${c.status}">${STATUS[c.status]}</em>
      </div>`).join("")
    : `<p class="muted">Aucun contact ici. <a href="#" data-go="prospecter">Trouver des prospects</a></p>`;
  updateSelBar();
}
$("#filters").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-filter]");
  if (b) { state.filter = b.dataset.filter!; renderContacts(); }
});
$("#c-search").addEventListener("input", (e) => { state.query = (e.target as HTMLInputElement).value; renderContacts(); });
$("#contact-list").addEventListener("change", (e) => {
  const c = e.target as HTMLInputElement;
  if (!c.dataset.sel) return;
  c.checked ? state.selected.add(c.dataset.sel) : state.selected.delete(c.dataset.sel);
  updateSelBar();
});
function updateSelBar() {
  $("#sel-bar").hidden = state.selected.size === 0;
  $("#sel-count").textContent = String(state.selected.size);
}
$("#sel-clear").addEventListener("click", () => { state.selected.clear(); renderContacts(); });
$("#sel-email").addEventListener("click", () => { go("messages"); prepareCampaign([...state.selected]); });
$("#add-contact").addEventListener("click", () => openContact(null));
$("#export").addEventListener("click", () => (location.href = "/api/admin/export"));

document.addEventListener("click", (e) => {
  const o = (e.target as HTMLElement).closest<HTMLElement>("[data-open]");
  if (o) openContact(o.dataset.open!);
});

// Fiche contact
const sheet = $<HTMLDialogElement>("#sheet");
async function openContact(id: string | null) {
  let c: Contact;
  if (id) {
    try { c = (await api(`contacts/${id}`)).contact; } catch (e) { toast((e as Error).message, "err"); return; }
  } else {
    c = { id: "", company: "", status: "prospect", source: "manuel", history: [], createdAt: "", updatedAt: "" };
  }
  if (!state.templates.length) state.templates = (await api("templates")).templates;
  const f = (name: keyof Contact, label: string, type = "text", extra = "") =>
    `<label class="fld"><span>${label}</span><input name="${name}" type="${type}" value="${esc(c[name] as any)}" ${extra} /></label>`;
  const wa = waNumber(c.phone);
  $("#sheet-body").innerHTML = `
    <header class="sh__head">
      <div>
        <h2>${esc(c.company || "Nouveau contact")}</h2>
        <p class="muted small">${id ? `${SOURCE[c.source] || c.source} · ajouté le ${date(c.createdAt)}` : "Saisie manuelle"}</p>
      </div>
      <button class="x" data-close aria-label="Fermer">✕</button>
    </header>
    ${id ? `<div class="sh__actions">
      ${c.phone ? `<a class="act" href="tel:${esc(c.phone.replace(/\s/g, ""))}" data-log="appel">Appeler</a>` : ""}
      ${wa ? `<button class="act" data-compose="whatsapp">WhatsApp</button>` : ""}
      ${c.email ? `<button class="act" data-compose="email">E-mail</button>` : ""}
      ${c.website ? `<a class="act" href="${esc(c.website)}" target="_blank" rel="noopener">Site</a>` : ""}
      ${c.mapsUrl ? `<a class="act" href="${esc(c.mapsUrl)}" target="_blank" rel="noopener">Carte</a>` : ""}
    </div>` : ""}
    ${c.lead ? `<div class="lead">${Object.entries(c.lead).map(([k, v]) => `<span><b>${esc(k)}</b> ${esc(v)}</span>`).join("")}</div>` : ""}
    <form id="c-form" class="sh__form">
      <div class="grid2">
        <label class="fld"><span>Statut</span><select name="status">${(Object.keys(STATUS) as Status[]).map((s) => `<option value="${s}" ${s === c.status ? "selected" : ""}>${STATUS[s]}</option>`).join("")}</select></label>
        ${f("nextActionAt", "Prochaine relance", "date")}
      </div>
      ${f("company", "Entreprise", "text", "required")}
      <div class="grid2">${f("name", "Interlocuteur")}${f("activity", "Activité")}</div>
      <div class="grid2">${f("phone", "Téléphone", "tel")}${f("email", "E-mail", "email")}</div>
      ${f("website", "Site internet", "url")}
      <div class="grid2">${f("address", "Adresse")}${f("city", "Ville")}</div>
      <div class="grid3">${f("formule", "Formule")}${f("value", "Montant création (€)", "number", 'min="0" step="1"')}${f("monthly", "Mensuel (€)", "number", 'min="0" step="1"')}</div>
      <label class="fld"><span>Notes</span><textarea name="notes" rows="3">${esc(c.notes)}</textarea></label>
      <div class="sh__save">
        <button class="btn" type="submit">${id ? "Enregistrer" : "Créer le contact"}</button>
        ${id ? `<button class="btn btn--ghost danger" type="button" id="c-del">Supprimer</button>` : ""}
      </div>
    </form>
    ${id ? `
    <section class="sh__sec" id="composer" hidden></section>
    <section class="sh__sec">
      <h3>Ajouter une note ou un appel</h3>
      <form id="log-form" class="logf">
        <select name="type"><option value="note">Note</option><option value="appel">Appel</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">E-mail</option></select>
        <input name="text" placeholder="Ex. : appelé, rappeler mardi" required />
        <select name="next"><option value="">Pas de relance</option><option value="${inDays(1)}">Relancer demain</option><option value="${inDays(3)}">Dans 3 jours</option><option value="${inDays(7)}">Dans 1 semaine</option><option value="${inDays(30)}">Dans 1 mois</option></select>
        <button class="btn btn--sm" type="submit">Ajouter</button>
      </form>
      <ol class="tl">${c.history.map((h) => `<li><span class="tl__t tl__t--${h.type}">${esc(HTYPE[h.type] || h.type)}</span><div><time>${dateTime(h.at)}</time>${h.subject ? `<strong>${esc(h.subject)}</strong>` : ""}<p>${esc(h.text)}</p></div></li>`).join("")}</ol>
    </section>` : ""}`;
  if (!sheet.open) sheet.showModal();
  $("#sheet-body").scrollTop = 0;

  $<HTMLFormElement>("#c-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target as HTMLFormElement).entries());
    try {
      if (id) {
        await api(`contacts/${id}`, { method: "PATCH", json: data });
        toast("Contact enregistré");
        openContact(id);
      } else {
        const r = await api("contacts", { method: "POST", json: { ...data, source: "manuel" } });
        toast(r.duplicates ? "Ce contact existe déjà" : "Contact créé");
        const nid = r.created[0]?.id;
        if (nid) { if (data.status && data.status !== "prospect") await api(`contacts/${nid}`, { method: "PATCH", json: data }); openContact(nid); }
      }
      refreshCurrent();
    } catch (err) { toast((err as Error).message, "err"); }
  });
  $("#c-del")?.addEventListener("click", async () => {
    if (!confirm(`Supprimer définitivement ${c.company} ?`)) return;
    await api(`contacts/${id}`, { method: "DELETE" });
    sheet.close();
    toast("Contact supprimé");
    refreshCurrent();
  });
  $("#log-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    await api(`contacts/${id}/log`, { method: "POST", json: { type: fd.get("type"), text: fd.get("text"), nextActionAt: fd.get("next") || undefined } });
    toast("Ajouté à l'historique");
    openContact(id);
    refreshCurrent();
  });
  $$("[data-compose]", $("#sheet-body")).forEach((b) => b.addEventListener("click", () => compose(c, b.dataset.compose as "email" | "whatsapp")));
  $$<HTMLAnchorElement>("[data-log=appel]", $("#sheet-body")).forEach((a) =>
    a.addEventListener("click", () => api(`contacts/${id}/log`, { method: "POST", json: { type: "appel", text: "Appel passé" } }).catch(() => {}))
  );
}
document.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest("[data-close]")) sheet.close(); });
function refreshCurrent() {
  const v = location.hash.slice(1);
  if (v === "contacts") loadContacts();
  if (v === "accueil" || !v) loadOverview();
}

// Rédaction d'un message pour un contact
async function compose(c: Contact, channel: "email" | "whatsapp") {
  const box = $("#composer");
  box.hidden = false;
  const tpls = state.templates.filter((t) => t.channel === channel);
  box.innerHTML = `
    <h3>${channel === "email" ? "E-mail" : "WhatsApp"} à ${esc(c.company)}</h3>
    <label class="fld"><span>Modèle</span><select id="cp-tpl"><option value="">Message libre</option>${tpls.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>
    ${channel === "email" ? `<label class="fld"><span>Objet</span><input id="cp-subject" /></label>` : ""}
    <label class="fld"><span>Message</span><textarea id="cp-body" rows="9"></textarea></label>
    <div class="btns">
      ${channel === "email"
        ? `${state.meta.features.email ? `<button class="btn" id="cp-send">Envoyer</button>` : ""}<button class="btn ${state.meta.features.email ? "btn--ghost" : ""}" id="cp-mailto">Ouvrir dans ma messagerie</button>`
        : `<button class="btn" id="cp-wa">Ouvrir WhatsApp</button>`}
    </div>
    <p class="muted small">${channel === "email" ? "Un lien de désinscription est ajouté automatiquement aux e-mails envoyés d'ici." : "WhatsApp s'ouvre avec le message prêt : il ne reste qu'à appuyer sur Envoyer."}</p>`;
  box.scrollIntoView({ behavior: "smooth", block: "start" });
  const applyTpl = async () => {
    const t = tpls.find((x) => x.id === $<HTMLSelectElement>("#cp-tpl").value);
    if (!t) return;
    const r = await api(`contacts/${c.id}/render`, { method: "POST", json: { subject: t.subject || "", body: t.body } });
    if ($("#cp-subject", box)) $<HTMLInputElement>("#cp-subject").value = r.subject;
    $<HTMLTextAreaElement>("#cp-body").value = r.body;
  };
  $("#cp-tpl").addEventListener("change", applyTpl);
  if (tpls[0]) { $<HTMLSelectElement>("#cp-tpl").value = tpls[0].id; applyTpl(); }
  const log = (type: string, text: string, subject?: string) =>
    api(`contacts/${c.id}/log`, { method: "POST", json: { type, text, subject, nextActionAt: c.nextActionAt || inDays(4) } });

  $("#cp-send")?.addEventListener("click", async (e) => {
    const b = e.target as HTMLButtonElement;
    b.disabled = true;
    try {
      const r = await api("send", { method: "POST", json: { contactIds: [c.id], subject: $<HTMLInputElement>("#cp-subject").value, body: $<HTMLTextAreaElement>("#cp-body").value } });
      if (r.sent) { toast("E-mail envoyé"); openContact(c.id); refreshCurrent(); }
      else toast(`Non envoyé : ${r.skipped[0]?.reason || "erreur"}`, "err");
    } catch (err) { toast((err as Error).message, "err"); } finally { b.disabled = false; }
  });
  $("#cp-mailto")?.addEventListener("click", async () => {
    const subject = $<HTMLInputElement>("#cp-subject").value;
    const body = $<HTMLTextAreaElement>("#cp-body").value;
    location.href = `mailto:${encodeURIComponent(c.email || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    await log("email", body, subject);
    setTimeout(() => { openContact(c.id); refreshCurrent(); }, 600);
  });
  $("#cp-wa")?.addEventListener("click", async () => {
    const body = $<HTMLTextAreaElement>("#cp-body").value;
    window.open(`https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
    await log("whatsapp", body);
    setTimeout(() => { openContact(c.id); refreshCurrent(); }, 600);
  });
}

// ---------------- Messages : modèles + campagne ----------------
async function loadTemplates() {
  state.templates = (await api("templates")).templates;
  $("#tpl-list").innerHTML = state.templates.map((t) => `<button class="row" data-tpl="${t.id}"><strong>${esc(t.name)}</strong><span>${t.channel === "email" ? "E-mail" : "WhatsApp"}${t.subject ? ` · ${esc(t.subject)}` : ""}</span></button>`).join("");
  $<HTMLSelectElement>("#cg-tpl").innerHTML = state.templates.filter((t) => t.channel === "email").map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("");
  fillCampaignFromTpl();
  if (!state.contacts.length) state.contacts = (await api("contacts")).contacts;
  updateCampaignCount();
  $("#cg-email-off").hidden = state.meta.features.email;
}
$("#tpl-list").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-tpl]");
  if (b) editTemplate(state.templates.find((t) => t.id === b.dataset.tpl));
});
$("#tpl-new").addEventListener("click", () => editTemplate());
function editTemplate(t?: Template) {
  const f = $<HTMLFormElement>("#tpl-form");
  f.hidden = false;
  f.dataset.id = t?.id || "";
  $<HTMLInputElement>("#t-name").value = t?.name || "";
  $<HTMLSelectElement>("#t-channel").value = t?.channel || "email";
  $<HTMLInputElement>("#t-subject").value = t?.subject || "";
  $<HTMLTextAreaElement>("#t-body").value = t?.body || "";
  $("#t-del").hidden = !t;
  f.scrollIntoView({ behavior: "smooth" });
}
$("#tpl-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target as HTMLFormElement;
  await api("templates", { method: "PUT", json: { id: f.dataset.id, name: $<HTMLInputElement>("#t-name").value, channel: $<HTMLSelectElement>("#t-channel").value, subject: $<HTMLInputElement>("#t-subject").value, body: $<HTMLTextAreaElement>("#t-body").value } });
  f.hidden = true;
  toast("Modèle enregistré");
  loadTemplates();
});
$("#t-del").addEventListener("click", async () => {
  const id = $("#tpl-form").dataset.id;
  if (!id || !confirm("Supprimer ce modèle ?")) return;
  await api(`templates/${id}`, { method: "DELETE" });
  $("#tpl-form").hidden = true;
  loadTemplates();
});
$("#t-cancel").addEventListener("click", () => ($("#tpl-form").hidden = true));

let campaignIds: string[] | null = null;
function prepareCampaign(ids: string[]) {
  campaignIds = ids;
  $<HTMLSelectElement>("#cg-target").value = "selection";
  updateCampaignCount();
  $("#campaign").scrollIntoView({ behavior: "smooth" });
}
function campaignTargets(): Contact[] {
  const target = $<HTMLSelectElement>("#cg-target").value;
  const ok = (c: Contact) => c.email && c.status !== "ne_plus_contacter";
  if (target === "selection") return state.contacts.filter((c) => campaignIds?.includes(c.id) && ok(c));
  if (target === "nouveaux") return state.contacts.filter((c) => c.status === "prospect" && ok(c) && !c.history.some((h) => h.type === "email"));
  if (target === "relance") return state.contacts.filter((c) => c.status === "contacte" && ok(c) && c.nextActionAt && c.nextActionAt <= today());
  if (target === "interesses") return state.contacts.filter((c) => ["interesse", "devis_envoye"].includes(c.status) && ok(c));
  return [];
}
function updateCampaignCount() {
  const n = campaignTargets().length;
  $("#cg-count").textContent = `${n} destinataire${n > 1 ? "s" : ""} avec e-mail`;
}
$("#cg-target").addEventListener("change", updateCampaignCount);
$("#cg-tpl").addEventListener("change", fillCampaignFromTpl);
function fillCampaignFromTpl() {
  const t = state.templates.find((x) => x.id === $<HTMLSelectElement>("#cg-tpl").value);
  if (!t) return;
  $<HTMLInputElement>("#cg-subject").value = t.subject || "";
  $<HTMLTextAreaElement>("#cg-body").value = t.body;
}
$("#campaign").addEventListener("submit", async (e) => {
  e.preventDefault();
  const targets = campaignTargets();
  if (!targets.length) { toast("Aucun destinataire avec e-mail", "err"); return; }
  if (!confirm(`Envoyer cet e-mail personnalisé à ${targets.length} contact${targets.length > 1 ? "s" : ""} ?`)) return;
  const btn = $<HTMLButtonElement>("#campaign button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Envoi en cours…";
  try {
    const r = await api("send", { method: "POST", json: { contactIds: targets.map((c) => c.id), subject: $<HTMLInputElement>("#cg-subject").value, body: $<HTMLTextAreaElement>("#cg-body").value } });
    $("#cg-report").innerHTML = `<p><strong>${r.sent}</strong> envoyé${r.sent > 1 ? "s" : ""}.</p>${r.skipped.length ? `<ul>${r.skipped.map((s: any) => `<li>${esc(s.company)} : ${esc(s.reason)}</li>`).join("")}</ul>` : ""}`;
    state.selected.clear();
    state.contacts = (await api("contacts")).contacts;
    updateCampaignCount();
  } catch (err) {
    toast((err as Error).message, "err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Envoyer la campagne";
  }
});

// ---------------- Réglages ----------------
async function loadSettings() {
  const { settings } = await api("settings");
  $<HTMLInputElement>("#st-sender").value = settings.senderName;
  $<HTMLTextAreaElement>("#st-signature").value = settings.signature;
  $<HTMLInputElement>("#st-limit").value = String(settings.dailyLimit);
  $("#st-email").textContent = state.meta.features.email ? "Activé" : "Non configuré";
  $("#st-email").className = state.meta.features.email ? "ok" : "off";
  $("#st-google").textContent = state.meta.features.google ? "Activé" : "Non configuré (facultatif)";
  $("#st-google").className = state.meta.features.google ? "ok" : "off";
}
$("#settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await api("settings", { method: "PUT", json: { senderName: $<HTMLInputElement>("#st-sender").value, signature: $<HTMLTextAreaElement>("#st-signature").value, dailyLimit: Number($<HTMLInputElement>("#st-limit").value) } });
  toast("Réglages enregistrés");
});

boot();
export {};
