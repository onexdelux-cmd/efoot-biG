-- Fonction RPC améliorée pour supprimer un utilisateur et toutes ses données
-- Cette fonction supprime : commentaires, profil, et compte auth
-- Nécessite d'être exécutée dans l'éditeur SQL Supabase avec les droits admin

DROP FUNCTION IF EXISTS delete_user(UUID);

CREATE FUNCTION delete_user(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '{"success": false, "message": ""}'::JSONB;
    comments_count INTEGER;
    profile_count INTEGER;
BEGIN
    -- Supprimer les commentaires de l'utilisateur
    DELETE FROM public.comments WHERE user_id = user_id;
    GET DIAGNOSTICS comments_count = ROW_COUNT;
    
    -- Supprimer le profil de l'utilisateur
    DELETE FROM public.profiles WHERE id = user_id;
    GET DIAGNOSTICS profile_count = ROW_COUNT;
    
    -- Supprimer l'utilisateur de la table auth.users
    DELETE FROM auth.users WHERE id = user_id;
    
    -- Vérifier si la suppression a réussi
    IF NOT FOUND THEN
        result := jsonb_build_object(
            'success', false,
            'message', 'Utilisateur non trouvé ou déjà supprimé',
            'comments_deleted', comments_count,
            'profile_deleted', profile_count
        );
    ELSE
        result := jsonb_build_object(
            'success', true,
            'message', 'Utilisateur supprimé avec succès',
            'comments_deleted', comments_count,
            'profile_deleted', profile_count
        );
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'message', 'Erreur: ' || SQLERRM,
            'comments_deleted', comments_count,
            'profile_deleted', profile_count
        );
        RETURN result;
END;
$$;

-- Accorder l'exécution de cette fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;
