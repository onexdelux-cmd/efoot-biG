-- DÉDUPLICATION DES EMAILS DANS public.profiles
-- Exécutez ce script dans l'éditeur SQL Supabase

-- 1) Normaliser les emails (mettre en minuscules et supprimer les espaces)
UPDATE public.profiles
SET email = lower(trim(email))
WHERE email IS NOT NULL;

-- 2) Supprimer les doublons en gardant le profil le plus récent (par updated_at)
DELETE FROM public.profiles p
USING public.profiles p2
WHERE p.id <> p2.id
  AND lower(trim(p.email)) = lower(trim(p2.email))
  AND p.updated_at < p2.updated_at;

-- 3) Ajouter une contrainte UNIQUE sur l'email (après nettoyage)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_unique
UNIQUE (email);

-- 4) Créer un index pour optimiser les recherches par email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
