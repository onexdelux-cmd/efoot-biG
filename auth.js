document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation...');
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authMessage = document.getElementById('authMessage');

    console.log('Éléments trouvés:', {
        loginForm: !!loginForm,
        registerForm: !!registerForm,
        showRegister: !!showRegister,
        showLogin: !!showLogin,
        authTitle: !!authTitle,
        authSubtitle: !!authSubtitle,
        authMessage: !!authMessage
    });

    if (!loginForm || !registerForm || !showRegister || !showLogin) {
        console.error('Certains éléments du formulaire n\'ont pas été trouvés');
        return;
    }

    // Attendre que Supabase soit initialisé (initialisé dans HTML)
    function waitForSupabase() {
        if (window.supabaseClient) {
            console.log('✅ SupabaseClient disponible, initialisation terminée');
            checkAuthStatus();
        } else {
            console.log('⏳ Attente de SupabaseClient...');
            setTimeout(waitForSupabase, 100);
        }
    }
    
    // Commencer l'attente
    waitForSupabase();

    // Basculer entre formulaire de connexion et d'inscription
    showRegister.addEventListener('click', function(e) {
        console.log('Clic sur S\'inscrire');
        e.preventDefault();
        e.stopPropagation();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authTitle.textContent = 'Inscription';
        authSubtitle.textContent = 'Créez votre compte pour rejoindre la communauté';
        hideMessage();
        console.log('Formulaire d\'inscription affiché');
    });

    showLogin.addEventListener('click', function(e) {
        console.log('Clic sur Se connecter');
        e.preventDefault();
        e.stopPropagation();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authTitle.textContent = 'Connexion';
        authSubtitle.textContent = 'Connectez-vous pour accéder à votre profil';
        hideMessage();
        console.log('Formulaire de connexion affiché');
    });

    // Gestion de la connexion
    loginForm.addEventListener('submit', async function(e) {
        console.log('Tentative de connexion...');
        e.preventDefault();
        e.stopPropagation();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        console.log('Email:', email);
        console.log('Mot de passe:', password ? '***' : 'vide');

        if (!email || !password) {
            showMessage('Veuillez remplir tous les champs', 'error');
            return;
        }

        try {
            console.log('Appel à Supabase...');
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            console.log('Réponse Supabase:', { data, error });

            if (error) throw error;

            showMessage('Connexion réussie ! Redirection...', 'success');
            
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);

        } catch (error) {
            console.error('Erreur de connexion:', error);
            showMessage('Erreur de connexion: ' + error.message, 'error');
        }
    });

    // Gestion de l'inscription
    registerForm.addEventListener('submit', async function(e) {
        console.log('Tentative d\'inscription...');
        e.preventDefault();
        e.stopPropagation();
        
        if (!window.supabaseClient) {
            console.error('SupabaseClient non disponible');
            showMessage('Erreur: Supabase n\'est pas initialisé. Veuillez rafraîchir la page.', 'error');
            return;
        }
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const username = document.getElementById('registerUsername').value;

        console.log('Email:', email);
        console.log('Mot de passe:', password ? '***' : 'vide');

        // Validation des mots de passe
        if (password !== confirmPassword) {
            showMessage('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }

        try {
            console.log('Appel à Supabase pour inscription...');
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username || email.split('@')[0],
                        full_name: username || ''
                    }
                }
            });

            console.log('Réponse Supabase inscription:', { data, error });

            if (error) throw error;

            if (data.user && !data.session) {
                showMessage('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.', 'info');
            } else {
                showMessage('Inscription réussie ! Redirection...', 'success');
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            }

        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            showMessage('Erreur d\'inscription: ' + error.message, 'error');
        }
    });

    // Vérifier le statut d'authentification
    async function checkAuthStatus() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session) {
                showMessage('Vous êtes déjà connecté. Redirection...', 'info');
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Erreur de vérification:', error);
        }
    }

    // Afficher un message
    function showMessage(message, type) {
        authMessage.textContent = message;
        authMessage.className = 'auth-message ' + type;
        authMessage.classList.remove('hidden');
    }

    // Masquer le message
    function hideMessage() {
        authMessage.classList.add('hidden');
    }
});
