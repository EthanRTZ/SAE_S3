#!/bin/bash

# Script de démarrage de l'API avec documentation Swagger
# Usage: ./start-api-swagger.sh

echo "🚀 Démarrage de l'API Golden Coast avec Swagger..."
echo ""

# Nettoyer les processus Node.js existants
echo "🧹 Nettoyage des processus existants..."
pkill -9 node 2>/dev/null
sleep 1

# Démarrer le serveur
echo "⚡ Démarrage du serveur..."
cd "$(dirname "$0")"
node index.js &

# Attendre que le serveur démarre
sleep 3

# Vérifier que le serveur fonctionne
echo ""
echo "🔍 Vérification du serveur..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Serveur démarré avec succès!"
    echo ""
    echo "📚 Documentation Swagger disponible sur:"
    echo "   👉 http://localhost:3000/api-docs"
    echo ""
    echo "📄 Spécification OpenAPI JSON:"
    echo "   👉 http://localhost:3000/api-docs.json"
    echo ""
    echo "💡 Ouvrir dans le navigateur:"
    echo "   xdg-open http://localhost:3000/api-docs"
    echo ""
else
    echo "❌ Erreur: Le serveur n'a pas démarré correctement"
    echo "📋 Consultez les logs pour plus d'informations"
    exit 1
fi

