document.addEventListener('DOMContentLoaded', function() {
    // Attendre que Supabase soit initialisé
    function waitForSupabase() {
        if (window.supabaseClient) {
            initializeSocialProfile();
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }
    
    waitForSupabase();

    function initializeSocialProfile() {
        loadUserProfile();
        setupProfileNavigation();
        setupEditProfileModal();
        setupPostCreation();
        setupAvatarUpload();
        setupCoverUpload();
    }

    async function loadUserProfile() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            if (!user) {
                document.getElementById('errorMessage').classList.remove('hidden');
                document.getElementById('loadingMessage').classList.add('hidden');
                return;
            }

            // Charger le profil depuis Supabase
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // Afficher les informations du profil
            document.getElementById('usernameDisplay').textContent = profile.username || 'Utilisateur';
            document.getElementById('bioDisplay').textContent = profile.bio || '';
            
            if (profile.favorite_team) {
                document.getElementById('teamDisplay').textContent = profile.favorite_team;
            }
            
            if (profile.region) {
                document.getElementById('regionDisplay').textContent = getRegionName(profile.region);
            }

            // Afficher les statistiques
            document.getElementById('followersCount').textContent = profile.followers_count || 0;
            document.getElementById('followingCount').textContent = profile.following_count || 0;
            document.getElementById('postsCount').textContent = profile.posts_count || 0;
            document.getElementById('levelDisplay').textContent = profile.level || 1;

            // Afficher l'avatar
            if (profile.avatar_url) {
                document.getElementById('avatarImage').src = profile.avatar_url;
            }

            // Afficher la couverture
            if (profile.cover_image_url) {
                document.getElementById('coverImage').src = profile.cover_image_url;
            }

            // Badge vérifié
            if (profile.is_verified) {
                document.getElementById('verifiedBadge').classList.remove('hidden');
            }

            // Masquer le message de chargement et afficher le contenu
            document.getElementById('loadingMessage').classList.add('hidden');
            document.getElementById('profileContent').classList.remove('hidden');

            // Charger les posts de l'utilisateur
            loadUserPosts(user.id);

        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
            document.getElementById('errorMessage').classList.remove('hidden');
            document.getElementById('loadingMessage').classList.add('hidden');
        }
    }

    function getRegionName(region) {
        const regions = {
            'europe': 'Europe',
            'americas': 'Amériques',
            'asia': 'Asie',
            'africa': 'Afrique',
            'oceania': 'Océanie'
        };
        return regions[region] || region;
    }

    function setupProfileNavigation() {
        const navButtons = document.querySelectorAll('.profile-nav-btn');
        const tabs = document.querySelectorAll('.profile-tab');

        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.dataset.tab;

                // Désactiver tous les boutons et onglets
                navButtons.forEach(btn => btn.classList.remove('active'));
                tabs.forEach(tab => tab.classList.remove('active'));

                // Activer le bouton et l'onglet correspondants
                this.classList.add('active');
                document.getElementById(tabName + 'Tab').classList.add('active');
            });
        });
    }

    function setupEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        const editBtn = document.getElementById('editProfileBtn');
        const closeBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        const form = document.getElementById('editProfileForm');

        editBtn.addEventListener('click', function() {
            modal.classList.remove('hidden');
            loadProfileDataIntoForm();
        });

        closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });

        cancelBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveProfileChanges();
        });

        // Fermer le modal en cliquant à l'extérieur
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    async function loadProfileDataIntoForm() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                document.getElementById('editUsername').value = profile.username || '';
                document.getElementById('editFullName').value = profile.full_name || '';
                document.getElementById('editBio').value = profile.bio || '';
                document.getElementById('editFavoriteTeam').value = profile.favorite_team || '';
                document.getElementById('editPlayStyle').value = profile.play_style || '';
                document.getElementById('editRegion').value = profile.region || '';
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données du profil:', error);
        }
    }

    async function saveProfileChanges() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            // Pour l'instant, ne mettre à jour que les champs de base qui existent
            const profileData = {
                username: document.getElementById('editUsername').value,
                full_name: document.getElementById('editFullName').value,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabaseClient
                .from('profiles')
                .update(profileData)
                .eq('id', user.id);

            if (error) throw error;

            // Fermer le modal et recharger le profil
            document.getElementById('editProfileModal').classList.add('hidden');
            loadUserProfile();

            alert('Profil mis à jour avec succès !');
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            alert('Erreur lors de la mise à jour du profil: ' + error.message);
        }
    }

    function setupPostCreation() {
        const postBtn = document.getElementById('postBtn');
        const postContent = document.getElementById('newPostContent');

        postBtn.addEventListener('click', async function() {
            const content = postContent.value.trim();
            
            if (!content) {
                alert('Veuillez entrer du contenu pour votre post');
                return;
            }

            await createPost(content);
        });
    }

    async function createPost(content) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            const { data: post, error } = await supabaseClient
                .from('posts')
                .insert({
                    user_id: user.id,
                    content: content,
                    post_type: 'text'
                })
                .select()
                .single();

            if (error) throw error;

            // Réinitialiser le champ de texte
            document.getElementById('newPostContent').value = '';

            // Recharger les posts
            loadUserPosts(user.id);

            // Mettre à jour le compteur de posts
            updatePostCount(user.id);

            alert('Post publié avec succès !');
        } catch (error) {
            console.error('Erreur lors de la création du post:', error);
            alert('Erreur lors de la création du post: ' + error.message);
        }
    }

    async function loadUserPosts(userId) {
        try {
            const { data: posts, error } = await supabaseClient
                .from('posts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const postsContainer = document.getElementById('userPosts');

            if (!posts || posts.length === 0) {
                postsContainer.innerHTML = '<p class="no-posts">Aucun post pour le moment. Soyez le premier !</p>';
                return;
            }

            postsContainer.innerHTML = posts.map(post => `
                <div class="post-card">
                    <div class="post-content">${escapeHtml(post.content)}</div>
                    <div class="post-meta">
                        <span class="post-date">${formatDate(post.created_at)}</span>
                        <div class="post-stats">
                            <span class="post-stat">❤️ ${post.likes_count || 0}</span>
                            <span class="post-stat">💬 ${post.comments_count || 0}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Erreur lors du chargement des posts:', error);
        }
    }

    async function updatePostCount(userId) {
        try {
            const { count } = await supabaseClient
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            await supabaseClient
                .from('profiles')
                .update({ posts_count: count || 0 })
                .eq('id', userId);

            document.getElementById('postsCount').textContent = count || 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du compteur de posts:', error);
        }
    }

    function setupAvatarUpload() {
        const avatarUpload = document.getElementById('avatarUpload');
        
        avatarUpload.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                await uploadAvatar(file);
            }
        });
    }

    async function uploadAvatar(file) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            const fileName = `${user.id}-${Date.now()}`;
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Mettre à jour le profil
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Mettre à jour l'affichage
            document.getElementById('avatarImage').src = publicUrl;

            alert('Avatar mis à jour avec succès !');
        } catch (error) {
            console.error('Erreur lors du téléchargement de l\'avatar:', error);
            alert('Erreur lors du téléchargement de l\'avatar: ' + error.message);
        }
    }

    function setupCoverUpload() {
        const coverUpload = document.getElementById('coverUpload');
        
        coverUpload.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                await uploadCover(file);
            }
        });
    }

    async function uploadCover(file) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            const fileName = `${user.id}-cover-${Date.now()}`;
            const { error: uploadError } = await supabaseClient.storage
                .from('covers')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabaseClient.storage
                .from('covers')
                .getPublicUrl(fileName);

            // Mettre à jour le profil
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ cover_image_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Mettre à jour l'affichage
            document.getElementById('coverImage').src = publicUrl;

            alert('Couverture mise à jour avec succès !');
        } catch (error) {
            console.error('Erreur lors du téléchargement de la couverture:', error);
            alert('Erreur lors du téléchargement de la couverture: ' + error.message);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
});
