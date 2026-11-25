// Pages SEO locales : un contenu propre à chaque ville (pas de texte dupliqué).
export type Zone = {
  slug: string;
  city: string;
  dept: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  lede: string;
  sections: { h: string; p: string[] }[];
  faq: { q: string; a: string }[];
  neighbours: string[];
};

export const zonePages: Zone[] = [
  {
    slug: "paris",
    city: "Paris",
    dept: "75",
    seoTitle: "Création de site internet à Paris — agence web & motion design | Motion Eleven",
    seoDescription: "Création de site internet à Paris pour TPE, commerces, restaurants et indépendants : design sur mesure, SEO local, e-commerce. Dès 590 € HT, rendez-vous en ligne.",
    h1: "Création de site internet à Paris",
    lede: "Des sites rapides, élégants et pensés pour être trouvés sur Google, pour les entreprises parisiennes qui veulent plus de clients.",
    sections: [
      {
        h: "Se démarquer dans la ville la plus concurrentielle de France",
        p: [
          "À Paris, un restaurant, un artisan ou une boutique a souvent des dizaines de concurrents dans le même arrondissement. Vos futurs clients comparent sur leur téléphone, en quelques secondes, avant de réserver ou d'appeler. Un site lent, daté ou difficile à lire sur mobile vous fait perdre ces demandes au profit du voisin.",
          "Nous concevons des sites sur mesure qui inspirent confiance dès la première seconde : une direction artistique soignée, des pages claires, un bouton d'appel et un formulaire de devis toujours accessibles.",
        ],
      },
      {
        h: "Être trouvé dans votre arrondissement",
        p: [
          "Les recherches comme « restaurant près de moi » ou « plombier Paris 11 » se jouent sur la proximité. Nous structurons votre site pour le référencement local : titres et descriptions optimisés, données structurées, cohérence avec votre fiche Google Business Profile, pages dédiées à vos services et à votre quartier lorsqu'elles apportent une vraie information.",
        ],
      },
      {
        h: "Un accompagnement simple, de la visio à la mise en ligne",
        p: [
          "Basés à Groslay, au nord de Paris, nous travaillons avec des entreprises parisiennes en visio, par téléphone ou en rendez-vous. Vous validez une maquette, nous développons, puis nous assurons l'hébergement, la sécurité et vos modifications chaque mois. Besoin d'aller plus loin ? Boutique en ligne, réservation avec acompte, automatisations ou vidéo en motion design pour vos réseaux sociaux : tout est réalisé par le même interlocuteur.",
        ],
      },
      {
        h: "La vidéo pour sortir du lot sur les réseaux",
        p: [
          "Sur Instagram ou TikTok, les comptes parisiens publient énormément. Une courte vidéo en motion design, un logo animé ou une publicité verticale de quelques secondes suffisent souvent à arrêter le défilement et à donner envie de visiter votre site. C'est notre métier d'origine : nous pouvons l'associer à votre site pour une image cohérente partout où vos clients vous découvrent.",
        ],
      },
    ],
    faq: [
      { q: "Combien coûte la création d'un site internet à Paris ?", a: "Nos formules démarrent à 590 € HT de création puis 39 € HT par mois, hébergement et maintenance compris. Un site Business est à 990 € HT puis 59 € HT par mois, une boutique en ligne à 1 490 € HT puis 79 € HT par mois. Les projets sur mesure sont chiffrés sur devis." },
      { q: "Peut-on se rencontrer à Paris ?", a: "Oui. Le premier échange se fait en général par téléphone ou en visio ; un rendez-vous en personne peut être organisé selon votre projet." },
      { q: "Comment apparaître sur Google dans mon arrondissement ?", a: "Un site rapide et bien structuré, une fiche Google Business Profile complète et cohérente avec le site, des avis clients et des pages qui décrivent précisément vos services. Nous mettons en place la partie technique et vous conseillons pour le reste." },
      { q: "En combien de temps mon site peut-il être en ligne ?", a: "Environ 2 semaines pour un site vitrine, 3 à 4 semaines pour un site Business et 4 à 6 semaines pour une boutique en ligne, à partir de la réception de vos contenus." },
    ],
    neighbours: ["sarcelles", "montmorency"],
  },
  {
    slug: "sarcelles",
    city: "Sarcelles",
    dept: "95",
    seoTitle: "Création de site internet à Sarcelles (95) — commerces, restaurants, artisans | Motion Eleven",
    seoDescription: "Création de site internet à Sarcelles : sites vitrines, menus en ligne, commande et réservation pour commerces, restaurants et artisans du Val-d'Oise. Dès 590 € HT.",
    h1: "Création de site internet à Sarcelles",
    lede: "Une agence web installée dans la commune voisine, à Groslay, pour les commerces, restaurants et artisans de Sarcelles.",
    sections: [
      {
        h: "Une agence de proximité pour les entreprises sarcelloises",
        p: [
          "Sarcelles est l'une des plus grandes villes du Val-d'Oise, avec un tissu dense de commerces, de restaurants, de prestataires et d'artisans. Beaucoup d'entre eux fonctionnent encore uniquement par le bouche-à-oreille, une page Facebook ou des plateformes qui prélèvent une commission sur chaque commande.",
          "Installés à Groslay, juste à côté, nous connaissons ce marché local et nous pouvons vous rencontrer facilement pour parler de votre projet.",
        ],
      },
      {
        h: "Des outils qui font venir des clients",
        p: [
          "Pour un restaurant : un menu lisible sur téléphone, la commande à emporter et la réservation de table directement sur votre site. Pour un commerce : un catalogue, le click & collect et vos horaires toujours à jour. Pour un artisan : un formulaire de devis qui vous transmet l'adresse du chantier et des photos avant même votre premier appel.",
          "Chaque site est pensé pour être trouvé par les habitants de Sarcelles et des villes alentour, de Garges-lès-Gonesse à Villiers-le-Bel.",
        ],
      },
      {
        h: "Un budget clair et un suivi dans la durée",
        p: [
          "Vous connaissez le prix avant de commencer : création à partir de 590 € HT, puis un abonnement mensuel qui couvre l'hébergement, la sécurité et vos modifications. Après la mise en ligne, nous restons votre interlocuteur pour faire évoluer le site avec votre activité.",
        ],
      },
      {
        h: "Comment se déroule votre projet",
        p: [
          "Tout commence par un échange de 30 minutes, à Sarcelles, à Groslay, par téléphone ou en visio. Vous nous parlez de votre activité, de vos clients et de ce que le site doit vous apporter. Sous 48 heures, vous recevez un devis précis : pages, fonctionnalités, délai et prix. Une fois la maquette validée, nous développons le site, le mettons en ligne et vous montrons comment suivre vos demandes. Vous n'avez rien à installer ni à mettre à jour.",
        ],
      },
    ],
    faq: [
      { q: "Êtes-vous basés près de Sarcelles ?", a: "Oui, Motion Eleven est installée à Groslay, commune voisine de Sarcelles. Nous pouvons nous rencontrer facilement pour lancer votre projet." },
      { q: "Mon restaurant peut-il prendre des commandes sans commission ?", a: "Oui. Avec la formule E-commerce, vos clients commandent et paient directement sur votre site. Vous ne payez que les frais bancaires de Stripe, sans commission reversée à une plateforme." },
      { q: "Je n'ai pas de photos professionnelles, est-ce un problème ?", a: "Non. Nous pouvons démarrer avec vos photos actuelles et les remplacer ensuite, ou réaliser des visuels et des vidéos courtes pour vos réseaux sociaux en option." },
      { q: "Quel est le prix d'un site pour un commerce à Sarcelles ?", a: "Un site vitrine démarre à 590 € HT puis 39 € HT par mois. Pour présenter un catalogue et prendre des réservations, la formule Business est à 990 € HT puis 59 € HT par mois." },
    ],
    neighbours: ["montmorency", "paris"],
  },
  {
    slug: "montmorency",
    city: "Montmorency",
    dept: "95",
    seoTitle: "Création de site internet à Montmorency (95) — agence web locale | Motion Eleven",
    seoDescription: "Création de site internet à Montmorency pour artisans, commerces de centre-ville, professions libérales et indépendants. Agence voisine à Groslay, devis gratuit sous 48 h.",
    h1: "Création de site internet à Montmorency",
    lede: "Des sites professionnels pour les artisans, commerçants et indépendants de Montmorency, conçus par une agence voisine.",
    sections: [
      {
        h: "Votre agence web à deux pas, à Groslay",
        p: [
          "Montmorency et Groslay se touchent : nous travaillons donc au plus près des entreprises montmorencéennes. Commerces du centre-ville, artisans du bâtiment, professions libérales, thérapeutes, coachs ou prestataires de services : vos clients vous cherchent en ligne avant de pousser votre porte.",
          "Un site clair, rapide et rassurant vous permet de répondre à leurs questions, de présenter votre savoir-faire et de recevoir des demandes qualifiées, même en dehors de vos horaires.",
        ],
      },
      {
        h: "Pensé pour la clientèle locale",
        p: [
          "Nous mettons en avant ce qui compte pour une clientèle de proximité : votre adresse et vos horaires, un appel en un geste depuis le téléphone, la prise de rendez-vous en ligne et vos réalisations ou vos avis clients. Le référencement est travaillé pour Montmorency et les communes voisines, comme Soisy-sous-Montmorency, Deuil-la-Barre ou Enghien-les-Bains.",
        ],
      },
      {
        h: "Une image à la hauteur de votre métier",
        p: [
          "Venant du motion design, nous apportons un soin particulier à l'image : direction artistique, logo, visuels et vidéos courtes pour vos réseaux sociaux. Votre site est livré avec l'hébergement, la sécurité et des modifications chaque mois, sans que vous ayez à vous occuper de la technique.",
        ],
      },
      {
        h: "Démarrer simplement",
        p: [
          "Vous n'avez pas besoin d'arriver avec un cahier des charges. Lors d'un premier échange, nous faisons le point sur votre activité, ce qui fonctionne déjà et ce qui vous manque : plus d'appels, des devis mieux préparés, une image plus professionnelle ou des réservations en ligne. Nous vous proposons ensuite la formule adaptée, avec un prix et un délai écrits. Vous pouvez aussi tester nos modèles de sites en ligne pour vous faire une idée concrète du résultat avant de vous engager.",
        ],
      },
    ],
    faq: [
      { q: "Peut-on se rencontrer à Montmorency ?", a: "Oui. Nous sommes installés à Groslay, commune limitrophe : un rendez-vous dans vos locaux ou un appel en visio, selon votre préférence." },
      { q: "Je suis artisan, quel site me conseillez-vous ?", a: "Un site avec vos prestations, vos réalisations avant/après et un formulaire de devis qui accepte des photos. La formule Starter suffit pour démarrer ; la formule Business ajoute le référencement local et plus de pages." },
      { q: "Pouvez-vous gérer ma fiche Google ?", a: "Avec la formule Business, nous optimisons votre fiche Google Business Profile et la rendons cohérente avec votre site, pour mieux apparaître dans les recherches locales." },
      { q: "Le site m'appartient-il ?", a: "Le nom de domaine est à votre nom et vos contenus vous appartiennent. À la fin de l'engagement de 12 mois, vous pouvez récupérer les fichiers de votre site." },
    ],
    neighbours: ["sarcelles", "paris"],
  },
];
