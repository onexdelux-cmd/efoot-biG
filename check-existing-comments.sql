-- Vérifier les commentaires existants dans la base de données
-- Exécutez ce script dans l'éditeur SQL Supabase

-- 1) Vérifier si la table comments existe et a des données
SELECT COUNT(*) as total_comments FROM public.comments;

-- 2) Voir tous les commentaires avec les infos utilisateur
SELECT 
    c.id,
    c.article_id,
    c.content,
    c.created_at,
    c.user_id,
    p.username,
    p.full_name,
    p.email
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC;

-- 3) Vérifier les commentaires par article
SELECT 
    article_id,
    COUNT(*) as comment_count,
    MAX(created_at) as latest_comment
FROM public.comments
GROUP BY article_id
ORDER BY latest_comment DESC;
