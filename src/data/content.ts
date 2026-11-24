// Contenus partagés : pôles de services, offres, réalisations, FAQ, avis.

export const poles = [
  {
    key: "web",
    title: "Web design & développement",
    href: "/creation-site-internet/",
    promise: "Un site qui inspire confiance dès la première seconde et transforme les visites en demandes.",
    items: ["Sites vitrines et professionnels", "Refonte de sites", "Sites institutionnels", "Landing pages", "Responsive design", "SEO technique"],
  },
  {
    key: "shop",
    title: "E-commerce & digital business",
    href: "/e-commerce/",
    promise: "Vendre, encaisser et réserver en ligne, sans dépendre d'une plateforme qui prend une commission.",
    items: ["Boutiques en ligne", "Catalogue de produits", "Paiements Stripe", "Réservations et prise de rendez-vous", "Gestion des commandes", "Bases de données et espaces administrateurs"],
  },
  {
    key: "auto",
    title: "Automatisation & IA",
    href: "/automatisation-ia/",
    promise: "Les tâches répétitives se font seules : vous gagnez des heures chaque semaine et ne perdez plus un prospect.",
    items: ["Automatisation de processus", "Agents IA", "Automatisation commerciale", "CRM", "Formulaires intelligents et notifications", "Intégrations API"],
  },
  {
    key: "motion",
    title: "Creative & motion design",
    href: "/motion-design/",
    promise: "Une image de marque qui se remarque, et des vidéos qui arrêtent le défilement.",
    items: ["Motion design", "Vidéos publicitaires", "Identité visuelle", "Direction artistique", "Création de contenus digitaux"],
  },
] as const;

export type OfferKey = "starter" | "business" | "ecommerce";

export const offers: {
  key: OfferKey;
  name: string;
  setup: number;
  monthly: number;
  forWho: string;
  delay: string;
  included: string[];
  limits: string[];
  featured?: boolean;
}[] = [
  {
    key: "starter",
    name: "Starter",
    setup: 590,
    monthly: 39,
    forWho: "Indépendants et artisans qui veulent une présence professionnelle rapidement.",
    delay: "Mise en ligne en 2 semaines environ",
    included: [
      "Site jusqu'à 3 pages (ou une page longue)",
      "Design personnalisé à vos couleurs, sans template reconnaissable",
      "Adapté mobile, tablette et ordinateur",
      "Formulaire de contact et bouton WhatsApp",
      "Référencement de base : titres, descriptions, sitemap, Google Search Console",
      "Hébergement, certificat SSL et nom de domaine inclus",
      "1 modification par mois (jusqu'à 30 min)",
    ],
    limits: [
      "Textes et photos fournis par vous",
      "1 aller-retour de corrections sur la maquette",
    ],
  },
  {
    key: "business",
    name: "Business",
    setup: 990,
    monthly: 59,
    forWho: "TPE, restaurants et commerces qui veulent générer des demandes chaque semaine.",
    delay: "Mise en ligne en 3 à 4 semaines",
    featured: true,
    included: [
      "Site jusqu'à 7 pages",
      "Textes rédigés ou retravaillés pour convertir",
      "Formulaire de devis détaillé avec notification instantanée",
      "Prise de rendez-vous ou réservation simple",
      "SEO local : pages optimisées, données structurées, fiche Google Business",
      "Mesure d'audience (Google Analytics) et suivi des demandes",
      "Hébergement, SSL, nom de domaine, sauvegardes",
      "2 modifications par mois (jusqu'à 1 h au total)",
    ],
    limits: [
      "Photos fournies par vous (shooting en option)",
      "2 allers-retours de corrections sur la maquette",
    ],
  },
  {
    key: "ecommerce",
    name: "E-commerce",
    setup: 1490,
    monthly: 79,
    forWho: "Commerces et marques qui veulent vendre ou encaisser en ligne.",
    delay: "Mise en ligne en 4 à 6 semaines",
    included: [
      "Boutique complète avec jusqu'à 30 produits intégrés",
      "Paiement par carte, Apple Pay et Google Pay via Stripe",
      "Gestion des commandes, des stocks et des livraisons ou du retrait",
      "E-mails de confirmation automatiques",
      "Espace administrateur pour gérer vos produits",
      "Pages légales structurées (CGV, mentions, confidentialité)",
      "Hébergement, SSL, nom de domaine, sauvegardes",
      "2 modifications par mois (jusqu'à 1 h au total)",
    ],
    limits: [
      "Fiches produits au-delà de 30 : sur devis",
      "Frais de transaction Stripe à votre charge, selon la grille Stripe en vigueur",
    ],
  },
];

