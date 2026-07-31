document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du système de newsletter...');
    
    const newsletterWidget = document.getElementById('newsletterWidget');
    const subscribedMessage = document.getElementById('subscribedMessage');
    const unsubscribeBtn = document.getElementById('unsubscribeBtn');
    const newsletterNotification = document.getElementById('newsletterNotification');
    const closeNotification = document.getElementById('closeNotification');
    const subscribeNow = document.getElementById('subscribeNow');
    
    console.log('Éléments newsletter:', {
        newsletterWidget: !!newsletterWidget,
        subscribedMessage: !!subscribedMessage,
        unsubscribeBtn: !!unsubscribeBtn,
        newsletterNotification: !!newsletterNotification,
        closeNotification: !!closeNotification,
        subscribeNow: !!subscribeNow
    });

    // Vérifier si l'utilisateur est déjà abonné
    checkSubscriptionStatus();

    // Gestion du bouton de désabonnement
    if (unsubscribeBtn) {
        unsubscribeBtn.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir vous désabonner de la newsletter ?')) {
                unsubscribeUser();
            }
        });
    }

    // Gestion de la notification
    if (closeNotification) {
        closeNotification.addEventListener('click', function() {
            dismissNotification();
        });
    }

    if (subscribeNow) {
        subscribeNow.addEventListener('click', function() {
            scrollToNewsletterWidget();
        });
    }

    // Écouter les changements dans le DOM pour détecter l'inscription Joyful
    observeJoyfulWidget();

    function checkSubscriptionStatus() {
        const isSubscribed = localStorage.getItem('newsletterSubscribed') === 'true';
        const userEmail = localStorage.getItem('newsletterEmail');
        const notificationDismissed = localStorage.getItem('newsletterNotificationDismissed') === 'true';
        
        console.log('Statut d\'abonnement:', isSubscribed, 'Email:', userEmail, 'Notification rejetée:', notificationDismissed);
        
        // Vérifier si Joyful affiche déjà son propre message de succès
        const joyfulSuccess = checkJoyfulSuccessMessage();
        
        if (joyfulSuccess) {
            console.log('Joyful affiche déjà son message de succès, on cache notre message personnalisé');
            showNewsletterWidget(); // Laisser Joyful gérer l'affichage
        } else if (isSubscribed) {
            showSubscribedMessage(userEmail);
        } else {
            showNewsletterWidget();
            // Afficher la notification si l'utilisateur n'est pas abonné et n'a pas rejeté la notification
            if (!notificationDismissed) {
                showNotification();
            }
        }
    }

    function checkJoyfulSuccessMessage() {
        const joyfulContainer = document.querySelector('[data-joyful-embed]');
        if (!joyfulContainer) return false;
        
        const text = joyfulContainer.textContent.toLowerCase();
        return text.includes('you\'re subscribed') || 
               text.includes('subscribed') || 
               text.includes('check your inbox');
    }

    function showSubscribedMessage(email) {
        console.log('Affichage du message d\'abonnement pour:', email);
        if (newsletterWidget) {
            newsletterWidget.classList.add('hidden');
        }
        if (subscribedMessage) {
            subscribedMessage.classList.remove('hidden');
            // Mettre à jour le message avec l'email si disponible
            const messageText = subscribedMessage.querySelector('p');
            if (messageText && email) {
                messageText.textContent = `Merci de faire partie de notre communauté eFootball Red Dimension (${email}).`;
            }
        }
    }

    function showNewsletterWidget() {
        console.log('Affichage du widget de newsletter');
        if (newsletterWidget) {
            newsletterWidget.classList.remove('hidden');
        }
        if (subscribedMessage) {
            subscribedMessage.classList.add('hidden');
        }
    }

    function unsubscribeUser() {
        localStorage.removeItem('newsletterSubscribed');
        localStorage.removeItem('newsletterEmail');
        console.log('Utilisateur désabonné');
        showNewsletterWidget();
        alert('Vous avez été désabonné avec succès.');
    }

    function showNotification() {
        console.log('Affichage de la notification newsletter');
        if (newsletterNotification) {
            newsletterNotification.classList.remove('hidden');
        }
    }

    function dismissNotification() {
        console.log('Rejet de la notification newsletter');
        localStorage.setItem('newsletterNotificationDismissed', 'true');
        if (newsletterNotification) {
            newsletterNotification.classList.add('hidden');
        }
    }

    function scrollToNewsletterWidget() {
        console.log('Scroll vers le widget newsletter');
        if (newsletterWidget) {
            newsletterWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function observeJoyfulWidget() {
        // Observer les changements dans le widget Joyful pour détecter l'inscription
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Chercher des indicateurs de succès dans le widget Joyful
                const joyfulContainer = document.querySelector('[data-joyful-embed]');
                if (joyfulContainer) {
                    // Vérifier s'il y a un message de succès
                    const successElements = joyfulContainer.querySelectorAll('*');
                    successElements.forEach(function(element) {
                        const text = element.textContent.toLowerCase();
                        if (text.includes('success') || text.includes('merci') || text.includes('confirmé') || text.includes('subscribed')) {
                            console.log('Détection d\'inscription Joyful réussie');
                            markUserAsSubscribed();
                        }
                    });
                }
            });
        });

        // Observer le widget Joyful
        const joyfulContainer = document.querySelector('[data-joyful-embed]');
        if (joyfulContainer) {
            observer.observe(joyfulContainer, {
                childList: true,
                subtree: true,
                characterData: true
            });
            console.log('Observateur Joyful activé');
        }
    }

    function markUserAsSubscribed() {
        // Essayer de récupérer l'email du formulaire Joyful
        const emailInput = document.querySelector('[data-joyful-embed] input[type="email"]');
        const email = emailInput ? emailInput.value : null;
        
        localStorage.setItem('newsletterSubscribed', 'true');
        if (email) {
            localStorage.setItem('newsletterEmail', email);
        }
        
        console.log('Utilisateur marqué comme abonné:', email);
        
        // Attendre un peu avant de mettre à jour l'interface
        setTimeout(function() {
            checkSubscriptionStatus();
        }, 1000);
    }

    // Fonction utilitaire pour forcer le statut d'abonnement (pour le développement)
    window.forceSubscribe = function(email) {
        localStorage.setItem('newsletterSubscribed', 'true');
        localStorage.setItem('newsletterEmail', email || 'test@example.com');
        checkSubscriptionStatus();
        console.log('Forcé l\'abonnement pour:', email);
    };

    // Fonction utilitaire pour réinitialiser (pour le développement)
    window.resetNewsletter = function() {
        localStorage.removeItem('newsletterSubscribed');
        localStorage.removeItem('newsletterEmail');
        checkSubscriptionStatus();
        console.log('Newsletter réinitialisée');
    };
});
