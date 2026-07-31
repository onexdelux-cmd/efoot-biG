document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newsletterForm');
    const successMessage = document.getElementById('successMessage');
    const resetBtn = document.getElementById('resetBtn');
    
    // Charger les abonnés depuis le localStorage
    let subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers')) || [];
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Récupérer les valeurs du formulaire
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const interests = document.getElementById('interests').value;
        const consent = document.getElementById('consent').checked;
        
        // Validation
        if (!name || !email) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        
        if (!isValidEmail(email)) {
            alert('Veuillez entrer une adresse email valide.');
            return;
        }
        
        if (!consent) {
            alert('Veuillez accepter de recevoir des emails promotionnels.');
            return;
        }
        
        // Vérifier si l'email existe déjà
        if (subscribers.some(sub => sub.email === email)) {
            alert('Cette adresse email est déjà inscrite à la newsletter.');
            return;
        }
        
        // Créer l'objet abonné
        const subscriber = {
            id: Date.now(),
            name: name,
            email: email,
            interests: interests,
            consent: consent,
            subscribedAt: new Date().toISOString()
        };
        
        // Sauvegarder dans le localStorage
        subscribers.push(subscriber);
        localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
        
        // Afficher le message de succès
        form.classList.add('hidden');
        successMessage.classList.remove('hidden');
        
        // Log pour le développement
        console.log('Nouvel abonné:', subscriber);
        console.log('Total des abonnés:', subscribers.length);
    });
    
    resetBtn.addEventListener('click', function() {
        // Réinitialiser le formulaire
        form.reset();
        form.classList.remove('hidden');
        successMessage.classList.add('hidden');
    });
    
    // Fonction de validation d'email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Animation d'entrée pour les éléments
    const animateElements = document.querySelectorAll('.feature, .newsletter-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Fonction utilitaire pour voir les abonnés (pour le développement)
    window.viewSubscribers = function() {
        console.table(subscribers);
        return subscribers;
    };
    
    // Fonction utilitaire pour effacer les abonnés (pour le développement)
    window.clearSubscribers = function() {
        if (confirm('Êtes-vous sûr de vouloir supprimer tous les abonnés ?')) {
            subscribers = [];
            localStorage.removeItem('newsletterSubscribers');
            console.log('Tous les abonnés ont été supprimés.');
        }
    };
});