export const options = [
  { name: "Vidéo promo en motion design (15 à 30 s)", price: "250 €" },
  { name: "Animation de logo", price: "150 €" },
  { name: "Pack de 5 visuels pour les réseaux sociaux", price: "150 €" },
  { name: "3 Reels ou TikTok au format vertical", price: "180 €" },
  { name: "Design de flyer (print et digital)", price: "100 €" },
  { name: "Automatisation WhatsApp, e-mail ou CRM", price: "à partir de 200 €" },
];

export const subscriptionTerms = {
  included: [
    "Hébergement rapide et sécurisé, certificat SSL",
    "Nom de domaine (.fr ou .com) renouvelé chaque année",
    "Mises à jour techniques et de sécurité",
    "Sauvegardes et surveillance de la disponibilité",
    "Support par e-mail et WhatsApp, réponse sous 48 h ouvrées",
    "Le quota mensuel de modifications de votre formule",
  ],
  excluded: [
    "Nouvelles pages ou nouvelles fonctionnalités (sur devis)",
    "Refonte graphique complète",
    "Création de contenus : photos, vidéos, rédaction de nouveaux textes",
  ],
  rules: [
    "Engagement de 12 mois à compter de la mise en ligne, puis abonnement mensuel résiliable avec un mois de préavis.",
    "Le premier mois d'abonnement est facturé à la mise en ligne, pas avant.",
    "Les modifications mensuelles non utilisées ne se reportent pas sur le mois suivant.",
    "Le nom de domaine est enregistré à votre nom. Vos textes, images et données vous appartiennent.",
  ],
};

export type Project = {
  slug: string;
  name: string;
  url: string;
  urlLabel: string;
  sector: string;
  type: string;
  summary: string;
  context: string;
  problem: string;
  solution: string;
  features: string[];
  stack: string[];
  image?: string; // capture réelle : /images/realisations/<slug>.jpg
};

export const projects: Project[] = [
  {
    slug: "la-photo-minute",
    name: "La Photo Minute",
    url: "https://photobooth-paris.com",
    urlLabel: "photobooth-paris.com",
    sector: "Événementiel",
    type: "Site vitrine premium avec réservation et acompte en ligne",
    summary: "Location de borne photo à Paris et en Île-de-France : le client choisit sa date, sa formule et paie son acompte sans quitter le site.",
    context: "La Photo Minute loue une borne photo pour les mariages, anniversaires, Bar et Bat Mitzvah, Brit Milah et événements d'entreprise, à Paris et en Île-de-France.",
    problem: "Les demandes arrivaient par messages, sans date ni formule précise. Chaque réservation demandait plusieurs échanges avant d'être confirmée, et rien ne garantissait l'engagement du client.",
    solution: "Un parcours de réservation en cinq étapes : type d'événement, date et lieu, formule, options, coordonnées. Le client voit les dates libres, obtient un récapitulatif chiffré et règle un acompte de 30 % en ligne. La date est ensuite vérifiée et confirmée.",
    features: [
      "Calendrier des disponibilités (dates libres ou déjà réservées)",
      "Trois formules claires : Éclat, Signature et Prestige",
      "Options ajoutées au récapitulatif en temps réel",
      "Paiement de l'acompte de 30 % par Stripe",
      "Conditions d'annulation affichées avant paiement",
      "Avis Google et FAQ pour lever les dernières hésitations",
    ],
    stack: ["Site sur mesure", "Stripe", "Netlify"],
  },
];

