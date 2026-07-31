// Configuration Supabase
const SUPABASE_URL = 'https://ncovozhxeuqgrmttgwwh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GwdMv51Znppk6lRK-_jJKg_J3CRMr-5';

// Initialisation du client Supabase avec vérification
let supabaseClient;

if (typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialisé via window.supabase');
} else if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialisé via module global');
} else {
    console.error('Supabase non disponible - vérifiez que le CDN est chargé');
}

// Export pour utilisation dans d'autres fichiers
window.supabaseClient = supabaseClient;
