document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du système d\'authentification...');
    
    // Initialiser le logger d'activité
    let activityLogger = null;
    
    function initActivityLogger() {
        if (window.supabaseClient) {
            activityLogger = new ActivityLogger(window.supabaseClient);
            console.log('Logger d\'activité initialisé');
        }
    }

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
            initActivityLogger(); // Initialiser le logger d'activité
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

            if (data.session) {
                console.log('✅ Connexion réussie');
                showMessage('Connexion réussie ! Redirection...', 'success');
                
                // Logger la connexion
                if (activityLogger) {
                    activityLogger.logLogin();
                }
                
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            } else {
                console.log('⚠️ Session non créée');
                showMessage('Connexion réussie mais session non créée', 'warning');
            }

        } catch (error) {
            console.error('Erreur de connexion:', error);
            showMessage('Erreur de connexion: ' + error.message, 'error');
        }
    });

    // Gestion du formulaire mot de passe oublié
    const showForgotPassword = document.getElementById('showForgotPassword');
    const showLoginFromForgot = document.getElementById('showLoginFromForgot');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    if (showForgotPassword) {
        showForgotPassword.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Affichage formulaire mot de passe oublié');
            loginForm.classList.add('hidden');
            registerForm.classList.add('hidden');
            forgotPasswordForm.classList.remove('hidden');
        });
    }

    if (showLoginFromForgot) {
        showLoginFromForgot.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Retour au formulaire de connexion');
            forgotPasswordForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    // Gestion de la réinitialisation de mot de passe
    forgotPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!window.supabaseClient) {
            showMessage('Erreur: Supabase n\'est pas initialisé. Veuillez rafraîchir la page.', 'error');
            return;
        }

        const email = document.getElementById('forgotEmail').value;
        
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/auth.html?reset=true'
            });

            if (error) throw error;

            // Logger la demande de réinitialisation
            if (activityLogger) {
                activityLogger.logPasswordReset();
            }

            showMessage('Lien de réinitialisation envoyé ! Vérifiez votre email.', 'success');
            setTimeout(() => {
                forgotPasswordForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            }, 2000);

        } catch (error) {
            console.error('Erreur de réinitialisation:', error);
            showMessage('Erreur: ' + error.message, 'error');
        }
    });

    // Vérifier si l'utilisateur vient d'un lien de réinitialisation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
        showMessage('Vous pouvez maintenant définir votre nouveau mot de passe.', 'info');
    }

    // Validation de la force du mot de passe
    const registerPassword = document.getElementById('registerPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordRequirements = document.getElementById('passwordRequirements');

    if (registerPassword) {
        registerPassword.addEventListener('input', function() {
            const password = registerPassword.value;
            checkPasswordStrength(password);
        });

        // Initialiser la barre de force
        const strengthBar = document.createElement('div');
        strengthBar.className = 'password-strength-bar';
        passwordStrength.appendChild(strengthBar);
    }

    function checkPasswordStrength(password) {
        let strength = 0;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };

        // Mettre à jour les exigences visuelles
        document.getElementById('req-length').classList.toggle('valid', requirements.length);
        document.getElementById('req-uppercase').classList.toggle('valid', requirements.uppercase);
        document.getElementById('req-lowercase').classList.toggle('valid', requirements.lowercase);
        document.getElementById('req-number').classList.toggle('valid', requirements.number);
        document.getElementById('req-special').classList.toggle('valid', requirements.special);

        // Calculer la force
        strength = Object.values(requirements).filter(Boolean).length;

        // Mettre à jour la barre de force
        passwordStrength.className = 'password-strength';
        if (strength <= 1) passwordStrength.classList.add('weak');
        else if (strength <= 2) passwordStrength.classList.add('fair');
        else if (strength <= 3) passwordStrength.classList.add('good');
        else if (strength >= 4) passwordStrength.classList.add('strong');

        return strength >= 4; // Retourne true si le mot de passe est assez fort
    }

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

        if (password.length < 8) {
            showMessage('Le mot de passe doit contenir au moins 8 caractères', 'error');
            return;
        }

        // Vérifier la force du mot de passe
        if (!checkPasswordStrength(password)) {
            showMessage('Le mot de passe n\'est pas assez fort. Veuillez respecter toutes les exigences.', 'error');
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

            if (error) {
                // Gestion améliorée des erreurs de doublons
                const duplicateKeywords = [
                    'already registered',
                    'already been registered',
                    'User already registered',
                    'already exists',
                    'duplicate',
                    'already in use'
                ];
                
                const isDuplicateError = duplicateKeywords.some(keyword => 
                    error.message.toLowerCase().includes(keyword.toLowerCase())
                );
                
                if (isDuplicateError) {
                    console.log('Erreur de doublon détectée:', error.message);
                    showMessage('Cet email est déjà inscrit. Connectez-vous ou utilisez un autre email.', 'error');
                    return;
                }
                throw error;
            }

            // Logger l'inscription
            if (activityLogger) {
                activityLogger.logRegister(email);
            }

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
