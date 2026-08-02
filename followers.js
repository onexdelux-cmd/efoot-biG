document.addEventListener('DOMContentLoaded', function() {
    // Attendre que Supabase soit initialisé
    function waitForSupabase() {
        if (window.supabaseClient) {
            initializeFollowersSystem();
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }
    
    waitForSupabase();

    function initializeFollowersSystem() {
        setupFollowButtons();
        setupFollowersList();
        setupFollowingList();
    }

    function setupFollowButtons() {
        // Ajouter des boutons de follow sur les profils
        document.addEventListener('click', async function(e) {
            if (e.target.classList.contains('follow-btn')) {
                const userId = e.target.dataset.userId;
                await toggleFollow(userId, e.target);
            }
        });
    }

    async function toggleFollow(targetUserId, button) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            if (!user) {
                alert('Vous devez être connecté pour suivre un utilisateur');
                return;
            }

            if (user.id === targetUserId) {
                alert('Vous ne pouvez pas vous suivre vous-même');
                return;
            }

            const isFollowing = button.classList.contains('following');

            if (isFollowing) {
                // Ne plus suivre
                const { error } = await supabaseClient
                    .from('followers')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', targetUserId);

                if (error) throw error;

                button.classList.remove('following');
                button.textContent = 'Suivre';
                
                // Mettre à jour les compteurs
                await updateFollowCounts(targetUserId, -1, 'followers');
                await updateFollowCounts(user.id, -1, 'following');

            } else {
                // Suivre
                const { error } = await supabaseClient
                    .from('followers')
                    .insert({
                        follower_id: user.id,
                        following_id: targetUserId
                    });

                if (error) throw error;

                button.classList.add('following');
                button.textContent = 'Suivi';
                
                // Créer une notification
                await createFollowNotification(user.id, targetUserId);
                
                // Mettre à jour les compteurs
                await updateFollowCounts(targetUserId, 1, 'followers');
                await updateFollowCounts(user.id, 1, 'following');
            }

        } catch (error) {
            console.error('Erreur lors du follow/unfollow:', error);
            alert('Erreur: ' + error.message);
        }
    }

    async function updateFollowCounts(userId, change, type) {
        try {
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select(type === 'followers' ? 'followers_count' : 'following_count')
                .eq('id', userId)
                .single();

            if (profile) {
                const currentCount = profile[type === 'followers' ? 'followers_count' : 'following_count'] || 0;
                const newCount = Math.max(0, currentCount + change);

                await supabaseClient
                    .from('profiles')
                    .update({ [type === 'followers' ? 'followers_count' : 'following_count']: newCount })
                    .eq('id', userId);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des compteurs:', error);
        }
    }

    async function createFollowNotification(followerId, followingId) {
        try {
            await supabaseClient
                .from('notifications')
                .insert({
                    user_id: followingId,
                    type: 'follow',
                    actor_id: followerId,
                    content: 'a commencé à vous suivre'
                });
        } catch (error) {
            console.error('Erreur lors de la création de la notification:', error);
        }
    }

    async function setupFollowersList() {
        // Charger la liste des abonnés si on est sur une page de profil
        const followersListElement = document.getElementById('followersList');
        if (followersListElement) {
            const profileUserId = followersListElement.dataset.userId;
            if (profileUserId) {
                await loadFollowers(profileUserId);
            }
        }
    }

    async function loadFollowers(userId) {
        try {
            const { data: followers, error } = await supabaseClient
                .from('followers')
                .select(`
                    follower_id,
                    profiles:follower_id (
                        username,
                        avatar_url,
                        level,
                        followers_count
                    )
                `)
                .eq('following_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const followersListElement = document.getElementById('followersList');

            if (!followers || followers.length === 0) {
                followersListElement.innerHTML = '<p class="no-followers">Aucun abonné pour le moment.</p>';
                return;
            }

            followersListElement.innerHTML = followers.map(follow => `
                <div class="follower-item">
                    <img src="${follow.profiles?.avatar_url || 'https://via.placeholder.com/40'}" alt="${follow.profiles?.username}" class="avatar-small">
                    <div class="follower-info">
                        <h4>${escapeHtml(follow.profiles?.username || 'Utilisateur')}</h4>
                        <p>Niveau ${follow.profiles?.level || 1} • ${follow.profiles?.followers_count || 0} abonnés</p>
                    </div>
                    <button class="btn-small follow-btn" data-user-id="${follow.follower_id}">Suivre</button>
                </div>
            `).join('');

            // Réinitialiser les boutons de follow
            setupFollowButtons();

        } catch (error) {
            console.error('Erreur lors du chargement des abonnés:', error);
        }
    }

    async function setupFollowingList() {
        // Charger la liste des abonnements si on est sur une page de profil
        const followingListElement = document.getElementById('followingList');
        if (followingListElement) {
            const profileUserId = followingListElement.dataset.userId;
            if (profileUserId) {
                await loadFollowing(profileUserId);
            }
        }
    }

    async function loadFollowing(userId) {
        try {
            const { data: following, error } = await supabaseClient
                .from('followers')
                .select(`
                    following_id,
                    profiles:following_id (
                        username,
                        avatar_url,
                        level,
                        followers_count
                    )
                `)
                .eq('follower_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const followingListElement = document.getElementById('followingList');

            if (!following || following.length === 0) {
                followingListElement.innerHTML = '<p class="no-following">Aucun abonnement pour le moment.</p>';
                return;
            }

            followingListElement.innerHTML = following.map(follow => `
                <div class="following-item">
                    <img src="${follow.profiles?.avatar_url || 'https://via.placeholder.com/40'}" alt="${follow.profiles?.username}" class="avatar-small">
                    <div class="following-info">
                        <h4>${escapeHtml(follow.profiles?.username || 'Utilisateur')}</h4>
                        <p>Niveau ${follow.profiles?.level || 1} • ${follow.profiles?.followers_count || 0} abonnés</p>
                    </div>
                    <button class="btn-small follow-btn following" data-user-id="${follow.following_id}">Suivi</button>
                </div>
            `).join('');

            // Réinitialiser les boutons de follow
            setupFollowButtons();

        } catch (error) {
            console.error('Erreur lors du chargement des abonnements:', error);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
