// Informations centrales de Motion Eleven — à modifier ici uniquement.
export const site = {
  name: "Motion Eleven",
  legalName: "Motion Eleven — Meir Cohen (entrepreneur individuel)",
  tagline: "Digital Agency & Technology",
  signature: "Nous créons les solutions digitales qui font avancer votre entreprise.",
  signatureEn: "We build what moves your business forward.",
  url: "https://motion-eleven.fr",
  email: "cohenmeir91@gmail.com",
  phone: "+33 6 86 69 46 14",
  phoneHref: "tel:+33686694614",
  whatsapp: "33686694614",
  siret: "993 799 311 00010",
  founder: "Meir Cohen",
  address: {
    street: "18 rue des Paradis",
    postalCode: "95410",
    city: "Groslay",
    region: "Île-de-France",
    country: "FR",
  },
  area: "Paris et toute l'Île-de-France",
  responseTime: "Réponse sous 24 h ouvrées",
  instagram: "https://www.instagram.com/motion_eleven/",
  linkedin: "https://fr.linkedin.com/in/meir-cohen-23b851211",
  portfolioMotion: "https://motion-eleven.framer.website/",
  // Variables d'environnement Netlify (build) — laissées vides = désactivé
  gaId: import.meta.env.PUBLIC_GA_ID ?? "",
  gscVerification: import.meta.env.PUBLIC_GSC_VERIFICATION ?? "",
  calUrl: import.meta.env.PUBLIC_CAL_URL ?? "",
};

export const whatsappLink = (text = "Bonjour Motion Eleven, je souhaite parler de mon projet.") =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

export const zones = [
  { slug: "paris", city: "Paris", label: "Paris", href: "/creation-site-internet-paris/" },
  { slug: "sarcelles", city: "Sarcelles", label: "Sarcelles", href: "/creation-site-internet-sarcelles/" },
  { slug: "montmorency", city: "Montmorency", label: "Montmorency", href: "/creation-site-internet-montmorency/" },
];

export const nav = [
  {
    label: "Services",
    href: "/services/",
    children: [
      { label: "Création de sites internet", href: "/creation-site-internet/", desc: "Vitrines, refontes, landing pages" },
      { label: "E-commerce", href: "/e-commerce/", desc: "Boutiques, paiements, réservations" },
      { label: "Automatisation & IA", href: "/automatisation-ia/", desc: "CRM, agents IA, intégrations" },
      { label: "Motion design", href: "/motion-design/", desc: "Vidéos, logos animés, identité" },
    ],
  },
  {
    label: "Solutions",
    href: "/solutions/restaurants/",
    children: [
      { label: "Restaurants", href: "/solutions/restaurants/", desc: "Menu, commande, réservation" },
      { label: "Artisans", href: "/solutions/artisans/", desc: "Devis, chantiers, zone d'intervention" },
      { label: "Commerces", href: "/solutions/commerces/", desc: "Click & collect, catalogue, boutique" },
    ],
  },
  {
    label: "Zones",
    href: "/creation-site-internet-paris/",
    children: [
      { label: "Paris", href: "/creation-site-internet-paris/", desc: "Création de site internet à Paris" },
      { label: "Sarcelles", href: "/creation-site-internet-sarcelles/", desc: "Création de site internet à Sarcelles" },
      { label: "Montmorency", href: "/creation-site-internet-montmorency/", desc: "Création de site internet à Montmorency" },
    ],
  },
  { label: "Modèles", href: "/modeles/" },
  { label: "Réalisations", href: "/realisations/" },
  { label: "Tarifs", href: "/tarifs/" },
];
