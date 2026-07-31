-- Fonction RPC pour supprimer un utilisateur auth
-- Cette fonction permet de supprimer un compte utilisateur via l'API Supabase
-- Nécessite d'être exécutée dans l'éditeur SQL Supabase avec les droits admin

CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Supprimer l'utilisateur de la table auth.users
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Accorder l'exécution de cette fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;
