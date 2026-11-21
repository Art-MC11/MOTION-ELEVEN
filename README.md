# Motion Eleven — site web

Site de **Motion Eleven — Digital Agency & Technology** (https://motion-eleven.fr).

- **Framework** : [Astro](https://astro.build) (site statique, très rapide)
- **Hébergement** : Netlify (+ Netlify Functions pour le serveur)
- **Prospects** : Netlify Forms (actif tout de suite) + Supabase (mini CRM) + Resend (e-mails)
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

## Variables d'environnement (Netlify > Project configuration > Environment variables)

Tout fonctionne sans ces variables : les fonctionnalités correspondantes s'activent dès qu'elles sont renseignées.

| Variable | Rôle |
| --- | --- |
| `PUBLIC_GA_ID` | Identifiant Google Analytics 4 (`G-XXXXXXX`). Active la mesure et le bandeau cookies. |
| `PUBLIC_GSC_VERIFICATION` | Code de vérification Google Search Console (balise meta). |
| `PUBLIC_CAL_URL` | Lien d'agenda en ligne (Cal.com, Calendly…) affiché sur la page Contact. |
| `SUPABASE_URL` | URL du projet Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé *service role* Supabase (secrète, scope Functions uniquement). |
| `ADMIN_PASSWORD` | Mot de passe du CRM `/admin/` (12 caractères minimum). |
| `RESEND_API_KEY` | Clé Resend pour les e-mails de notification. |
| `RESEND_FROM` | Expéditeur vérifié, ex. `Motion Eleven <contact@motion-eleven.fr>`. |
| `LEAD_NOTIFY_EMAIL` | Adresse qui reçoit les notifications (par défaut cohenmeir91@gmail.com). |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_live_…`). Active la commande en ligne. |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe (`whsec_…`). |

Les variables `PUBLIC_*` sont lues au moment du build : redéployez après les avoir modifiées.

## Mise en route des briques

1. **Supabase** : créer un projet (région Paris), exécuter `supabase/migrations/001_leads.sql` dans le SQL Editor, puis renseigner `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `ADMIN_PASSWORD`. Le CRM est sur `/admin/`.
2. **Resend** : vérifier le domaine motion-eleven.fr, créer une clé, renseigner `RESEND_API_KEY` et `RESEND_FROM`.
3. **Stripe** : renseigner `STRIPE_SECRET_KEY`, puis créer un webhook vers `https://motion-eleven.fr/api/stripe-webhook` (évènement `checkout.session.completed`) et renseigner `STRIPE_WEBHOOK_SECRET`.
4. **Google** : créer une propriété GA4 → `PUBLIC_GA_ID` ; vérifier le domaine dans Search Console et soumettre `https://motion-eleven.fr/sitemap-index.xml`.

## Évènements mesurés

`cta_click`, `whatsapp_click`, `phone_click`, `email_click`, `generate_lead`, `book_appointment`, `begin_checkout`, `purchase` (à marquer comme conversions clés dans GA4).

## API (Netlify Functions)

| Route | Rôle |
| --- | --- |
| `POST /api/lead` | Demande de devis, de rendez-vous ou de contact → Supabase + e-mail |
| `GET/PATCH /api/admin/leads` | CRM (protégé par `ADMIN_PASSWORD`) |
| `POST /api/checkout` | Crée la session Stripe Checkout (montant calculé côté serveur) |
| `POST /api/stripe-webhook` | Enregistre les acomptes payés (signature vérifiée) |
