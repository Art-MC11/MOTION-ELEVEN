// Envoi des formulaires de prospects.
// 1) Netlify Forms (enregistrement garanti, visible dans le tableau de bord Netlify)
// 2) /api/lead (Supabase + e-mail Resend, dès que les clés sont configurées)

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
    const next = form.dataset.next || "/merci/";
    location.href = `${next}?type=${encodeURIComponent(type)}`;
  });
});

// Pré-remplissage depuis l'URL (?formule=business&projet=restaurant)
const params = new URLSearchParams(location.search);
const formule = params.get("formule");
const projet = params.get("projet");
const mapProjet: Record<string, string> = {
  "creation-site-internet": "Site vitrine ou professionnel",
  "e-commerce": "Boutique en ligne",
  "automatisation-ia": "Automatisation ou IA",
  "motion-design": "Motion design ou vidéo",
  restaurants: "Site vitrine ou professionnel",
  restaurant: "Site vitrine ou professionnel",
  artisans: "Site vitrine ou professionnel",
  commerces: "Boutique en ligne",
  reservation: "Réservation ou prise de rendez-vous",
  "sur-mesure": "Projet sur mesure",
};
const mapSecteur: Record<string, string> = {
  restaurants: "Restaurant", restaurant: "Restaurant", artisans: "Artisan", commerces: "Commerce",
};
const mapFormule: Record<string, string> = {
  starter: "Site vitrine ou professionnel",
  business: "Site vitrine ou professionnel",
  ecommerce: "Boutique en ligne",
};
function check(name: string, value?: string) {
  if (!value) return;
  const input = document.querySelector<HTMLInputElement>(`[data-lead-form] input[name="${name}"][value="${CSS.escape(value)}"]`);
  if (input) input.checked = true;
}
check("project_type", (projet && mapProjet[projet]) || (formule ? mapFormule[formule] : undefined));
check("sector", projet ? mapSecteur[projet] : undefined);
const formuleField = document.querySelector<HTMLInputElement>("[data-lead-form] input[name=formule]");
if (formuleField && formule) formuleField.value = formule;
const formuleNote = document.querySelector<HTMLElement>("[data-formule-note]");
if (formuleNote && formule) {
  const names: Record<string, string> = { starter: "Starter", business: "Business", ecommerce: "E-commerce" };
  if (names[formule]) { formuleNote.textContent = `Formule choisie : ${names[formule]}. Nous adaptons la proposition à votre projet.`; formuleNote.hidden = false; }
}

export {};
