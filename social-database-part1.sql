-- Partie 1: Extension de la table profiles
-- Exécutez d'abord cette partie

ALTER TABLE public.profiles ADD COLUMN bio TEXT;
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN cover_image_url TEXT;
ALTER TABLE public.profiles ADD COLUMN favorite_team TEXT;
ALTER TABLE public.profiles ADD COLUMN play_style TEXT;
ALTER TABLE public.profiles ADD COLUMN region TEXT;
ALTER TABLE public.profiles ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN posts_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
