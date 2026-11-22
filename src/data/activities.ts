// Activités ciblées par la prospection.
// osm : filtres OpenStreetMap ; naf : codes NAF/APE (annuaire des entreprises) ; article : pour les messages.
export type Activity = { key: string; label: string; un: string; osm: string[]; naf: string[] };

export const activities: Activity[] = [
  { key: "restaurant", label: "Restaurants", un: "un restaurant", osm: ['["amenity"~"^(restaurant|fast_food)$"]'], naf: ["56.10A", "56.10C"] },
  { key: "cafe", label: "Cafés, bars", un: "un café", osm: ['["amenity"~"^(cafe|bar|pub)$"]'], naf: ["56.30Z"] },
  { key: "boulangerie", label: "Boulangeries, pâtisseries", un: "une boulangerie", osm: ['["shop"~"^(bakery|pastry)$"]'], naf: ["10.71C", "10.71D"] },
  { key: "traiteur", label: "Traiteurs", un: "un traiteur", osm: ['["craft"="caterer"]', '["shop"="deli"]'], naf: ["56.21Z"] },
  { key: "coiffeur", label: "Coiffeurs, barbiers", un: "un coiffeur", osm: ['["shop"="hairdresser"]'], naf: ["96.02A"] },
  { key: "beaute", label: "Instituts de beauté, ongleries", un: "un institut", osm: ['["shop"~"^(beauty|cosmetics)$"]'], naf: ["96.02B"] },
  { key: "plombier", label: "Plombiers, chauffagistes", un: "un plombier", osm: ['["craft"~"^(plumber|hvac)$"]'], naf: ["43.22A", "43.22B"] },
  { key: "electricien", label: "Électriciens", un: "un électricien", osm: ['["craft"="electrician"]'], naf: ["43.21A"] },
  { key: "menuisier", label: "Menuisiers", un: "un menuisier", osm: ['["craft"~"^(carpenter|joiner)$"]'], naf: ["43.32A"] },
  { key: "peintre", label: "Peintres en bâtiment", un: "un peintre", osm: ['["craft"="painter"]'], naf: ["43.34Z"] },
  { key: "macon", label: "Maçons, rénovation", un: "un artisan du bâtiment", osm: ['["craft"~"^(builder|tiler|roofer)$"]'], naf: ["43.99C", "43.31Z", "43.33Z"] },
  { key: "garage", label: "Garages automobiles", un: "un garage", osm: ['["shop"~"^(car_repair|tyres)$"]'], naf: ["45.20A"] },
  { key: "fleuriste", label: "Fleuristes", un: "un fleuriste", osm: ['["shop"="florist"]'], naf: ["47.76Z"] },
  { key: "vetements", label: "Boutiques de vêtements", un: "une boutique", osm: ['["shop"~"^(clothes|shoes|boutique)$"]'], naf: ["47.71Z", "47.72A"] },
  { key: "alimentation", label: "Épiceries, boucheries, primeurs", un: "un commerce de bouche", osm: ['["shop"~"^(convenience|butcher|greengrocer|deli|cheese|wine)$"]'], naf: ["47.11B", "47.22Z", "47.21Z", "47.25Z"] },
  { key: "photographe", label: "Photographes", un: "un photographe", osm: ['["shop"="photo"]', '["craft"="photographer"]'], naf: ["74.20Z"] },
  { key: "immobilier", label: "Agences immobilières", un: "une agence immobilière", osm: ['["office"="estate_agent"]', '["shop"="estate_agent"]'], naf: ["68.31Z"] },
  { key: "sport", label: "Salles de sport, coachs", un: "une salle de sport", osm: ['["leisure"="fitness_centre"]'], naf: ["93.13Z"] },
  { key: "auto-ecole", label: "Auto-écoles", un: "une auto-école", osm: ['["amenity"="driving_school"]'], naf: ["85.53Z"] },
  { key: "hotel", label: "Hôtels", un: "un hôtel", osm: ['["tourism"~"^(hotel|guest_house)$"]'], naf: ["55.10Z"] },
  { key: "comptable", label: "Experts-comptables", un: "un cabinet", osm: ['["office"="accountant"]'], naf: ["69.20Z"] },
  { key: "evenementiel", label: "Événementiel, DJ, location de salle", un: "une entreprise événementielle", osm: ['["amenity"="events_venue"]'], naf: ["90.01Z", "93.29Z", "82.30Z"] },
];

export const activityByKey = (k: string) => activities.find((a) => a.key === k);
