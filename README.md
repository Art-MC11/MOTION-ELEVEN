# Motion Eleven — site web

Site de **Motion Eleven — Digital Agency & Technology** (https://motion-eleven.fr).

- **Framework** : [Astro](https://astro.build) (site statique, très rapide)
- **Hébergement** : Netlify (+ Netlify Functions pour le serveur)
- **Espace admin `/admin/`** : prospection, contacts (CRM), messages e-mail et WhatsApp — données dans Netlify Blobs
- **Prospects du site** : Netlify Forms + ajout automatique au CRM + notification Resend
- **Paiement** : Stripe Checkout (acompte de 50 % sur les formules standard)
- **Mesure** : Google Analytics 4 avec bandeau de consentement

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # génère dist/
```

## Où modifier quoi

| Contenu | Fichier |
| --- | --- |
| Coordonnées, réseaux, menu | `src/data/site.ts` |
| Pôles de services, formules, options, FAQ, réalisations, avis clients | `src/data/content.ts` |
| Pages services et pages métiers | `src/data/pages.ts` |
| Couleurs, typographie | `src/styles/global.css` |
| Captures réelles des réalisations | `public/images/realisations/` puis champ `image` dans `content.ts` |

**Avis clients** : la section s'affiche automatiquement dès qu'un avis authentique est ajouté dans `testimonials` (`src/data/content.ts`).

## Espace admin (`/admin/`)

- **Accueil** : revenu mensuel, clients, affaires en cours, relances du jour, demandes reçues sur le site.
- **Prospecter** : trois sources.
  - *Commerces sans site* (OpenStreetMap, gratuit) : téléphone, e-mail et site souvent renseignés ; filtre « sans site ».
  - *Annuaire officiel* (recherche-entreprises.api.gouv.fr, gratuit) : toutes les entreprises actives d'une commune ; les entreprises opposées à la prospection sont exclues.
  - *Google Maps* (facultatif) : clé `GOOGLE_PLACES_API_KEY` (Places API New).
- **Contacts** : statuts (prospect → contacté → intéressé → devis envoyé → client / perdu / ne plus contacter), relances, notes, historique, montants, export CSV.
- **Messages** : modèles personnalisables, campagnes e-mail (Resend) avec limite quotidienne et lien de désinscription, WhatsApp pré-rempli.

Les demandes de devis, de rendez-vous et les paiements Stripe arrivent automatiquement dans le CRM.

## Variables d'environnement (Netlify > Project configuration > Environment variables)

| Variable | Rôle |
| --- | --- |
| `ADMIN_PASSWORD` | Mot de passe de l'espace admin. |
| `APP_SECRET` | Clé de signature des sessions et des liens de désinscription (longue chaîne aléatoire). |
| `RESEND_API_KEY` | Clé Resend : envoi des e-mails (campagnes, notifications). |
| `RESEND_FROM` | Expéditeur vérifié, ex. `Meir Cohen <meir@motion-eleven.fr>`. |
| `REPLY_TO_EMAIL` | Adresse de réponse aux e-mails de prospection (par défaut cohenmeir91@gmail.com). |
| `LEAD_NOTIFY_EMAIL` | Adresse qui reçoit les notifications de demandes (par défaut cohenmeir91@gmail.com). |
| `GOOGLE_PLACES_API_KEY` | Facultatif : recherche Google Maps dans la prospection. |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_live_…`). Active la commande en ligne. |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe (`whsec_…`). |
| `PUBLIC_GA_ID` | Identifiant Google Analytics 4. Active la mesure et le bandeau cookies. |
| `PUBLIC_GSC_VERIFICATION` | Code de vérification Google Search Console. |
| `PUBLIC_CAL_URL` | Lien d'agenda en ligne affiché sur la page Contact. |

Les variables `PUBLIC_*` sont lues au moment du build : redéployez après les avoir modifiées.

## Mise en route des briques

1. **Resend** : vérifier le domaine motion-eleven.fr (enregistrements DNS), créer une clé, renseigner `RESEND_API_KEY` et `RESEND_FROM`.
2. **Stripe** : renseigner `STRIPE_SECRET_KEY`, puis créer un webhook vers `https://motion-eleven.fr/api/stripe-webhook` (évènement `checkout.session.completed`) et renseigner `STRIPE_WEBHOOK_SECRET`.
3. **Google** : créer une propriété GA4 → `PUBLIC_GA_ID` ; vérifier le domaine dans Search Console et soumettre `https://motion-eleven.fr/sitemap-index.xml`.

## Évènements mesurés

`cta_click`, `whatsapp_click`, `phone_click`, `email_click`, `generate_lead`, `book_appointment`, `begin_checkout`, `purchase` (à marquer comme conversions clés dans GA4).

## API (Netlify Functions)

| Route | Rôle |
| --- | --- |
| `POST /api/lead` | Demande de devis, de rendez-vous ou de contact → CRM + e-mail |
| `/api/admin/*` | Espace admin (session par cookie signé) |
| `GET /api/unsubscribe` | Lien de désinscription des e-mails de prospection |
| `POST /api/checkout` | Crée la session Stripe Checkout (montant calculé côté serveur) |
| `POST /api/stripe-webhook` | Enregistre les acomptes payés (signature vérifiée) |
