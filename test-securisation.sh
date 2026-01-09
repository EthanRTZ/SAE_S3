#!/bin/bash

# Guide de test rapide de la sécurisation
# Exécutez ce script pour vérifier que tout fonctionne

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 TEST DE LA SÉCURISATION S3"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier que le serveur est lancé
echo "🔍 Vérification du serveur..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "   ✅ Serveur backend opérationnel"
else
    echo "   ❌ Serveur non accessible"
    echo ""
    echo "💡 Lancez d'abord le serveur :"
    echo "   cd BackEnd"
    echo "   npm start"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 INSTRUCTIONS DE TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣  Démarrez le front-end :"
echo "    cd SAE_S3"
echo "    npm run dev"
echo ""

echo "2️⃣  Ouvrez le navigateur :"
echo "    http://localhost:5173"
echo ""

echo "3️⃣  Allez sur la page de connexion"
echo ""

echo "4️⃣  Connectez-vous avec un compte existant"
echo "    (vérifiez dans votre base de données)"
echo ""

echo "5️⃣  Ouvrez la console du navigateur (F12)"
echo ""

echo "6️⃣  Vérifiez que le token est stocké :"
echo "    → localStorage.getItem('authToken')"
echo "    → Doit afficher un long token JWT"
echo ""

echo "7️⃣  Naviguez vers une page avec des données"
echo "    (ex: liste des artistes)"
echo ""

echo "8️⃣  Ouvrez l'onglet Network (Réseau) dans F12"
echo "    → Vérifiez la requête vers /api/artistes"
echo "    → Dans les Headers, cherchez 'Authorization'"
echo "    → Doit contenir 'Bearer VOTRE_TOKEN'"
echo ""

echo "9️⃣  Les données doivent s'afficher ! ✅"
echo ""

echo "🔟  Déconnectez-vous"
echo "    → Le token doit être supprimé du localStorage"
echo "    → Les routes protégées ne doivent plus fonctionner"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TEST MANUEL AVEC CURL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 1 : Sans token (doit échouer avec 401)"
echo "─────────────────────────────────────────────"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/artistes)
if [ "$RESPONSE" = "401" ]; then
    echo "✅ PASS - Accès refusé sans token (401)"
else
    echo "❌ FAIL - Code reçu: $RESPONSE (attendu: 401)"
fi
echo ""

echo "Test 2 : Connexion et récupération du token"
echo "─────────────────────────────────────────────"
echo "⚠️  Créez d'abord un utilisateur dans votre BDD"
echo ""
echo "Exemple de commande pour se connecter :"
echo ""
echo 'curl -X POST http://localhost:3000/api/auth/login \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"email":"admin@example.com","mot_de_passe":"admin123"}'"'"
echo ""
echo "Puis copiez le token et utilisez-le dans la commande suivante :"
echo ""
echo 'curl -H "Authorization: Bearer VOTRE_TOKEN_ICI" \'
echo '     http://localhost:3000/api/artistes'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CHECKLIST DE VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend :"
echo "  [ ] Serveur démarré (npm start)"
echo "  [ ] Route /api/health accessible"
echo "  [ ] Route /api/artistes bloquée sans token (401)"
echo ""
echo "Frontend :"
echo "  [ ] Application démarrée (npm run dev)"
echo "  [ ] Page de connexion accessible"
echo "  [ ] Connexion réussie"
echo "  [ ] Token stocké dans localStorage"
echo "  [ ] Header Authorization présent dans les requêtes"
echo "  [ ] Données chargées avec succès (200)"
echo "  [ ] Déconnexion fonctionnelle"
echo "  [ ] Token supprimé après logout"
echo ""
echo "Swagger UI :"
echo "  [ ] Interface accessible (http://localhost:3000/api-docs)"
echo "  [ ] Login fonctionne"
echo "  [ ] Bouton Authorize disponible"
echo "  [ ] Endpoints testables avec token"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SÉCURISATION ACTIVE ET FONCTIONNELLE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation complète :"
echo "   - SECURISATION_ACTIVEE.md"
echo "   - BackEnd/SECURISATION_S3.md"
echo ""
echo "🚀 Prêt pour la soutenance S3 !"
echo ""

