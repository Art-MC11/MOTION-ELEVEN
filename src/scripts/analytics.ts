// Mesure : GA4 (après consentement) + dataLayer.
// Évènements : cta_click, whatsapp_click, phone_click, email_click,
// generate_lead, book_appointment, begin_checkout, purchase.

type Params = Record<string, string | number | undefined>;
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    meTrack: (event: string, params?: Params) => void;
  }
}

const KEY = "me-consent";
const gaId = document.body.dataset.ga || "";
window.dataLayer = window.dataLayer || [];

function readConsent(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
function saveConsent(v: string) {
  try { localStorage.setItem(KEY, v); } catch { /* stockage indisponible */ }
}

let gaLoaded = false;
function loadGA() {
  if (!gaId || gaLoaded) return;
  gaLoaded = true;
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    analytics_storage: "granted",
  });
  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(s);
}

window.meTrack = (event, params = {}) => {
  window.dataLayer.push({ event, ...params });
  if (window.gtag) window.gtag("event", event, params);
};

// Consentement
const banner = document.querySelector<HTMLElement>("[data-cookie]");
if (gaId) {
  const c = readConsent();
  if (c === "granted") loadGA();
  else if (c === null && banner) banner.hidden = false;
}
banner?.querySelectorAll<HTMLButtonElement>("[data-consent]").forEach((b) =>
  b.addEventListener("click", () => {
    const v = b.dataset.consent!;
    saveConsent(v);
    banner.hidden = true;
    if (v === "granted") loadGA();
  })
);
document.querySelectorAll("[data-cookie-settings]").forEach((b) =>
  b.addEventListener("click", () => {
    if (!gaId) { alertless(); return; }
    if (banner) banner.hidden = false;
  })
);
function alertless() {
  // Pas de mesure d'audience active : on l'indique sans fenêtre bloquante.
  const el = document.querySelector("[data-cookie-settings]");
  if (el) el.textContent = "Aucun cookie de mesure";
}

// Suivi des clics (délégation)
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest<HTMLElement>("a, button");
  if (!a) return;
  const href = a.getAttribute("href") || "";
  const label = a.dataset.label || a.textContent?.trim().slice(0, 60);
  const page = location.pathname;
  if (a.dataset.track) window.meTrack(a.dataset.track, { label, page });
  else if (href.startsWith("https://wa.me")) window.meTrack("whatsapp_click", { label, page });
  if (href.startsWith("tel:")) window.meTrack("phone_click", { label, page });
  if (href.startsWith("mailto:")) window.meTrack("email_click", { label, page });
});

export {};
