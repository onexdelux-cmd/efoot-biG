// Script de diagnostic pour la configuration Supabase
// Ajoutez ce script temporairement dans articles.html avant comments.js

console.log('=== DIAGNOSTIC SUPABASE CONFIG ===');

// 1) Vérifier si Supabase est chargé
if (window.supabase) {
    console.log('✅ Supabase library chargée');
} else {
    console.error('❌ Supabase library NON chargée');
}

// 2) Vérifier le client Supabase
if (window.supabaseClient) {
    console.log('✅ SupabaseClient disponible');
    console.log('Config:', {
        url: window.supabaseClient.supabaseUrl,
        hasKey: !!window.supabaseClient.supabaseKey
    });
} else {
    console.error('❌ SupabaseClient NON disponible');
}

// 3) Tester la connexion
if (window.supabaseClient) {
    window.supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
        console.log('Session test:', { session, error });
    });
    
    // Tester une requête simple
    window.supabaseClient
        .from('comments')
        .select('count')
        .then(({ data, error }) => {
            console.log('Test requête comments:', { data, error });
        });
}