export const faq = [
  {
    q: "Combien coûte un site internet ?",
    a: "Nos formules commencent à 590 € de création puis 39 € par mois (Starter). La formule Business est à 990 € puis 59 € par mois, la formule E-commerce à 1 490 € puis 79 € par mois. L'abonnement couvre l'hébergement, le nom de domaine, la sécurité et un quota de modifications. Les projets sur mesure font l'objet d'un devis gratuit.",
  },
  {
    q: "Combien de temps faut-il pour créer un site ?",
    a: "Comptez environ 2 semaines pour un site Starter, 3 à 4 semaines pour un site Business et 4 à 6 semaines pour une boutique en ligne. Le délai démarre quand nous avons reçu vos textes, photos et accès.",
  },
  {
    q: "Puis-je modifier mon site ?",
    a: "Oui. Chaque formule inclut des modifications mensuelles réalisées par nos soins (30 minutes en Starter, 1 heure en Business et E-commerce). Pour une boutique, vous gérez vous-même vos produits depuis l'espace administrateur. Les évolutions plus importantes font l'objet d'un devis.",
  },
  {
    q: "Le paiement en ligne est-il possible ?",
    a: "Oui. Nous intégrons Stripe pour accepter la carte bancaire, Apple Pay et Google Pay, que ce soit pour une boutique, un acompte de réservation ou une prestation. L'argent est versé directement sur votre compte bancaire.",
  },
  {
    q: "Le site m'appartient-il ?",
    a: "Le nom de domaine est enregistré à votre nom, et vos textes, images et données vous appartiennent. À la fin de la période d'engagement de 12 mois, vous pouvez arrêter l'abonnement et récupérer les fichiers de votre site.",
  },
  {
    q: "Proposez-vous une maintenance ?",
    a: "Elle est incluse dans l'abonnement : hébergement, mises à jour de sécurité, sauvegardes, surveillance et support par e-mail et WhatsApp avec une réponse sous 48 heures ouvrées.",
  },
];

// Avis clients authentiques uniquement. La section s'affiche dès qu'un avis est ajouté.
// Exemple : { name: "Prénom N.", company: "Entreprise", text: "…", source: "Google" }
export const testimonials: { name: string; company: string; text: string; source?: string }[] = [];

export const sectors = [
  { label: "Restaurants", href: "/solutions/restaurants/", text: "Menu en ligne, commande à emporter, réservation de table." },
  { label: "Artisans", href: "/solutions/artisans/", text: "Demandes de devis avec photos, zone d'intervention, réalisations." },
  { label: "Commerces", href: "/solutions/commerces/", text: "Click & collect, catalogue, horaires et itinéraire." },
  { label: "Indépendants", href: "/creation-site-internet/", text: "Un site crédible, une prise de rendez-vous, un paiement en ligne." },
  { label: "Entreprises", href: "/services/", text: "Refonte, outils internes, automatisations et CRM." },
];

// Modèles de sites (démos en ligne sur /modeles/<slug>/)
export const models = [
  {
    slug: "restaurant",
    name: "Braise & Bun",
    niche: "Restaurant",
    secteur: "restaurant",
    summary: "Un site de restaurant prêt à vendre : menu avec photos, commande en ligne, réservation de table et espace de gestion pour le restaurateur.",
    features: [
      "Menu en ligne avec photos et prix",
      "Commande à emporter ou en livraison",
      "Réservation de table",
      "Avis clients, galerie, plan d'accès",
      "Espace gérant : commandes, réservations, statistiques",
    ],
    desktop: "/images/modeles/restaurant-desktop.jpg",
    mobile: "/images/modeles/restaurant-mobile.jpg",
  },
];
