document.addEventListener('DOMContentLoaded', function() {
    // Attendre que Supabase soit initialisé
    function waitForSupabase() {
        if (window.supabaseClient) {
            initializeLikes();
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }
    
    waitForSupabase();

    function initializeLikes() {
        const likeButtons = document.querySelectorAll('.like-btn');
        
        likeButtons.forEach(button => {
            const articleId = button.dataset.articleId;
            
            // Charger le nombre de likes et vérifier si l'utilisateur a déjà liké
            loadLikeStatus(articleId, button);
            
            // Ajouter l'événement de clic
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                await toggleLike(articleId, button);
            });
        });
    }

    async function loadLikeStatus(articleId, button) {
        try {
            // Récupérer le nombre total de likes
            const { count, error: countError } = await supabaseClient
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('article_id', articleId);

            if (!countError && count !== null) {
                const likeCount = button.querySelector('.like-count');
                likeCount.textContent = count;
            }

            // Vérifier si l'utilisateur a déjà liké
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                const { data: existingLike, error: likeError } = await supabaseClient
                    .from('likes')
                    .select('*')
                    .eq('article_id', articleId)
                    .eq('user_id', user.id)
                    .single();

                if (!likeError && existingLike) {
                    button.classList.add('liked');
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des likes:', error);
        }
    }

    async function toggleLike(articleId, button) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            if (!user) {
                alert('Vous devez être connecté pour aimer un article');
                return;
            }

            const isLiked = button.classList.contains('liked');
            const likeCount = button.querySelector('.like-count');
            const currentCount = parseInt(likeCount.textContent);

            if (isLiked) {
                // Retirer le like
                const { error } = await supabaseClient
                    .from('likes')
                    .delete()
                    .eq('article_id', articleId)
                    .eq('user_id', user.id);

                if (error) throw error;

                button.classList.remove('liked');
                likeCount.textContent = currentCount - 1;
            } else {
                // Ajouter le like
                const { error } = await supabaseClient
                    .from('likes')
                    .insert({
                        user_id: user.id,
                        article_id: articleId
                    });

                if (error) throw error;

                button.classList.add('liked');
                likeCount.textContent = currentCount + 1;
            }
        } catch (error) {
            console.error('Erreur lors du like:', error);
            alert('Erreur lors du like: ' + error.message);
        }
    }
});
