-- Création des buckets de stockage Supabase pour les images
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Créer les buckets de stockage
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('covers', 'covers', true);
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true);

-- Politiques RLS pour permettre l'accès public en lecture
create policy "Public Read Access" on storage.objects for select 
using (bucket_id = 'avatars' or bucket_id = 'covers' or bucket_id = 'post-images');

-- Politiques RLS pour permettre l'upload aux utilisateurs authentifiés
create policy "Auth Upload" on storage.objects for insert 
with check (bucket_id = 'avatars' or bucket_id = 'covers' or bucket_id = 'post-images');

-- Politiques RLS pour permettre la mise à jour aux utilisateurs authentifiés
create policy "Auth Update" on storage.objects for update 
with check (bucket_id = 'avatars' or bucket_id = 'covers' or bucket_id = 'post-images');

-- Politiques RLS pour permettre la suppression aux utilisateurs authentifiés
create policy "Auth Delete" on storage.objects for delete 
with check (bucket_id = 'avatars' or bucket_id = 'covers' or bucket_id = 'post-images');
