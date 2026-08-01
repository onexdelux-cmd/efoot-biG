-- Script complet pour restaurer la table comments
-- Exécutez ce script dans l'éditeur SQL Supabase

-- 1) Supprimer l'ancienne table comments si elle existe
DROP TABLE IF EXISTS public.comments CASCADE;

-- 2) Créer la table comments avec la structure correcte
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    article_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3) Créer les index pour optimiser les performances
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_article_id ON public.comments(article_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- 4) Activer Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 5) Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- 6) Créer les nouvelles politiques RLS
-- Les utilisateurs peuvent lire tous les commentaires
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

-- Les utilisateurs peuvent insérer leurs propres commentaires
CREATE POLICY "Users can insert own comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres commentaires
CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

-- 7) Insérer un commentaire de test pour vérifier
INSERT INTO public.comments (user_id, article_id, content)
SELECT 
    id,
    'pressure-proof',
    'Commentaire de test - système restauré'
FROM auth.users 
LIMIT 1;

-- 8) Vérifier que la table fonctionne
SELECT 
    c.id,
    c.article_id,
    c.content,
    c.created_at,
    c.user_id,
    p.username,
    p.full_name
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC;
