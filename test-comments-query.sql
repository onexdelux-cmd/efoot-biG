-- Script de diagnostic pour tester la requête comments
-- Exécutez ce script dans l'éditeur SQL Supabase

-- 1) Tester la requête simple sur la table comments
SELECT * FROM public.comments WHERE article_id = 'grand-finale-juninho-comkhata';

-- 2) Tester la requête avec jointure profiles
SELECT 
    c.*,
    p.username,
    p.full_name,
    p.avatar_url
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
WHERE c.article_id = 'grand-finale-juninho-comkhata';

-- 3) Tester si la table profiles a des données
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 4) Vérifier les politiques RLS actives
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'comments';

-- 5) Tester l'accès avec l'utilisateur actuel
-- Cela simule ce que fait le frontend
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
ORDER BY c.created_at DESC
LIMIT 10;
