-- Fonction RPC pour lister tous les utilisateurs (admin uniquement)
-- Nécessite d'être exécutée dans l'éditeur SQL Supabase avec les droits admin

CREATE OR REPLACE FUNCTION list_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    email_confirmed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.username,
        p.created_at,
        u.last_sign_in_at,
        u.email_confirmed_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Accorder l'exécution de cette fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION list_all_users() TO authenticated;
