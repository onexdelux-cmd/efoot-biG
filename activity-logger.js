// Module de logging d'activité utilisateur
// Intégrez ce fichier dans vos pages pour tracer les actions importantes

class ActivityLogger {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Logger une activité utilisateur
     * @param {string} action - Type d'action (login, register, comment, profile_update, etc.)
     * @param {object} details - Détails supplémentaires de l'action
     */
    async log(action, details = {}) {
        try {
            const { error } = await this.supabase.rpc('log_activity', {
                user_action: action,
                log_details: details
            });

            if (error) {
                console.error('Erreur logging activité:', error);
            }
        } catch (error) {
            console.error('Exception logging activité:', error);
        }
    }

    // Méthodes de logging spécifiques
    async logLogin() {
        await this.log('login', { timestamp: new Date().toISOString() });
    }

    async logRegister(email) {
        await this.log('register', { email: email.substring(0, 3) + '***' });
    }

    async logLogout() {
        await this.log('logout', { timestamp: new Date().toISOString() });
    }

    async logComment(articleId, contentLength) {
        await this.log('comment', { 
            article_id: articleId,
            content_length: contentLength 
        });
    }

    async logProfileUpdate(fields) {
        await this.log('profile_update', { 
            updated_fields: Object.keys(fields)
        });
    }

    async logAvatarUpload() {
        await this.log('avatar_upload', { timestamp: new Date().toISOString() });
    }

    async logPasswordReset() {
        await this.log('password_reset', { timestamp: new Date().toISOString() });
    }

    async logAccountDeletion() {
        await this.log('account_deletion', { timestamp: new Date().toISOString() });
    }
}

// Exporter pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityLogger;
}
