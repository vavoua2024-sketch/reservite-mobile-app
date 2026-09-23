-- Rôle super admin plateforme : voit tous les cabinets, toutes les données,
-- à travers une table platform_admins vérifiée par une fonction dédiée.
-- Les policies RLS existantes restent inchangées (isolation par cabinet) —
-- on ajoute des policies PERMISSIVES supplémentaires qui s'additionnent en
-- OR : un platform_admin passe au travers, un utilisateur normal reste isolé.

create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

create policy "platform admin reads own admin row" on platform_admins
  for select using (user_id = auth.uid());

create or replace function is_platform_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

create policy "platform admin full access cabinets" on cabinets
  for all using (is_platform_admin()) with check (is_platform_admin());

create policy "platform admin full access companies" on companies
  for all using (is_platform_admin()) with check (is_platform_admin());

create policy "platform admin full access profiles" on profiles
  for select using (is_platform_admin());

create policy "platform admin full access locations" on locations
  for all using (is_platform_admin()) with check (is_platform_admin());

create policy "platform admin full access assets" on assets
  for all using (is_platform_admin()) with check (is_platform_admin());

create policy "platform admin full access campaigns" on inventory_campaigns
  for all using (is_platform_admin()) with check (is_platform_admin());

create policy "platform admin full access scans" on inventory_scans
  for all using (is_platform_admin()) with check (is_platform_admin());

-- Bootstrap : le compte du fondateur devient automatiquement platform_admin
-- dès son inscription (en plus de recevoir son propre cabinet normalement).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_cabinet_id uuid;
begin
  insert into cabinets (name)
  values (coalesce(new.raw_user_meta_data->>'cabinet_name', split_part(new.email, '@', 1) || ' — cabinet'))
  returning id into new_cabinet_id;

  insert into profiles (id, cabinet_id, full_name, role)
  values (
    new.id,
    new_cabinet_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'responsable'
  );

  if new.email = 'vavoua2024@gmail.com' then
    insert into platform_admins (user_id) values (new.id);
  end if;

  return new;
end;
$$;
