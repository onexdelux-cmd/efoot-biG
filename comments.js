document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du système de commentaires...');
    
    const commentForm = document.getElementById('commentForm');
    const commentAuthMessage = document.getElementById('commentAuthMessage');
    const commentContent = document.getElementById('commentContent');
    const commentsList = document.getElementById('commentsList');
    const commentsSection = document.querySelector('.comments-section');
    
    console.log('Éléments commentaires:', {
        commentForm: !!commentForm,
        commentAuthMessage: !!commentAuthMessage,
        commentContent: !!commentContent,
        commentsList: !!commentsList,
        commentsSection: !!commentsSection
    });
    
    // Récupérer l'ID de l'article
    const articleId = commentsSection ? commentsSection.dataset.articleId : null;
    
    if (!articleId) {
        console.error('ID d\'article non trouvé');
        return;
    }

    console.log('ID de l\'article:', articleId);

    // Attendre que Supabase soit initialisé
    function waitForSupabase() {
        if (window.supabaseClient) {
            console.log('✅ SupabaseClient disponible pour commentaires');
            checkAuthAndLoadComments();
        } else {
            console.log('⏳ Attente de SupabaseClient pour commentaires...');
            setTimeout(waitForSupabase, 100);
        }
    }
    
    waitForSupabase();

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

            // Récupérer le profil de l'utilisateur
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

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
            
            // Recharger les commentaires
            loadComments(articleId);
            
            alert('Commentaire publié avec succès !');

        } catch (error) {
            console.error('Erreur lors de la publication du commentaire:', error);
            alert('Erreur lors de la publication du commentaire: ' + error.message);
        }
    });

    // Vérifier l'authentification et charger les commentaires
    async function checkAuthAndLoadComments() {
        try {
            console.log('🔍 Vérification de l\'authentification pour commentaires...');
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            console.log('Session:', session ? '✅ Utilisateur connecté' : '❌ Utilisateur non connecté');
            
            if (session) {
                // Utilisateur connecté - afficher le formulaire (déjà visible par défaut)
                console.log('Utilisateur connecté - formulaire visible');
                commentAuthMessage.classList.add('hidden');
                commentForm.classList.remove('hidden');
            } else {
                // Utilisateur non connecté - cacher le formulaire et afficher le message
                console.log('Utilisateur non connecté - afficher message et cacher formulaire');
                commentAuthMessage.classList.remove('hidden');
                commentForm.classList.add('hidden');
            }

            // Charger les commentaires
            loadComments(articleId);

        } catch (error) {
            console.error('Erreur de vérification:', error);
        }
    }

    // Charger les commentaires de l'article
    async function loadComments(articleId) {
        try {
            const { data: comments, error } = await supabaseClient
                .from('comments')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url,
                        full_name
                    )
                `)
                .eq('article_id', articleId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!comments || comments.length === 0) {
                commentsList.innerHTML = '<p class="no-comments">Aucun commentaire pour le moment. Soyez le premier !</p>';
                return;
            }

            commentsList.innerHTML = comments.map(comment => {
                const profile = comment.profiles || {};
                const username = profile.username || profile.full_name || 'Utilisateur';
                const avatarUrl = profile.avatar_url || `https://via.placeholder.com/40?text=${username.charAt(0).toUpperCase()}`;
                
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
                            <button class="comment-action-btn" onclick="deleteComment('${comment.id}')">Supprimer</button>
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
    window.deleteComment = async function(commentId) {
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

            // Recharger les commentaires
            loadComments(articleId);
            
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
