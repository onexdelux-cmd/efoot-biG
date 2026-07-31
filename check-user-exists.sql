-- Fonction pour vérifier si un utilisateur existe déjà par email
-- Exécutez ce script dans l'éditeur SQL Supabase

CREATE OR REPLACE FUNCTION check_user_exists(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count
    FROM auth.users
    WHERE email = user_email;
    
    RETURN user_count > 0;
END;
$$;

-- Accorder l'exécution de cette fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION check_user_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_exists(TEXT) TO anon;
