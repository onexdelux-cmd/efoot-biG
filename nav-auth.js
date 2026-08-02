document.addEventListener('DOMContentLoaded', async function() {
    const navLinks = document.querySelector('.nav-links');
    
    if (!navLinks) return;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            // Utilisateur connecté - remplacer "Connexion" par "Mon Profil" et "Déconnexion"
            updateNavForLoggedInUser(navLinks);
        } else {
            // Utilisateur non connecté - afficher "Connexion"
            updateNavForLoggedOutUser(navLinks);
        }

        // Écouter les changements d'état de connexion
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                updateNavForLoggedInUser(navLinks);
            } else if (event === 'SIGNED_OUT') {
                updateNavForLoggedOutUser(navLinks);
            }
        });

    } catch (error) {
        console.error('Erreur de vérification de l\'authentification:', error);
        updateNavForLoggedOutUser(navLinks);
    }

    function updateNavForLoggedInUser(navLinks) {
        // Supprimer le lien "Connexion" s'il existe
        const loginLink = navLinks.querySelector('a[href="auth.html"]');
        if (loginLink) {
            loginLink.remove();
        }

        // Ajouter "Mon Profil" s'il n'existe pas déjà
        if (!navLinks.querySelector('a[href="profile.html"]')) {
            const profileLink = document.createElement('a');
            profileLink.href = 'profile.html';
            profileLink.className = 'nav-link';
            profileLink.textContent = 'Mon Profil';
            navLinks.appendChild(profileLink);
        }

        // Ajouter "Déconnexion" s'il n'existe pas déjà
        if (!navLinks.querySelector('#logoutBtn')) {
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.id = 'logoutBtn';
            logoutLink.className = 'nav-link';
            logoutLink.textContent = 'Déconnexion';
            navLinks.appendChild(logoutLink);
        }
    }

    function updateNavForLoggedOutUser(navLinks) {
        // Supprimer "Mon Profil" et "Déconnexion" s'ils existent
        const profileLink = navLinks.querySelector('a[href="profile.html"]');
        const logoutLink = navLinks.querySelector('#logoutBtn');
        
        if (profileLink) profileLink.remove();
        if (logoutLink) logoutLink.remove();

        // Ajouter "Connexion" s'il n'existe pas déjà
        if (!navLinks.querySelector('a[href="auth.html"]')) {
            const loginLink = document.createElement('a');
            loginLink.href = 'auth.html';
            loginLink.className = 'nav-link';
            loginLink.textContent = 'Connexion';
            navLinks.appendChild(loginLink);
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
