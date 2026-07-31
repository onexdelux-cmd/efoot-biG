-- Table des logs d'activité utilisateur
-- Exécutez ce script dans l'éditeur SQL Supabase

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Activer RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Users can view their own logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique admin pour voir tous les logs (optionnel)
CREATE POLICY "Admins can view all logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.username IN ('admin', 'moderator')
    )
  );

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Fonction pour logger automatiquement les activités
CREATE OR REPLACE FUNCTION log_activity(user_action TEXT, log_details JSONB DEFAULT '{}')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent)
    VALUES (
        auth.uid(),
        user_action,
        log_details,
        current_setting('request.headers', true)::json->>'x-client-ip',
        current_setting('request.headers', true)::json->>'user-agent'
    );
END;
$$;

-- Accorder l'exécution de la fonction
GRANT EXECUTE ON FUNCTION log_activity(TEXT, JSONB) TO authenticated;
