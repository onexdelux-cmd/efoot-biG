document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du profil...');
    
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const profileContent = document.getElementById('profileContent');
    const profileForm = document.getElementById('profileForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarImage = document.getElementById('avatarImage');

    console.log('Éléments profil:', {
        loadingMessage: !!loadingMessage,
        errorMessage: !!errorMessage,
        profileContent: !!profileContent,
        profileForm: !!profileForm,
        logoutBtn: !!logoutBtn,
        avatarUpload: !!avatarUpload,
        avatarImage: !!avatarImage
    });

    // Attendre que Supabase soit initialisé
    function waitForSupabase() {
        if (window.supabaseClient) {
            console.log('✅ SupabaseClient disponible pour profil');
            checkAuthAndLoadProfile();
        } else {
            console.log('⏳ Attente de SupabaseClient pour profil...');
            setTimeout(waitForSupabase, 100);
        }
    }
    
    waitForSupabase();

    // Gestion de la déconnexion
    logoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
        }
    });

    // Gestion du formulaire de profil
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const fullName = document.getElementById('fullName').value;
        const bio = document.getElementById('bio').value;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            if (!user) throw new Error('Utilisateur non connecté');

            const { error } = await supabaseClient
                .from('profiles')
                .update({
                    username: username,
                    full_name: fullName,
                    bio: bio,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            alert('Profil mis à jour avec succès !');
            loadUserProfile(user.id);

        } catch (error) {
            console.error('Erreur de mise à jour:', error);
            alert('Erreur lors de la mise à jour du profil: ' + error.message);
        }
    });

    // Gestion de l'upload d'avatar
    avatarUpload.addEventListener('change', async function(e) {
        console.log('📸 Upload d\'avatar déclenché');
        const file = e.target.files[0];
        
        if (!file) {
            console.log('❌ Aucun fichier sélectionné');
            return;
        }

        console.log('📁 Fichier sélectionné:', file.name, file.size, file.type);

        try {
            console.log('🔍 Récupération de l\'utilisateur...');
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            if (!user) {
                console.error('❌ Utilisateur non connecté');
                throw new Error('Utilisateur non connecté');
            }

            console.log('✅ Utilisateur connecté:', user.id);

            // Upload du fichier vers Supabase Storage
            const fileName = `${user.id}/${Date.now()}_${file.name}`;
            console.log('📤 Upload vers Supabase Storage:', fileName);
            
            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) {
                console.error('❌ Erreur d\'upload:', uploadError);
                throw uploadError;
            }

            console.log('✅ Upload réussi:', uploadData);

            // Récupérer l'URL publique
            const { data: { publicUrl } } = supabaseClient
                .storage
                .from('avatars')
                .getPublicUrl(fileName);

            console.log('🔗 URL publique:', publicUrl);

            // Mettre à jour le profil avec l'URL de l'avatar
            console.log('🔄 Mise à jour du profil...');
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) {
                console.error('❌ Erreur de mise à jour:', updateError);
                throw updateError;
            }

            console.log('✅ Profil mis à jour');

            // Mettre à jour l'affichage
            avatarImage.src = publicUrl;
            alert('Avatar mis à jour avec succès !');

        } catch (error) {
            console.error('❌ Erreur d\'upload complète:', error);
            alert('Erreur lors de l\'upload de l\'avatar: ' + error.message);
        }
    });

    // Vérifier l'authentification et charger le profil
    async function checkAuthAndLoadProfile() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (!session) {
                showErrorMessage();
                return;
            }

            loadUserProfile(session.user.id);
            loadUserComments(session.user.id);

        } catch (error) {
            console.error('Erreur de vérification:', error);
            showErrorMessage();
        }
    }

    // Charger les données du profil
    async function loadUserProfile(userId) {
        try {
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Masquer le message de chargement
            loadingMessage.classList.add('hidden');
            
            // Afficher le contenu du profil
            profileContent.classList.remove('hidden');

            // Remplir les champs
            document.getElementById('username').value = profile.username || '';
            document.getElementById('fullName').value = profile.full_name || '';
            document.getElementById('bio').value = profile.bio || '';

            // Afficher les informations
            document.getElementById('usernameDisplay').textContent = profile.username || 'Utilisateur';
            document.getElementById('emailDisplay').textContent = profile.username || '';

            // Avatar par défaut ou personnalisé
            if (profile.avatar_url) {
                avatarImage.src = profile.avatar_url;
            } else {
                avatarImage.src = 'https://via.placeholder.com/150?text=' + (profile.username || 'User');
            }

        } catch (error) {
            console.error('Erreur de chargement du profil:', error);
            showErrorMessage();
        }
    }

    // Charger les commentaires de l'utilisateur
    async function loadUserComments(userId) {
        try {
            const { data: comments, error } = await supabaseClient
                .from('comments')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const commentsContainer = document.getElementById('userComments');
            
            if (!comments || comments.length === 0) {
                commentsContainer.innerHTML = '<p class="no-comments">Aucun commentaire pour le moment.</p>';
                return;
            }

            commentsContainer.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-item-content">${comment.content}</div>
                    <div class="comment-item-meta">
                        <span class="comment-item-date">${formatDate(comment.created_at)}</span>
                        <a href="articles.html#${comment.article_id}" class="comment-item-article">Voir l'article</a>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Erreur de chargement des commentaires:', error);
        }
    }

    // Afficher le message d'erreur
    function showErrorMessage() {
        loadingMessage.classList.add('hidden');
        errorMessage.classList.remove('hidden');
    }

    // Formater la date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});
