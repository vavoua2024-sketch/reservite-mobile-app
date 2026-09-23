-- À l'inscription d'un nouvel utilisateur (Supabase Auth), on crée
-- automatiquement son cabinet et son profil "responsable" — c'est ce qui
-- permet un signup self-service sans étape d'admin manuelle.
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

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
