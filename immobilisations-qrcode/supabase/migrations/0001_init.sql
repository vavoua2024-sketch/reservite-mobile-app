-- Schéma initial : inventaire physique des immobilisations par QR code.
-- Modèle à deux niveaux : un "cabinet" (l'abonné SaaS) gère plusieurs
-- "companies" (les dossiers clients) — c'est l'angle mort identifié chez
-- tous les concurrents étudiés (aucun ne pense "un cabinet gère N clients").

create extension if not exists pgcrypto;

-- Le cabinet comptable, l'abonné qui paie le SaaS.
create table cabinets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Un dossier client géré par le cabinet (une entreprise dont on inventorie
-- les immobilisations).
create table companies (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references cabinets(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cabinet_id uuid not null references cabinets(id) on delete cascade,
  full_name text not null,
  role text not null default 'agent' check (role in ('responsable', 'agent')),
  created_at timestamptz not null default now()
);

-- Nomenclature SYSCOHADA — référentiel partagé, pas de company_id : les
-- comptes ne changent pas d'un client à l'autre.
create table categories (
  id serial primary key,
  name text not null,
  syscohada_account text not null
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  site_name text not null,
  building text,
  floor text,
  room text not null
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  category_id int references categories(id),
  location_id uuid references locations(id),
  qr_code_token text not null unique,
  asset_number text,
  designation text not null,
  serial_number text,
  acquisition_date date,
  purchase_value numeric(15, 2),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'BROKEN', 'SCRAPPED', 'MISSING')),
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inventory_campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'IN_PROGRESS', 'CLOSED'))
);

create table inventory_scans (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references inventory_campaigns(id) on delete cascade,
  asset_id uuid references assets(id) on delete cascade,
  scanned_by_user_id uuid not null references profiles(id),
  scanned_at timestamptz not null,
  condition_found text not null check (condition_found in ('GOOD', 'DAMAGED', 'UNKNOWN')),
  actual_location_id uuid references locations(id),
  unknown_qr_token text,
  note text,
  photo_url text,
  created_at timestamptz not null default now()
);

create index idx_companies_cabinet on companies(cabinet_id);
create index idx_locations_company on locations(company_id);
create index idx_assets_company on assets(company_id);
create index idx_assets_qr_token on assets(qr_code_token);
create index idx_campaigns_company on inventory_campaigns(company_id);
create index idx_scans_campaign on inventory_scans(campaign_id);
create index idx_scans_asset on inventory_scans(asset_id);

-- Fonction utilitaire : le cabinet de l'utilisateur connecté, utilisée par
-- toutes les policies RLS ci-dessous (security definer pour éviter la
-- récursion sur profiles).
create or replace function my_cabinet_id()
returns uuid
language sql
security definer
stable
as $$
  select cabinet_id from profiles where id = auth.uid();
$$;

alter table cabinets enable row level security;
alter table companies enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;
alter table locations enable row level security;
alter table assets enable row level security;
alter table inventory_campaigns enable row level security;
alter table inventory_scans enable row level security;

create policy "own cabinet" on cabinets for select using (id = my_cabinet_id());

create policy "companies of my cabinet" on companies for all
  using (cabinet_id = my_cabinet_id()) with check (cabinet_id = my_cabinet_id());

create policy "read own profile" on profiles for select using (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid());

create policy "categories readable by all authenticated" on categories
  for select using (auth.role() = 'authenticated');

create policy "locations of my cabinet" on locations for all
  using (company_id in (select id from companies where cabinet_id = my_cabinet_id()))
  with check (company_id in (select id from companies where cabinet_id = my_cabinet_id()));

create policy "assets of my cabinet" on assets for all
  using (company_id in (select id from companies where cabinet_id = my_cabinet_id()))
  with check (company_id in (select id from companies where cabinet_id = my_cabinet_id()));

create policy "campaigns of my cabinet" on inventory_campaigns for all
  using (company_id in (select id from companies where cabinet_id = my_cabinet_id()))
  with check (company_id in (select id from companies where cabinet_id = my_cabinet_id()));

create policy "scans of my cabinet" on inventory_scans for all
  using (campaign_id in (
    select ic.id from inventory_campaigns ic
    join companies c on c.id = ic.company_id
    where c.cabinet_id = my_cabinet_id()
  ))
  with check (scanned_by_user_id = auth.uid());

-- Nomenclature SYSCOHADA de base (classe 2 — immobilisations), pour ne pas
-- démarrer avec un formulaire vide.
insert into categories (name, syscohada_account) values
  ('Frais de développement et de prospection', '20'),
  ('Logiciels et licences', '212'),
  ('Brevets, licences, concessions', '213'),
  ('Terrains', '22'),
  ('Bâtiments', '23'),
  ('Installations techniques et agencements', '234'),
  ('Matériel et outillage industriel', '241'),
  ('Matériel informatique', '2441'),
  ('Mobilier de bureau', '2442'),
  ('Matériel de transport', '245');
