import { projectOptions, sectorOptions } from "../data/funnel";
// Envoi des formulaires de prospects.
// 1) Netlify Forms (enregistrement garanti, visible dans le tableau de bord Netlify)
// 2) /api/lead (CRM de l'espace admin + e-mail Resend si configuré)

const encode = (data: Record<string, string>) =>
  Object.entries(data).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");

function collect(form: HTMLFormElement): Record<string, string> {
  const fd = new FormData(form);
  const out: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v !== "string") return;
    out[k] = out[k] ? `${out[k]}, ${v}` : v;
  });
  return out;
}

function utm(): Record<string, string> {
  const p = new URLSearchParams(location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "gclid"];
  const stored = (() => { try { return JSON.parse(sessionStorage.getItem("me-utm") || "{}"); } catch { return {}; } })();
  keys.forEach((k) => { const v = p.get(k); if (v) stored[k] = v; });
  try { sessionStorage.setItem("me-utm", JSON.stringify(stored)); } catch { /* */ }
  return stored;
}
const utmData = utm();

function showError(form: HTMLFormElement, msg: string) {
  const box = form.querySelector<HTMLElement>("[data-form-error]");
  if (box) { box.textContent = msg; box.hidden = false; box.focus(); }
}

document.querySelectorAll<HTMLFormElement>("form[data-lead-form]").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = form.querySelector<HTMLElement>("[data-form-error]");
    if (err) err.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const btn = form.querySelector<HTMLButtonElement>("button[type=submit]");
    const label = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = "Envoi en cours…"; }

    const data = collect(form);
    data.page = location.pathname + location.search;
    if (Object.keys(utmData).length) data.utm = JSON.stringify(utmData);

    let netlifyOk = false;
    let apiOk = false;
    try {
      const r = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode(data),
      });
      netlifyOk = r.ok;
    } catch { /* réseau */ }
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      apiOk = r.ok;
    } catch { /* fonction indisponible */ }

    if (!netlifyOk && !apiOk) {
      if (btn) { btn.disabled = false; btn.textContent = label ?? "Envoyer"; }
      showError(form, "L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez, ou écrivez-nous directement sur WhatsApp.");
      return;
    }

    const type = data["form-name"];
    window.meTrack?.(type === "rendez-vous" ? "book_appointment" : "generate_lead", {
      form: type,
      project_type: data.project_type,
      budget: data.budget,
    });
    if (form.dataset.inline !== undefined) {
      form.dispatchEvent(new CustomEvent("lead:sent"));
      return;
    }
    const next = form.dataset.next || "/merci/";
    location.href = `${next}?type=${encodeURIComponent(type)}`;
  });
});

// Pré-remplissage depuis l'URL (?projet=e-commerce&secteur=restaurant&formule=business)
const params = new URLSearchParams(location.search);
const formule = params.get("formule");
const projet = params.get("projet");
const secteur = params.get("secteur");
const projetLabels: Record<string, string> = Object.fromEntries(projectOptions.map((o) => [o.key, o.label]));
Object.assign(projetLabels, {
  "sur-mesure": "Projet sur mesure",
  restaurants: projetLabels["creation-site-internet"],
  artisans: projetLabels["creation-site-internet"],
  commerces: projetLabels["e-commerce"],
});
const secteurLabels: Record<string, string> = Object.fromEntries(sectorOptions.map((o) => [o.key, o.label]));
Object.assign(secteurLabels, { restaurants: "Restaurant", artisans: "Artisan", commerces: "Commerce" });
const formuleProjet: Record<string, string> = {
  starter: projetLabels["creation-site-internet"],
  business: projetLabels["creation-site-internet"],
  ecommerce: projetLabels["e-commerce"],
};
function check(name: string, value?: string) {
  if (!value) return;
  const input = document.querySelector<HTMLInputElement>(`[data-lead-form] input[name="${name}"][value="${CSS.escape(value)}"]`);
  if (input) input.checked = true;
}
check("project_type", (projet && projetLabels[projet]) || (formule ? formuleProjet[formule] : undefined));
check("sector", (secteur && secteurLabels[secteur]) || (projet ? secteurLabels[projet] : undefined));
const formuleField = document.querySelector<HTMLInputElement>("[data-lead-form] input[name=formule]");
if (formuleField && formule) formuleField.value = formule;
const formuleNote = document.querySelector<HTMLElement>("[data-formule-note]");
if (formuleNote && formule) {
  const names: Record<string, string> = { starter: "Starter", business: "Business", ecommerce: "E-commerce" };
  if (names[formule]) { formuleNote.textContent = `Formule choisie : ${names[formule]}.`; formuleNote.hidden = false; }
}

export {};
