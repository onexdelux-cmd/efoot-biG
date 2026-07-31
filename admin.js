document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation de l\'interface admin...');
    
    // Email de l'administrateur (à modifier avec votre email)
    const ADMIN_EMAIL = 'onexdelux@gmail.com';
    
    const adminAccessDenied = document.getElementById('adminAccessDenied');
    const adminContent = document.getElementById('adminContent');
    const loading = document.getElementById('loading');
    const usersTable = document.getElementById('usersTable');
    const usersTableBody = document.getElementById('usersTableBody');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Statistiques
    const totalUsersEl = document.getElementById('totalUsers');
    const confirmedEmailsEl = document.getElementById('confirmedEmails');
    const activeUsersEl = document.getElementById('activeUsers');
    
    // Vérifier si l'utilisateur est l'administrateur
    async function checkAdminAccess() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            console.log('Utilisateur connecté:', user ? user.email : 'non connecté');
            console.log('Email admin attendu:', ADMIN_EMAIL);
            
            if (!user) {
                console.log('⛔ Utilisateur non connecté');
                showAccessDenied();
                return false;
            }
            
            // Vérifier si l'email correspond à l'admin
            if (user.email !== ADMIN_EMAIL) {
                console.log('⛔ Accès refusé: email non admin', user.email);
                showAccessDenied();
                return false;
            }
            
            console.log('✅ Accès admin accordé pour:', user.email);
            return true;
            
        } catch (error) {
            console.error('Erreur vérification admin:', error);
            showAccessDenied();
            return false;
        }
    }
    
    function showAccessDenied() {
        adminAccessDenied.classList.remove('hidden');
        adminContent.classList.add('hidden');
        loading.classList.add('hidden');
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }
    
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.remove('hidden');
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 5000);
    }
    
    // Charger tous les utilisateurs
    async function loadUsers() {
        try {
            console.log('Chargement des utilisateurs...');
            const { data: users, error } = await supabaseClient.rpc('list_all_users');
            
            if (error) {
                console.error('Erreur chargement utilisateurs:', error);
                showError('Erreur lors du chargement des utilisateurs: ' + error.message);
                loading.classList.add('hidden');
                return;
            }
            
            console.log('Utilisateurs chargés:', users.length);
            displayUsers(users);
            updateStats(users);
            
        } catch (error) {
            console.error('Erreur:', error);
            showError('Erreur inattendue: ' + error.message);
            loading.classList.add('hidden');
        }
    }
    
    // Afficher les utilisateurs dans le tableau
    function displayUsers(users) {
        usersTableBody.innerHTML = '';
        
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Aucun utilisateur trouvé</td></tr>';
        } else {
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td>${user.username || '-'}</td>
                    <td>${user.full_name || '-'}</td>
                    <td>${formatDate(user.created_at)}</td>
                    <td>${user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Jamais'}</td>
                    <td>${user.email_confirmed_at ? '✅ Oui' : '❌ Non'}</td>
                    <td>
                        <button class="delete-btn" onclick="deleteUser('${user.id}', '${user.email}')">
                            Supprimer
                        </button>
                    </td>
                `;
                usersTableBody.appendChild(row);
            });
        }
        
        loading.classList.add('hidden');
        usersTable.classList.remove('hidden');
    }
    
    // Mettre à jour les statistiques
    function updateStats(users) {
        totalUsersEl.textContent = users.length;
        
        const confirmed = users.filter(u => u.email_confirmed_at).length;
        confirmedEmailsEl.textContent = confirmed;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const active = users.filter(u => 
            u.last_sign_in_at && new Date(u.last_sign_in_at) > thirtyDaysAgo
        ).length;
        activeUsersEl.textContent = active;
    }
    
    // Formater la date
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Supprimer un utilisateur
    window.deleteUser = async function(userId, userEmail) {
        const confirmation = confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ?\n\nCette action est irréversible.`);
        if (!confirmation) return;
        
        const finalConfirmation = confirm(`Confirmation finale: Supprimer ${userEmail} ?`);
        if (!finalConfirmation) return;
        
        try {
            console.log('Suppression utilisateur:', userId);
            
            const { data: deleteResult, error } = await supabaseClient.rpc('delete_user', {
                user_id: userId
            });
            
            console.log('Résultat suppression:', deleteResult, error);
            
            if (error) {
                showError('Erreur lors de la suppression: ' + error.message);
                return;
            }
            
            if (deleteResult && deleteResult.success === false) {
                showError('Échec de la suppression: ' + deleteResult.message);
                return;
            }
            
            showSuccess(`Utilisateur ${userEmail} supprimé avec succès`);
            
            // Recharger la liste des utilisateurs
            loading.classList.remove('hidden');
            usersTable.classList.add('hidden');
            await loadUsers();
            
        } catch (error) {
            console.error('Erreur suppression:', error);
            showError('Erreur lors de la suppression: ' + error.message);
        }
    };
    
    // Déconnexion
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await supabaseClient.auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Erreur déconnexion:', error);
            }
        });
    }
    
    // Initialisation
    async function init() {
        const isAdmin = await checkAdminAccess();
        if (isAdmin) {
            await loadUsers();
        }
    }
    
    init();
});
