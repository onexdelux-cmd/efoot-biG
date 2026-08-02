// Charger la version depuis version.json et mettre à jour les URLs des scripts
async function loadVersion() {
    try {
        const response = await fetch('version.json');
        const data = await response.json();
        const version = data.version;
        
        // Remplacer les placeholders VERSION dans les URLs des scripts
        const scripts = document.querySelectorAll('script[src*="?v=VERSION"]');
        scripts.forEach(script => {
            const originalSrc = script.getAttribute('src');
            const newSrc = originalSrc.replace('?v=VERSION', `?v=${version}`);
            script.setAttribute('src', newSrc);
        });
        
        // Remplacer les placeholders VERSION dans les liens CSS
        const links = document.querySelectorAll('link[href*="?v=VERSION"]');
        links.forEach(link => {
            const originalHref = link.getAttribute('href');
            const newHref = originalHref.replace('?v=VERSION', `?v=${version}`);
            link.setAttribute('href', newHref);
        });
        
        console.log('✅ Version chargée:', version);
    } catch (error) {
        console.error('Erreur lors du chargement de la version:', error);
    }
}

// Charger la version au démarrage
loadVersion();
