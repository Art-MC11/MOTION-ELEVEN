-- Motion Eleven — table des prospects (mini CRM)
-- À exécuter dans Supabase > SQL Editor, ou via la CLI Supabase.
-- Accès uniquement par la clé « service role » depuis les fonctions Netlify :
-- RLS activé et aucune politique publique = aucune lecture/écriture depuis le navigateur.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  type text not null default 'devis' check (type in ('devis', 'rdv', 'contact', 'commande')),
  status text not null default 'nouveau' check (status in ('nouveau', 'contacte', 'devis_envoye', 'gagne', 'perdu')),
  name text not null,
  company text,
  email text not null,
  phone text,
  sector text,
  project_type text,
  budget text,
  timeline text,
  message text,
  formule text,
  appointment_date date,
  appointment_slot text,
  appointment_mode text,
  source_page text,
  utm jsonb,
  amount_cents integer,
  stripe_session_id text unique,
  notes text
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

alter table public.leads enable row level security;
-- Aucune politique : seules les fonctions serveur (service role) accèdent aux données.
