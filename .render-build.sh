#!/bin/bash

# Script de build automatique pour Render
# Exécuté à chaque déploiement pour mettre à jour les versions des fichiers statiques

echo "🚀 Démarrage du build automatique..."

# Générer un timestamp de version unique
VERSION=$(date +%s%N)
echo "Version générée: $VERSION"

# Mettre à jour version.json
cat > version.json << EOF
{
  "version": "$VERSION",
  "deployDate": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
}
EOF

# Mettre à jour tous les fichiers HTML avec la nouvelle version
find . -name "*.html" -type f -exec sed -i "s/\?v=[0-9]*/?v=$VERSION/g" {} \;

echo "✅ Build terminé - Tous les fichiers HTML mis à jour avec version $VERSION"
