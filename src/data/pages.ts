// Contenu des pages services et des pages métiers.
// Chaque page a un angle, des problèmes et des fonctionnalités propres.

export type Block = { t: string; d: string };
export type PageData = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  crumbs: { name: string; href: string }[];
  kicker: string;
  title: string;
  lede: string;
  visual: { pole?: "web" | "shop" | "auto" | "motion"; project?: string };
  problemsTitle: string;
  problems: Block[];
  buildTitle: string;
  build: { group: string; items: string[] }[];
  fit?: string[];
  project?: string;
  offerTitle: string;
  offerText: string;
  offerKey?: "starter" | "business" | "ecommerce";
  faq: { q: string; a: string }[];
  serviceType: string;
  ctaTitle?: string;
};

export const pages: Record<string, PageData> = {
  "creation-site-internet": {
    slug: "creation-site-internet",
    seoTitle: "Création de site internet professionnel en Île-de-France | Motion Eleven",
    seoDescription: "Création et refonte de sites internet sur mesure pour entreprises, artisans et indépendants en Île-de-France. Design premium, mobile, SEO. Dès 590 €.",
    crumbs: [{ name: "Services", href: "/services/" }, { name: "Création de sites internet", href: "/creation-site-internet/" }],
    kicker: "Création de sites internet",
    title: "Un site internet qui travaille pour vous, même quand vous êtes sur le terrain.",
    lede: "Sites vitrines, sites professionnels, refontes et landing pages : nous concevons des sites rapides, crédibles et pensés pour transformer les visiteurs en demandes de devis.",
    visual: { pole: "web" },
    problemsTitle: "Ce qu'un bon site change pour votre entreprise",
    problems: [
      { t: "On vous fait confiance avant même de vous appeler", d: "Vos futurs clients comparent en ligne. Un site soigné, clair et à jour rassure et vous distingue des concurrents qui n'ont qu'une page Facebook." },
      { t: "Les demandes arrivent qualifiées", d: "Un formulaire bien pensé vous transmet le besoin, le budget et le délai. Vous rappelez des prospects sérieux, pas des curieux." },
      { t: "On vous trouve sur Google", d: "Structure, vitesse, balises, données structurées : le référencement technique est intégré dès la conception, pas ajouté après coup." },
    ],
    buildTitle: "Ce que nous construisons",
    build: [
      { group: "Types de sites", items: ["Site vitrine d'une à plusieurs pages", "Site professionnel et institutionnel", "Refonte d'un site existant, en conservant votre référencement", "Landing page pour une campagne ou une offre"] },
      { group: "Inclus dans chaque site", items: ["Design sur mesure, sans template reconnaissable", "Version mobile soignée en priorité", "Formulaire de contact ou de devis, bouton WhatsApp", "SEO technique : titres, descriptions, sitemap, balisage", "Hébergement rapide et certificat SSL", "Mesure d'audience respectueuse du RGPD"] },
    ],
    fit: ["Vous n'avez pas encore de site, ou il date de plusieurs années", "Votre site actuel est lent, illisible sur mobile ou ne génère aucune demande", "Vous lancez une activité ou une nouvelle offre"],
    project: "la-photo-minute",
    offerTitle: "À partir de 590 € puis 39 € par mois",
    offerText: "La formule Starter couvre un site jusqu'à 3 pages. La formule Business (990 €) ajoute jusqu'à 7 pages, la rédaction, la prise de rendez-vous et le SEO local.",
    offerKey: "business",
    faq: [
      { q: "Pouvez-vous refaire mon site sans perdre mon référencement ?", a: "Oui. Avant la refonte, nous relevons vos pages existantes et mettons en place des redirections vers les nouvelles adresses, pour que Google et vos visiteurs retrouvent leur chemin." },
      { q: "Dois-je fournir les textes et les photos ?", a: "En formule Starter, vous fournissez vos textes et photos ; nous les mettons en forme. En formule Business, nous rédigeons ou retravaillons vos textes. Un shooting photo peut être organisé en option." },
      { q: "Utilisez-vous WordPress ou Wix ?", a: "Nous développons des sites sur mesure, plus rapides et plus sûrs qu'un thème générique. Vous n'avez rien à mettre à jour : la maintenance est comprise dans l'abonnement." },
    ],
    serviceType: "Création de site internet",
  },

  "e-commerce": {
    slug: "e-commerce",
    seoTitle: "Création de boutique en ligne et e-commerce en Île-de-France | Motion Eleven",
    seoDescription: "Création de boutiques en ligne, paiements Stripe, réservations et prise de rendez-vous pour commerces et marques. Sans commission sur vos ventes. Dès 1 490 €.",
    crumbs: [{ name: "Services", href: "/services/" }, { name: "E-commerce", href: "/e-commerce/" }],
    kicker: "E-commerce & digital business",
    title: "Vendez, encaissez et réservez en ligne, sur votre propre site.",
    lede: "Boutiques en ligne, paiements, réservations, prises de rendez-vous et espaces d'administration : nous construisons les outils qui vous permettent d'encaisser sans intermédiaire.",
    visual: { pole: "shop" },
    problemsTitle: "Pourquoi vendre sur votre propre site",
    problems: [
      { t: "Aucune commission sur vos ventes", d: "Sur votre site, vous ne payez que les frais bancaires de Stripe. Les marketplaces et plateformes de réservation prélèvent un pourcentage sur chaque vente." },
      { t: "Vos clients vous appartiennent", d: "Les coordonnées et l'historique de commande restent chez vous. Vous pouvez les recontacter, les fidéliser, leur proposer une nouveauté." },
      { t: "L'acompte sécurise vos réservations", d: "Un acompte payé en ligne réduit les annulations de dernière minute et vous évite les relances pour obtenir un engagement." },
    ],
    buildTitle: "Ce que nous construisons",
    build: [
      { group: "Vendre en ligne", items: ["Boutique avec catalogue de produits et variantes", "Paiement par carte, Apple Pay et Google Pay via Stripe", "Livraison, retrait en magasin ou click & collect", "E-mails de confirmation et suivi de commande"] },
      { group: "Réserver et gérer", items: ["Réservation de dates ou de créneaux avec acompte", "Prise de rendez-vous en ligne", "Gestion des commandes et des stocks", "Base de données clients et espace administrateur"] },
    ],
    fit: ["Vous vendez déjà en boutique et voulez vendre aussi en ligne", "Vous prenez des réservations par téléphone ou par message", "Vous payez des commissions importantes à une plateforme"],
    project: "la-photo-minute",
    offerTitle: "À partir de 1 490 € puis 79 € par mois",
    offerText: "La formule E-commerce comprend une boutique jusqu'à 30 produits, le paiement Stripe et la gestion des commandes. Les plateformes de réservation sur mesure sont chiffrées sur devis.",
    offerKey: "ecommerce",
    faq: [
      { q: "Quels sont les frais sur les paiements ?", a: "Vous payez uniquement les frais de transaction de Stripe, selon sa grille en vigueur. Motion Eleven ne prend aucune commission sur vos ventes." },
      { q: "Puis-je ajouter mes produits moi-même ?", a: "Oui. Vous disposez d'un espace administrateur pour ajouter, modifier ou retirer vos produits, et suivre vos commandes." },
      { q: "Quand l'argent arrive-t-il sur mon compte ?", a: "Stripe verse les paiements directement sur votre compte bancaire professionnel, selon le calendrier de versement de votre compte Stripe." },
    ],
    serviceType: "Création de boutique en ligne",
  },

  "automatisation-ia": {
    slug: "automatisation-ia",
    seoTitle: "Automatisation d'entreprise, CRM et agents IA | Motion Eleven",
    seoDescription: "Automatisation des tâches répétitives, CRM, formulaires intelligents, notifications et agents IA pour TPE et PME en Île-de-France. Gagnez du temps chaque semaine.",
    crumbs: [{ name: "Services", href: "/services/" }, { name: "Automatisation et IA", href: "/automatisation-ia/" }],
    kicker: "Automatisation & IA",
    title: "Les tâches répétitives se font seules. Vous gardez le temps pour vos clients.",
    lede: "Relances, devis, confirmations, saisie dans un tableur, réponses aux questions fréquentes : nous connectons vos outils et mettons en place des automatisations et des agents IA qui travaillent en continu.",
    visual: { pole: "auto" },
    problemsTitle: "Ce que l'automatisation règle concrètement",
    problems: [
      { t: "Plus aucun prospect oublié", d: "Chaque demande est enregistrée, vous êtes notifié instantanément et une relance part si personne n'a répondu au bout d'un délai que vous fixez." },
      { t: "Moins de saisie, moins d'erreurs", d: "Les informations circulent d'elles-mêmes entre votre site, votre messagerie, votre agenda et votre tableau de suivi." },
      { t: "Des réponses immédiates, même le soir", d: "Un agent IA, nourri de vos informations, répond aux questions courantes et qualifie la demande avant de vous la transmettre." },
    ],
    buildTitle: "Ce que nous mettons en place",
    build: [
      { group: "Automatisations", items: ["Notification instantanée de chaque demande (e-mail, WhatsApp)", "Relances automatiques des devis non signés", "Confirmations et rappels de rendez-vous", "Synchronisation entre site, agenda, tableur et facturation"] },
      { group: "CRM et IA", items: ["Mini CRM pour suivre vos prospects, de la demande au client gagné", "Formulaires intelligents qui s'adaptent aux réponses", "Agents IA pour répondre et qualifier", "Intégrations API sur mesure"] },
    ],
    fit: ["Vous perdez du temps à recopier des informations", "Des demandes restent sans réponse faute de temps", "Vous voulez suivre vos prospects sans logiciel compliqué"],
    offerTitle: "Automatisation à partir de 200 €",
    offerText: "Une automatisation simple (notification, relance, synchronisation) démarre à 200 €. Les CRM et agents IA sont chiffrés sur devis après un échange sur vos outils actuels.",
    faq: [
      { q: "Faut-il changer mes outils actuels ?", a: "Rarement. Nous partons de ce que vous utilisez déjà (Gmail, Google Agenda, tableur, WhatsApp…) et les connectons entre eux." },
      { q: "Un agent IA peut-il donner de mauvaises informations ?", a: "Nous le limitons à vos informations validées et prévoyons un passage de relais vers vous dès qu'une question sort de son périmètre." },
      { q: "Mes données sont-elles protégées ?", a: "Les accès sont limités au strict nécessaire, les clés secrètes ne sont jamais exposées publiquement et nous privilégions des services hébergés en Europe lorsque c'est possible." },
    ],
    serviceType: "Automatisation de processus et intégration d'IA",
  },

  "motion-design": {
    slug: "motion-design",
    seoTitle: "Motion design, vidéo publicitaire et identité visuelle | Motion Eleven",
    seoDescription: "Motion design, vidéos publicitaires, animation de logo, Reels et identité visuelle pour entreprises en Île-de-France. Vidéo promo dès 250 €.",
    crumbs: [{ name: "Services", href: "/services/" }, { name: "Motion design", href: "/motion-design/" }],
    kicker: "Creative & motion design",
    title: "Des images qui arrêtent le défilement et installent votre marque.",
    lede: "Le motion design est à l'origine de Motion Eleven. Vidéos publicitaires, logos animés, Reels, identité visuelle : nous créons des contenus qui donnent envie d'en savoir plus.",
    visual: { pole: "motion" },
    problemsTitle: "Pourquoi le mouvement fait la différence",
    problems: [
      { t: "Vous captez l'attention en quelques secondes", d: "Sur les réseaux sociaux, une vidéo rythmée et lisible sans le son retient le regard bien plus qu'une image fixe." },
      { t: "Votre offre devient simple à comprendre", d: "Une animation explique un service, un processus ou une application en trente secondes, là où un texte en demanderait trois paragraphes." },
      { t: "Votre marque est reconnaissable partout", d: "Logo, couleurs, typographies et animations forment un ensemble cohérent, du site aux publicités." },
    ],
    buildTitle: "Ce que nous créons",
    build: [
      { group: "Vidéo", items: ["Vidéo promo en motion design (15 à 30 s)", "Vidéos publicitaires pour Instagram, TikTok et Facebook", "Reels et formats verticaux", "Animation de logo"] },
      { group: "Identité et contenus", items: ["Identité visuelle et direction artistique", "Visuels pour les réseaux sociaux", "Flyers et supports print", "Déclinaison de votre charte sur le site"] },
    ],
    project: undefined,
    offerTitle: "Vidéo promo à partir de 250 €",
    offerText: "Animation de logo à 150 €, pack de 5 visuels à 150 €, 3 Reels à 180 €. Les identités visuelles complètes et les campagnes sont chiffrées sur devis.",
    faq: [
      { q: "Combien de temps pour une vidéo ?", a: "Comptez une à deux semaines pour une vidéo promo, selon la longueur et le nombre d'allers-retours." },
      { q: "Faut-il fournir des images ?", a: "Votre logo et vos couleurs suffisent pour démarrer. Nous pouvons intégrer vos photos et vidéos, ou travailler entièrement en animation." },
      { q: "Où voir vos travaux de motion design ?", a: "Notre portfolio motion design présente des animations de logo, des Reels et des vidéos promo." },
    ],
    serviceType: "Motion design et production vidéo",
  },

  restaurants: {
    slug: "restaurants",
    seoTitle: "Création de site internet pour restaurant en Île-de-France | Motion Eleven",
    seoDescription: "Site internet pour restaurant : menu en ligne lisible sur mobile, commande à emporter sans commission, réservation de table, Google. Île-de-France.",
    crumbs: [{ name: "Solutions pour restaurants", href: "/solutions/restaurants/" }],
    kicker: "Solutions pour restaurants",
    title: "Remplissez vos tables et vos commandes, sans reverser de commission.",
    lede: "Vos clients choisissent souvent leur restaurant sur leur téléphone, quelques minutes avant de manger. Votre site doit leur montrer le menu, les horaires et le bouton pour commander, immédiatement.",
    visual: { pole: "web" },
    problemsTitle: "Les problèmes que nous réglons pour les restaurateurs",
    problems: [
      { t: "Un menu illisible ou périmé", d: "Une photo floue de la carte ou un PDF à télécharger fait fuir. Un menu en ligne clair, par catégories, que vous mettez à jour en un instant." },
      { t: "Les commissions des plateformes", d: "La commande à emporter depuis votre site vous laisse l'essentiel de la marge, et le client revient chez vous plutôt que sur l'application." },
      { t: "Le téléphone qui sonne en plein service", d: "Réservations de table et commandes en ligne arrivent par écrit, avec l'heure et le nombre de couverts." },
    ],
    buildTitle: "Ce que nous mettons en place pour votre restaurant",
    build: [
      { group: "Pour vos clients", items: ["Menu en ligne par catégories, avec photos et prix", "Commande à emporter ou click & collect, paiement en ligne", "Réservation de table", "Horaires, adresse, itinéraire et appel en un geste", "Mention des allergènes et des labels (casher, halal, végétarien…)"] },
      { group: "Pour vous", items: ["Mise à jour du menu et des prix sans compétence technique", "Notification de chaque commande ou réservation", "Fiche Google Business cohérente avec le site", "Visibilité locale sur « restaurant + votre ville »"] },
    ],
    offerTitle: "Formule Business recommandée : 990 € puis 59 € par mois",
    offerText: "Elle couvre le site, le menu en ligne, la réservation et le SEO local. La commande en ligne avec paiement relève de la formule E-commerce (1 490 € puis 79 € par mois).",
    offerKey: "business",
    faq: [
      { q: "Puis-je modifier mon menu moi-même ?", a: "Oui, depuis un espace simple sur votre téléphone. Vous pouvez aussi nous envoyer vos changements : ils entrent dans vos modifications mensuelles." },
      { q: "Le site remplace-t-il Uber Eats ou Deliveroo ?", a: "Il les complète. Les plateformes apportent de nouveaux clients ; votre site permet à vos habitués de commander directement, sans commission." },
      { q: "Peut-on afficher un QR code en salle ?", a: "Oui. Nous vous fournissons un QR code vers votre menu en ligne, à imprimer sur les tables ou en vitrine." },
    ],
    serviceType: "Création de site internet pour restaurant",
    ctaTitle: "Parlons de votre restaurant.",
  },

  artisans: {
    slug: "artisans",
    seoTitle: "Création de site internet pour artisan en Île-de-France | Motion Eleven",
    seoDescription: "Site internet pour artisan : demandes de devis avec photos, zone d'intervention, réalisations avant/après, appel direct. Plombier, électricien, peintre… Dès 590 €.",
    crumbs: [{ name: "Solutions pour artisans", href: "/solutions/artisans/" }],
    kicker: "Solutions pour artisans",
    title: "Des demandes de chantier précises, pendant que vous êtes sur le chantier.",
    lede: "Plombiers, électriciens, peintres, menuisiers, couvreurs, paysagistes : votre site doit rassurer, montrer votre travail et vous transmettre des demandes de devis complètes, photos comprises.",
    visual: { pole: "web" },
    problemsTitle: "Les problèmes que nous réglons pour les artisans",
    problems: [
      { t: "Des appels manqués en pleine intervention", d: "Le client remplit un formulaire guidé : type de travaux, adresse, urgence, photos. Vous rappelez au bon moment, avec toutes les informations." },
      { t: "Des devis pour rien", d: "Le formulaire filtre par zone d'intervention et type de prestation. Vous vous déplacez pour des chantiers qui vous correspondent." },
      { t: "La confiance à gagner face aux grandes enseignes", d: "Vos réalisations en avant/après, vos qualifications et vos avis clients montrent le sérieux de votre entreprise." },
    ],
    buildTitle: "Ce que nous mettons en place pour votre entreprise",
    build: [
      { group: "Pour vos clients", items: ["Formulaire de devis guidé avec envoi de photos", "Bouton d'appel visible en permanence sur mobile", "Galerie de réalisations avant/après", "Zone d'intervention claire, ville par ville", "Mise en avant de vos qualifications et garanties"] },
      { group: "Pour vous", items: ["Notification immédiate de chaque demande", "Suivi des devis envoyés, gagnés ou perdus", "Fiche Google Business optimisée", "Visibilité locale sur « votre métier + votre ville »"] },
    ],
    offerTitle: "À partir de 590 € puis 39 € par mois",
    offerText: "La formule Starter suffit pour démarrer. La formule Business (990 €) ajoute le formulaire de devis détaillé, le SEO local et jusqu'à 7 pages pour présenter chaque prestation.",
    offerKey: "starter",
    faq: [
      { q: "Mes clients peuvent-ils envoyer des photos ?", a: "Oui. Le formulaire de devis accepte des photos prises directement depuis le téléphone, pour estimer le chantier avant de vous déplacer." },
      { q: "Pouvez-vous créer une page par ville ?", a: "Seulement si elle apporte une vraie information : vos chantiers dans cette ville, vos délais d'intervention. Les pages copiées-collées nuisent au référencement." },
      { q: "Je n'ai pas de photos de mes chantiers.", a: "Prenez l'habitude de photographier avant et après chaque intervention : nous les ajoutons au fil de l'eau dans vos modifications mensuelles." },
    ],
    serviceType: "Création de site internet pour artisan",
    ctaTitle: "Parlons de votre activité.",
  },

  commerces: {
    slug: "commerces",
    seoTitle: "Site internet et click & collect pour commerce de proximité | Motion Eleven",
    seoDescription: "Site internet pour commerces : catalogue en ligne, click & collect, boutique, horaires et itinéraire. Faites venir les clients en magasin. Île-de-France.",
    crumbs: [{ name: "Solutions pour commerces", href: "/solutions/commerces/" }],
    kicker: "Solutions pour commerces",
    title: "Faites venir les clients en boutique, et vendez aussi quand elle est fermée.",
    lede: "Boutiques de prêt-à-porter, épiceries fines, fleuristes, opticiens, salons, concept stores : votre site montre ce que vous vendez, donne envie de passer et permet de réserver ou d'acheter en ligne.",
    visual: { pole: "shop" },
    problemsTitle: "Les problèmes que nous réglons pour les commerçants",
    problems: [
      { t: "Des clients qui ne savent pas ce que vous vendez", d: "Un catalogue en ligne, même partiel, montre vos produits phares et vos nouveautés, et donne une raison de passer en boutique." },
      { t: "Des ventes perdues en dehors des horaires", d: "Le click & collect et la boutique en ligne prennent les commandes le soir et le dimanche ; le client vient chercher ou se fait livrer." },
      { t: "Une concurrence en ligne très présente", d: "Votre conseil, votre sélection et votre proximité sont des atouts : le site les met en avant, avec votre adresse et vos horaires toujours à jour." },
    ],
    buildTitle: "Ce que nous mettons en place pour votre commerce",
    build: [
      { group: "Pour vos clients", items: ["Catalogue de produits avec photos, prix et disponibilité", "Click & collect ou boutique en ligne avec paiement", "Réservation d'un produit ou d'un rendez-vous", "Horaires, adresse, itinéraire et appel en un geste"] },
      { group: "Pour vous", items: ["Gestion des produits et des commandes depuis votre téléphone", "Notification de chaque commande ou réservation", "Fiche Google Business cohérente avec le site", "Mesure de ce qui fonctionne : visites, clics, commandes"] },
    ],
    offerTitle: "De 990 € (vitrine + catalogue) à 1 490 € (boutique)",
    offerText: "La formule Business présente votre catalogue et prend des réservations. La formule E-commerce ajoute la vente en ligne, le paiement Stripe et le click & collect.",
    offerKey: "ecommerce",
    faq: [
      { q: "Dois-je mettre tout mon stock en ligne ?", a: "Non. Beaucoup de commerces commencent par leurs produits phares et leurs nouveautés, puis enrichissent le catalogue au fil du temps." },
      { q: "Le click & collect est-il compliqué à gérer ?", a: "Vous recevez la commande, vous la préparez, le client est prévenu automatiquement qu'elle est prête. Le paiement peut se faire en ligne ou au retrait." },
      { q: "Mon stock en boutique et en ligne sera-t-il synchronisé ?", a: "Sur la formule E-commerce, le stock est géré dans votre espace administrateur. Une synchronisation avec une caisse existante est étudiée sur devis." },
    ],
    serviceType: "Création de site internet pour commerce",
    ctaTitle: "Parlons de votre boutique.",
  },
};
