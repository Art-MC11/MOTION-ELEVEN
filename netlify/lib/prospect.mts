// Recherche de prospects à partir de sources publiques.
// - Annuaire des entreprises (api.gouv.fr) : gratuit, officiel, entreprises actives par activité et commune.
// - OpenStreetMap (Overpass) : gratuit, téléphone / site web / e-mail souvent renseignés.
// - Google Places (facultatif) : le plus complet, nécessite GOOGLE_PLACES_API_KEY.
import { activityByKey, type Activity } from "../../src/data/activities.ts";
import { env } from "./shared.mts";

const UA = "MotionEleven-CRM/1.0 (+https://motion-eleven.fr)";

export type Prospect = {
  source: "osm" | "entreprises" | "google";
  sourceId: string;
  company: string;
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  hasWebsite: boolean | null;
  address?: string;
  postalCode?: string;
  city?: string;
  activity: string;
  siren?: string;
  createdOn?: string;
  rating?: number;
  ratingCount?: number;
  mapsUrl?: string;
};

export type Commune = { nom: string; code: string; codesPostaux: string[]; lat: number; lon: number };

export async function findCommune(query: string): Promise<Commune | null> {
  const q = query.trim();
  if (!q) return null;
  const url = /^\d{5}$/.test(q)
    ? `https://geo.api.gouv.fr/communes?codePostal=${q}&fields=nom,code,codesPostaux,centre,population&limit=5`
    : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux,centre,population&boost=population&limit=5`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Recherche de la commune impossible (${res.status})`);
  const list = (await res.json()) as any[];
  if (!list.length) return null;
  const best = list.sort((a, b) => (b.population || 0) - (a.population || 0))[0];
  return { nom: best.nom, code: best.code, codesPostaux: best.codesPostaux || [], lat: best.centre.coordinates[1], lon: best.centre.coordinates[0] };
}

// ---------- Annuaire des entreprises ----------
export async function searchEntreprises(act: Activity, commune: Commune, page = 1) {
  const params = new URLSearchParams({
    activite_principale: act.naf.join(","),
    code_commune: commune.code,
    etat_administratif: "A",
    per_page: "25",
    page: String(page),
  });
  const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?${params}`, { headers: { "User-Agent": UA } });
  if (res.status === 429) throw new Error("Annuaire des entreprises : trop de recherches, réessayez dans quelques secondes.");
  if (!res.ok) throw new Error(`Annuaire des entreprises indisponible (${res.status})`);
  const data = (await res.json()) as any;
  const results: Prospect[] = [];
  for (const r of data.results || []) {
    // Respect de l'opposition à l'utilisation commerciale des données
    if (r.opposition_diffusion_commerciale === true || r.statut_diffusion === "P") continue;
    const etab = (r.matching_etablissements || []).find((e: any) => e.code_postal && commune.codesPostaux.includes(e.code_postal)) || r.siege || {};
    const enseigne = (etab.liste_enseignes || r.siege?.liste_enseignes || [])[0];
    const dirigeant = (r.dirigeants || []).find((d: any) => d.type_dirigeant === "personne physique");
    results.push({
      source: "entreprises",
      sourceId: etab.siret || r.siren,
      company: titleCase(enseigne || r.nom_complet || r.nom_raison_sociale || "Entreprise"),
      name: dirigeant ? titleCase(`${(dirigeant.prenoms || "").split(" ")[0]} ${dirigeant.nom || ""}`.trim()) : undefined,
      hasWebsite: null,
      address: etab.adresse || r.siege?.adresse,
      postalCode: etab.code_postal,
      city: etab.libelle_commune ? titleCase(etab.libelle_commune) : commune.nom,
      activity: act.label,
      siren: r.siren,
      createdOn: etab.date_creation || r.date_creation,
    });
  }
  results.sort((a, b) => (b.createdOn || "").localeCompare(a.createdOn || ""));
  return { results, total: data.total_results ?? results.length, hasMore: page < (data.total_pages || 1) };
}

// ---------- OpenStreetMap ----------
export async function searchOsm(act: Activity, commune: Commune, radiusKm = 5) {
  const r = Math.round(Math.min(Math.max(radiusKm, 1), 20) * 1000);
  const parts = act.osm.map((f) => `nwr${f}["name"](around:${r},${commune.lat},${commune.lon});`).join("");
  const query = `[out:json][timeout:25];(${parts});out center tags 300;`;
  const endpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
  let data: any = null;
  let lastErr = "";
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(28000),
      });
      if (res.ok) { data = await res.json(); break; }
      lastErr = `OpenStreetMap ${res.status}`;
    } catch (e) {
      lastErr = (e as Error).message;
    }
  }
  if (!data) throw new Error(`OpenStreetMap indisponible (${lastErr}). Réessayez dans un instant.`);
  const results: Prospect[] = (data.elements || []).map((el: any) => {
    const t = el.tags || {};
    const website = t.website || t["contact:website"] || t.url || "";
    const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
    return {
      source: "osm",
      sourceId: `${el.type}/${el.id}`,
      company: t.name,
      phone: t.phone || t["contact:phone"] || t["contact:mobile"] || undefined,
      email: t.email || t["contact:email"] || undefined,
      website: website || undefined,
      hasWebsite: Boolean(website),
      address: [street, t["addr:postcode"], t["addr:city"]].filter(Boolean).join(" ") || undefined,
      postalCode: t["addr:postcode"],
      city: t["addr:city"] || commune.nom,
      activity: act.label,
      mapsUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    } as Prospect;
  });
  // Les entreprises sans site d'abord, puis celles qui ont un téléphone
  results.sort((a, b) => Number(a.hasWebsite) - Number(b.hasWebsite) || Number(Boolean(b.phone)) - Number(Boolean(a.phone)));
  return { results, total: results.length, hasMore: false };
}

// ---------- Google Places (facultatif) ----------
export const googleReady = () => Boolean(env("GOOGLE_PLACES_API_KEY"));

export async function searchGoogle(act: Activity, commune: Commune, pageToken?: string) {
  const key = env("GOOGLE_PLACES_API_KEY");
  if (!key) throw new Error("Ajoutez GOOGLE_PLACES_API_KEY dans Netlify pour utiliser Google Maps.");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus,nextPageToken",
    },
    body: JSON.stringify({
      textQuery: `${act.label} ${commune.nom} ${commune.codesPostaux[0] || ""}`.trim(),
      languageCode: "fr",
      regionCode: "FR",
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Google Places ${res.status} : vérifiez la clé et l'activation de « Places API (New) ».`);
  const data = (await res.json()) as any;
  const results: Prospect[] = (data.places || [])
    .filter((p: any) => p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p: any) => ({
      source: "google",
      sourceId: p.id,
      company: p.displayName?.text || "Entreprise",
      phone: p.nationalPhoneNumber,
      website: p.websiteUri,
      hasWebsite: Boolean(p.websiteUri),
      address: p.formattedAddress,
      city: commune.nom,
      activity: act.label,
      rating: p.rating,
      ratingCount: p.userRatingCount,
      mapsUrl: p.googleMapsUri,
    }));
  results.sort((a, b) => Number(a.hasWebsite) - Number(b.hasWebsite) || (b.ratingCount || 0) - (a.ratingCount || 0));
  return { results, total: results.length, hasMore: Boolean(data.nextPageToken), nextPageToken: data.nextPageToken as string | undefined };
}

export function getActivity(key: string) {
  const a = activityByKey(key);
  if (!a) throw new Error("Activité inconnue");
  return a;
}

function titleCase(s: string) {
  if (!s) return s;
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
}
