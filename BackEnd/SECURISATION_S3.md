# 🔐 SÉCURISATION DE L'API - S3

## ✅ Implémentation conforme aux critères S3

La sécurisation de l'API respecte les critères demandés pour le S3 :
- ✅ Middleware de vérification simple
- ✅ Accepte le token via query string OU header
- ✅ Facilement remplaçable pour le S4

---

## 🎯 Principe de sécurisation S3

### "À moitié fonctionnel" comme demandé

Le middleware `simpleAuth.js` vérifie **uniquement la présence** d'un token de session.
- ✅ Token présent → Accès autorisé
- ❌ Token absent → Erreur 401

**Pas de vérification complète JWT pour le S3** (sera ajouté en S4)

---

## 🔑 Deux méthodes d'authentification

### Méthode 1 : Query string (pour front-end déconnecté)
```
GET /api/artistes?session=mon-token-de-session-12345
```

### Méthode 2 : Header Authorization (standard REST)
```
GET /api/artistes
Authorization: Bearer mon-token-de-session-12345
```

Les deux méthodes fonctionnent de manière équivalente.

---

## 🛡️ Routes protégées

Toutes les routes nécessitent un token **SAUF** :
- ❌ `/api/auth/*` (register, login, logout, me) → Publiques
- ❌ `/api/health` → Publique

Routes protégées :
- ✅ `/api/utilisateurs/*`
- ✅ `/api/roles/*`
- ✅ `/api/artistes/*`
- ✅ `/api/prestataires/*`
- ✅ `/api/services/*`
- ✅ `/api/emplacements/*`
- ✅ `/api/stats/*`

---

## 📝 Utilisation avec Swagger UI

### 1. Se connecter
```
POST /api/auth/login
{
  "username": "votre_username",
  "password": "votre_password"
}
```
→ Copier le **token** reçu dans la réponse

### 2. S'authentifier (2 options)

#### Option A : Via le bouton "Authorize" 🔓
1. Cliquer sur **"Authorize"** en haut de Swagger UI
2. Coller le token dans le champ `bearerAuth`
3. Cliquer "Authorize"
4. Toutes les requêtes suivantes incluront automatiquement le token

#### Option B : Via query string
1. Sur n'importe quel endpoint, cliquer "Try it out"
2. Ajouter un paramètre `session` avec votre token
3. Execute

---

## 💡 Exemples de requêtes

### Avec curl - Query string
```bash
# Récupérer les artistes avec token en query
curl "http://localhost:3000/api/artistes?session=votre-token-ici"
```

### Avec curl - Header
```bash
# Récupérer les artistes avec token en header
curl -H "Authorization: Bearer votre-token-ici" \
     http://localhost:3000/api/artistes
```

### Avec JavaScript (fetch)
```javascript
// Méthode 1 : Query string
fetch('http://localhost:3000/api/artistes?session=' + token)
  .then(res => res.json())
  .then(data => console.log(data));

// Méthode 2 : Header
fetch('http://localhost:3000/api/artistes', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🔧 Architecture

### Fichiers créés/modifiés

```
BackEnd/
├── middleware/
│   └── simpleAuth.js          ← Nouveau : Middleware de sécurisation S3
│
├── index.js                   ← Modifié : Application du middleware
└── swagger.js                 ← Modifié : Documentation des 2 méthodes
```

### Middleware simpleAuth.js

```javascript
function simpleAuthMiddleware(req, res, next) {
  // Récupérer le token (query OU header)
  const sessionToken = req.query.session || 
                       req.headers.authorization?.split(' ')[1];
  
  // Vérifier la présence
  if (!sessionToken) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  
  // Vérification minimale (longueur)
  if (sessionToken.length < 10) {
    return res.status(401).json({ error: 'Token invalide' });
  }
  
  // OK → autoriser
  next();
}
```

---

## 🚀 Test de la sécurisation

### Test 1 : Sans token (doit échouer)
```bash
curl http://localhost:3000/api/artistes
# Résultat attendu : 401 Unauthorized
```

### Test 2 : Avec token via query (doit fonctionner)
```bash
# 1. Se connecter
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# 2. Copier le token et l'utiliser
curl "http://localhost:3000/api/artistes?session=TOKEN_ICI"
# Résultat attendu : 200 OK avec la liste des artistes
```

### Test 3 : Avec token via header (doit fonctionner)
```bash
curl -H "Authorization: Bearer TOKEN_ICI" \
     http://localhost:3000/api/artistes
# Résultat attendu : 200 OK avec la liste des artistes
```

---

## ⚠️ Différences S3 vs S4

### S3 (actuel) - Sécurisation "light"
```javascript
// Vérification minimale
if (sessionToken && sessionToken.length >= 10) {
  next(); // OK
}
```

### S4 (futur) - Sécurisation complète
```javascript
// Vérification JWT complète
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  req.user = decoded; // Récupérer l'utilisateur
  
  // Vérifier les rôles
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Accès interdit' });
  }
  
  next();
} catch (err) {
  return res.status(401).json({ error: 'Token invalide ou expiré' });
}
```

---

## 📊 Codes d'erreur

| Code | Signification | Cause |
|------|---------------|-------|
| 401 | Non authentifié | Token absent ou trop court |
| 403 | Accès interdit | (S4) Droits insuffisants |
| 200 | OK | Token valide, accès autorisé |

---

## 🎨 Schéma du flux

```
Client → Requête → Middleware simpleAuth
                         ↓
                    Token présent ?
                    ↙           ↘
                 OUI            NON
                  ↓              ↓
            Longueur OK ?    401 Error
            ↙         ↘
         OUI         NON
          ↓           ↓
      next()      401 Error
          ↓
    Contrôleur
          ↓
     Réponse 200
```

---

## ✅ Conformité S3

| Critère | Status | Implémentation |
|---------|--------|----------------|
| Token via query | ✅ | `?session=xxx` |
| Token via header | ✅ | `Authorization: Bearer xxx` |
| Middleware avant contrôleurs | ✅ | `app.use('/api/xxx', simpleAuth, routes)` |
| Vérification simple | ✅ | Présence + longueur minimale |
| Routes publiques | ✅ | `/api/auth/*` et `/api/health` |
| Routes protégées | ✅ | Toutes les autres |
| Facilement remplaçable | ✅ | TODO S4 clairement marqués |
| Documentation Swagger | ✅ | 2 méthodes documentées |

---

## 🎯 Conclusion

La sécurisation S3 est **minimaliste mais fonctionnelle** :
- ✅ Vérifie la présence du token
- ✅ Compatible front-end déconnecté (query string)
- ✅ Compatible REST standard (header)
- ✅ Facilement améliorable pour S4

**Prêt pour la soutenance S3 !** 🚀

---

*Sécurisation appliquée le 2026-01-09*
*Conforme aux critères S3 - Section 2.3.2*

