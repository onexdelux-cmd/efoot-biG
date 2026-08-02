const fs = require('fs');
const path = require('path');

// Générer un timestamp de version
const now = new Date();
const version = now.getTime().toString();
const deployDate = now.toISOString();

// Mettre à jour version.json
const versionData = {
    version: version,
    deployDate: deployDate
};

fs.writeFileSync('version.json', JSON.stringify(versionData, null, 2));
console.log('✅ Version mise à jour:', version);

// Mettre à jour les fichiers HTML avec la nouvelle version
const htmlFiles = ['index.html', 'articles.html', 'auth.html'];

htmlFiles.forEach(htmlFile => {
    if (fs.existsSync(htmlFile)) {
        let content = fs.readFileSync(htmlFile, 'utf8');
        
        // Remplacer les anciennes versions par la nouvelle
        content = content.replace(/\?v=\d+/g, `?v=${version}`);
        
        fs.writeFileSync(htmlFile, content);
        console.log(`✅ ${htmlFile} mis à jour avec version ${version}`);
    }
});

console.log('✅ Tous les fichiers ont été mis à jour avec la nouvelle version');
