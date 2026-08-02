document.addEventListener('DOMContentLoaded', function() {
    // Attendre que Supabase soit initialisé
    function waitForSupabase() {
        if (window.supabaseClient) {
            initializeFeed();
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }
    
    waitForSupabase();

    function initializeFeed() {
        loadCurrentUser();
        loadFeedPosts();
        setupFeedFilters();
        setupPostCreation();
    }

    async function loadCurrentUser() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            if (user) {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile && profile.avatar_url) {
                    document.getElementById('currentUserAvatar').src = profile.avatar_url;
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'utilisateur:', error);
        }
    }

    async function loadFeedPosts() {
        try {
            const { data: posts, error } = await supabaseClient
                .from('posts')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url,
                        level
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            const feedContainer = document.getElementById('feedPosts');

            if (!posts || posts.length === 0) {
                feedContainer.innerHTML = '<div class="no-posts"><p>Aucun post pour le moment. Soyez le premier !</p></div>';
                return;
            }

            feedContainer.innerHTML = posts.map(post => createPostHTML(post)).join('');
            
            // Ajouter les événements pour les likes et commentaires
            setupPostInteractions();

        } catch (error) {
            console.error('Erreur lors du chargement du feed:', error);
            document.getElementById('feedPosts').innerHTML = '<div class="error-posts"><p>Erreur lors du chargement des posts.</p></div>';
        }
    }

    function createPostHTML(post) {
        const profile = post.profiles || {};
        const username = profile.username || 'Utilisateur';
        const avatarUrl = profile.avatar_url || `https://via.placeholder.com/40?text=${username.charAt(0).toUpperCase()}`;
        const level = profile.level || 1;

        let mediaContent = '';
        if (post.image_url) {
            if (post.post_type === 'image') {
                mediaContent = `<img src="${post.image_url}" alt="Post media" class="post-media">`;
            } else if (post.post_type === 'video') {
                mediaContent = `<video src="${post.image_url}" controls class="post-media"></video>`;
            }
        }

        let gameInfo = '';
        if (post.game_mode || post.match_result) {
            gameInfo = `
                <div class="post-game-info">
                    ${post.game_mode ? `<span class="game-mode">${post.game_mode}</span>` : ''}
                    ${post.match_result ? `<span class="match-result ${post.match_result.toLowerCase()}">${post.match_result}</span>` : ''}
                    ${post.score ? `<span class="match-score">${post.score}</span>` : ''}
                </div>
            `;
        }

        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${avatarUrl}" alt="${username}" class="avatar-small">
                    <div class="post-user-info">
                        <div class="post-user-name">
                            <span class="username">${escapeHtml(username)}</span>
                            <span class="user-level">Niveau ${level}</span>
                        </div>
                        <span class="post-date">${formatDate(post.created_at)}</span>
                    </div>
                    <button class="post-menu-btn">⋮</button>
                </div>
                
                <div class="post-content">
                    <p>${escapeHtml(post.content)}</p>
                </div>
                
                ${mediaContent}
                ${gameInfo}
                
                <div class="post-footer">
                    <button class="post-action-btn like-btn" data-post-id="${post.id}">
                        <span class="action-icon">❤️</span>
                        <span class="action-count">${post.likes_count || 0}</span>
                    </button>
                    <button class="post-action-btn comment-btn" data-post-id="${post.id}">
                        <span class="action-icon">💬</span>
                        <span class="action-count">${post.comments_count || 0}</span>
                    </button>
                    <button class="post-action-btn share-btn" data-post-id="${post.id}">
                        <span class="action-icon">🔗</span>
                        <span class="action-count">${post.shares_count || 0}</span>
                    </button>
                </div>
            </div>
        `;
    }

    function setupPostInteractions() {
        // Likes
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const postId = this.dataset.postId;
                await toggleLike(postId, this);
            });
        });

        // Commentaires
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.dataset.postId;
                // Ouvrir le modal de commentaires
                openCommentModal(postId);
            });
        });

        // Partage
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.dataset.postId;
                sharePost(postId);
            });
        });
    }

    async function toggleLike(postId, button) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            if (!user) {
                alert('Vous devez être connecté pour aimer un post');
                return;
            }

            const isLiked = button.classList.contains('liked');
            const countSpan = button.querySelector('.action-count');
            const currentCount = parseInt(countSpan.textContent);

            if (isLiked) {
                // Retirer le like
                const { error } = await supabaseClient
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id);

                if (error) throw error;

                button.classList.remove('liked');
                countSpan.textContent = currentCount - 1;

                // Mettre à jour le compteur dans la base de données
                await updatePostLikeCount(postId, -1);
            } else {
                // Ajouter le like
                const { error } = await supabaseClient
                    .from('post_likes')
                    .insert({
                        user_id: user.id,
                        post_id: postId
                    });

                if (error) throw error;

                button.classList.add('liked');
                countSpan.textContent = currentCount + 1;

                // Mettre à jour le compteur dans la base de données
                await updatePostLikeCount(postId, 1);
            }
        } catch (error) {
            console.error('Erreur lors du like:', error);
            alert('Erreur lors du like: ' + error.message);
        }
    }

    async function updatePostLikeCount(postId, change) {
        try {
            const { data: post } = await supabaseClient
                .from('posts')
                .select('likes_count')
                .eq('id', postId)
                .single();

            if (post) {
                const newCount = Math.max(0, (post.likes_count || 0) + change);
                await supabaseClient
                    .from('posts')
                    .update({ likes_count: newCount })
                    .eq('id', postId);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du compteur de likes:', error);
        }
    }

    function openCommentModal(postId) {
        // Créer et afficher un modal de commentaires
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Commentaires</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="comments-container">
                    <div class="comment-input-section">
                        <textarea class="comment-input" placeholder="Écrivez un commentaire..."></textarea>
                        <button class="btn-primary btn-small">Envoyer</button>
                    </div>
                    <div class="comments-list">
                        <p>Chargement des commentaires...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Charger les commentaires
        loadPostComments(postId, modal);

        // Fermer le modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async function loadPostComments(postId, modal) {
        try {
            const { data: comments, error } = await supabaseClient
                .from('post_comments')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const commentsList = modal.querySelector('.comments-list');

            if (!comments || comments.length === 0) {
                commentsList.innerHTML = '<p>Aucun commentaire pour le moment.</p>';
                return;
            }

            commentsList.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <img src="${comment.profiles?.avatar_url || 'https://via.placeholder.com/40'}" alt="${comment.profiles?.username}" class="avatar-small">
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-user">${escapeHtml(comment.profiles?.username || 'Utilisateur')}</span>
                            <span class="comment-date">${formatDate(comment.created_at)}</span>
                        </div>
                        <p>${escapeHtml(comment.content)}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Erreur lors du chargement des commentaires:', error);
        }
    }

    function sharePost(postId) {
        // Générer l'URL du post
        const postUrl = `${window.location.origin}/post/${postId}`;
        
        // Copier dans le presse-papier
        navigator.clipboard.writeText(postUrl).then(() => {
            alert('Lien copié dans le presse-papier !');
        }).catch(() => {
            // Fallback pour les navigateurs qui ne supportent pas l'API clipboard
            prompt('Copiez ce lien:', postUrl);
        });
    }

    function setupFeedFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.textContent;
                loadFilteredPosts(filter);
            });
        });
    }

    async function loadFilteredPosts(filter) {
        // Implémenter le filtrage des posts selon le filtre sélectionné
        // Pour l'instant, recharger tous les posts
        loadFeedPosts();
    }

    function setupPostCreation() {
        const postBtn = document.getElementById('feedPostBtn');
        const postContent = document.getElementById('feedPostContent');

        postBtn.addEventListener('click', async function() {
            const content = postContent.value.trim();
            
            if (!content) {
                alert('Veuillez entrer du contenu pour votre post');
                return;
            }

            await createFeedPost(content);
        });
    }

    async function createFeedPost(content) {
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
            document.getElementById('feedPostContent').value = '';

            // Recharger le feed
            loadFeedPosts();

            // Mettre à jour le compteur de posts de l'utilisateur
            updatePostCount(user.id);

            alert('Post publié avec succès !');
        } catch (error) {
            console.error('Erreur lors de la création du post:', error);
            alert('Erreur lors de la création du post: ' + error.message);
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
        } catch (error) {
            console.error('Erreur lors de la mise à jour du compteur de posts:', error);
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
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
       如果 (diffDays < 7) return `Il y a ${diffDays} j`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    }
});
