// Système de navigation unifié pour toutes les pages
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelector('.nav-links');
    const authLink = document.getElementById('authLink');
    
    if (!navLinks) return;

    // Attendre que Supabase soit initialisé
    function waitForSupabase() {
        if (window.supabaseClient) {
            initializeNavigation();
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }
    
    waitForSupabase();

    async function initializeNavigation() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session) {
                updateNavForLoggedInUser();
            } else {
                updateNavForLoggedOutUser();
            }

            // Écouter les changements d'état de connexion
            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN') {
                    updateNavForLoggedInUser();
                } else if (event === 'SIGNED_OUT') {
                    updateNavForLoggedOutUser();
                }
            });

        } catch (error) {
            console.error('Erreur de vérification de l\'authentification:', error);
            updateNavForLoggedOutUser();
        }
    }

    function updateNavForLoggedInUser() {
        // Remplacer "Connexion" par "Déconnexion"
        if (authLink) {
            authLink.textContent = 'Déconnexion';
            authLink.href = '#';
            authLink.id = 'logoutBtn';
        }

        // Ajouter le gestionnaire de déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }

    function updateNavForLoggedOutUser() {
        // Remplacer "Déconnexion" par "Connexion"
        if (authLink) {
            authLink.textContent = 'Connexion';
            authLink.href = 'auth.html';
            authLink.id = 'authLink';
        }
    }

    async function handleLogout(e) {
        e.preventDefault();
        try {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
        }
    }

    // Délégation d'événements pour le bouton de déconnexion
    navLinks.addEventListener('click', async function(e) {
        const logoutBtn = e.target.closest('#logoutBtn');
        if (logoutBtn) {
            e.preventDefault();
            try {
                await supabaseClient.auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Erreur de déconnexion:', error);
            }
        }
    });
});
