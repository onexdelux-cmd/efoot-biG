-- Script pour créer la table likes pour les articles
-- Exécutez ce script dans l'éditeur SQL Supabase

-- 1) Créer la table likes
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    article_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, article_id)
);

-- 2) Créer les index
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_article_id ON public.likes(article_id);

-- 3) Activer Row Level Security (RLS)
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 4) Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

-- 5) Créer les nouvelles politiques RLS
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own likes"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- 6) Vérifier que la table fonctionne
SELECT 
    COUNT(*) as total_likes
FROM public.likes;
