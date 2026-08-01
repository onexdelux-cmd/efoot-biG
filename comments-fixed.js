document.addEventListener('DOMContentLoaded', function() {
    // Gérer chaque section de commentaires indépendamment
    const commentsSections = document.querySelectorAll('.comments-section');
    
    // Attendre que Supabase soit initialisé
    function waitForSupabase() {
        if (window.supabaseClient) {
            initializeCommentsSections();
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }
    
    waitForSupabase();

    function initializeCommentsSections() {
        commentsSections.forEach(commentsSection => {
            const articleId = commentsSection.dataset.articleId;
            
            if (!articleId) {
                console.error('ID d\'article non trouvé dans la section');
                return;
            }
            
            const commentForm = commentsSection.querySelector('.comment-form');
            const commentAuthMessage = commentsSection.querySelector('.comment-auth-message');
            const commentContent = commentsSection.querySelector('.comment-content');
            const commentsList = commentsSection.querySelector('.comments-list');

            if (!commentForm || !commentsList) {
                console.error('Éléments manquants dans la section de commentaires');
                return;
            }

            // Gestion du formulaire de commentaire
            commentForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const content = commentContent.value.trim();
                
                if (!content) {
                    alert('Veuillez entrer un commentaire');
                    return;
                }

                try {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    
                    if (!user) {
                        alert('Vous devez être connecté pour commenter');
                        return;
                    }

                    // Ajouter le commentaire
                    const { data: comment, error } = await supabaseClient
                        .from('comments')
                        .insert({
                            user_id: user.id,
                            article_id: articleId,
                            content: content
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    // Réinitialiser le formulaire
                    commentContent.value = '';
                    
                    // Recharger les commentaires avec l'ID utilisateur
                    window.loadComments(articleId, user.id, commentsList);
                    
                    alert('Commentaire publié avec succès !');

                } catch (error) {
                    console.error('Erreur lors de la publication du commentaire:', error);
                    alert('Erreur lors de la publication du commentaire: ' + error.message);
                }
            });

            // Vérifier l'authentification et charger les commentaires
            checkAuthAndLoadComments(articleId, commentAuthMessage, commentForm, commentsList);
        });
    }

    async function checkAuthAndLoadComments(articleId, commentAuthMessage, commentForm, commentsList) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session) {
                // Utilisateur connecté - afficher le formulaire
                if (commentAuthMessage) commentAuthMessage.classList.add('hidden');
                if (commentForm) commentForm.classList.remove('hidden');
            } else {
                // Utilisateur non connecté - cacher le formulaire et afficher le message
                if (commentAuthMessage) commentAuthMessage.classList.remove('hidden');
                if (commentForm) commentForm.classList.add('hidden');
            }

            // Charger les commentaires avec l'ID utilisateur connecté
            const userId = session ? session.user.id : null;
            window.loadComments(articleId, userId, commentsList);

        } catch (error) {
            console.error('Erreur de vérification:', error);
        }
    }

    // Charger les commentaires de l'article
    window.loadComments = async function(articleId, currentUserId = null, commentsList) {
        try {
            const { data: comments, error } = await supabaseClient
                .from('comments')
                .select('*')
                .eq('article_id', articleId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!comments || comments.length === 0) {
                commentsList.innerHTML = '<p class="no-comments">Aucun commentaire pour le moment. Soyez le premier !</p>';
                return;
            }
            commentsList.innerHTML = comments.map(comment => {
                const username = 'Utilisateur';
                const avatarUrl = `https://via.placeholder.com/40?text=U`;
                
                // Vérifier si l'utilisateur connecté est l'auteur du commentaire
                const isAuthor = currentUserId && comment.user_id === currentUserId;
                
                return `
                    <div class="comment-item" data-comment-id="${comment.id}">
                        <div class="comment-header">
                            <img src="${avatarUrl}" alt="${username}" class="comment-avatar">
                            <div class="comment-user-info">
                                <div class="comment-username">${escapeHtml(username)}</div>
                                <div class="comment-date">${formatDate(comment.created_at)}</div>
                            </div>
                        </div>
                        <div class="comment-content">${escapeHtml(comment.content)}</div>
                        <div class="comment-actions">
                            ${isAuthor ? `<button class="comment-action-btn" onclick="deleteComment('${comment.id}', '${articleId}')">Supprimer</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Erreur de chargement des commentaires:', error);
            commentsList.innerHTML = '<p class="no-comments">Erreur lors du chargement des commentaires.</p>';
        }
    }

    // Supprimer un commentaire
    window.deleteComment = async function(commentId, articleId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
            return;
        }

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            if (!user) {
                alert('Vous devez être connecté pour supprimer un commentaire');
                return;
            }

            const { error } = await supabaseClient
                .from('comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', user.id);

            if (error) throw error;

            // Trouver la section de commentaires correspondante et recharger
            const commentsSection = document.querySelector(`[data-article-id="${articleId}"]`);
            if (commentsSection) {
                const commentsList = commentsSection.querySelector('.comments-list');
                window.loadComments(articleId, user.id, commentsList);
            }
            
            alert('Commentaire supprimé avec succès !');

        } catch (error) {
            console.error('Erreur lors de la suppression du commentaire:', error);
            alert('Erreur lors de la suppression du commentaire: ' + error.message);
        }
    };

    // Échapper le HTML pour éviter les injections XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Formater la date
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
