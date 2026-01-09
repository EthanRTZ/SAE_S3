# 📚 Documentation Swagger/OpenAPI - RÉSUMÉ RAPIDE

## ✅ Installation terminée !

Votre API Golden Coast dispose maintenant d'une **documentation interactive complète** avec Swagger/OpenAPI 3.0.

---

## 🚀 Démarrage ultra-rapide

### Méthode 1 : Script automatique
```bash
./start-api-swagger.sh
```

### Méthode 2 : Manuel
```bash
npm start
```

Puis ouvrez : **http://localhost:3000/api-docs**

---

## 🌐 URLs importantes

- **Interface Swagger UI** : http://localhost:3000/api-docs
- **JSON OpenAPI** : http://localhost:3000/api-docs.json
- **API Health Check** : http://localhost:3000/api/health

---

## 📊 Statistiques

✨ **40 endpoints documentés** répartis en 8 catégories :
- 🔐 **Auth** (4) : register, login, logout, me
- 👥 **Utilisateurs** (4) : CRUD complet
- 🎵 **Artistes** (5) : CRUD complet
- 🏪 **Prestataires** (9) : CRUD + services + emplacements
- 🛠️ **Services** (6) : CRUD + relations
- 📍 **Emplacements** (5) : CRUD complet
- 👔 **Rôles** (3) : Liste + détails + création
- 📊 **Stats** (4) : Dashboard + statistiques détaillées

---

## 🎯 Utilisation rapide

### 1. Tester sans authentification
- Allez sur http://localhost:3000/api-docs
- Ouvrez **GET /artistes**
- Cliquez **"Try it out"** puis **"Execute"**

### 2. Tester avec authentification
1. **POST /auth/register** → Créer un compte
2. **POST /auth/login** → Se connecter et copier le token
3. Cliquer sur **"Authorize"** 🔓 → Coller le token
4. Tous les endpoints protégés sont maintenant accessibles !

---

## 📦 Export vers Postman/Insomnia

```bash
# Télécharger la spécification
curl http://localhost:3000/api-docs.json > openapi.json

# Puis importer dans Postman ou Insomnia
```

---

## 📄 Documentation complète

Pour plus de détails, consultez :
- **SWAGGER_DOCUMENTATION.md** - Guide complet avec exemples
- **SWAGGER_RESUME.md** - Résumé détaillé de l'installation

---

## 🎨 Exemple visuel

```
🌐 Interface Swagger UI
├── 🔐 Auth
│   ├── POST /auth/register     → Créer un compte
│   ├── POST /auth/login        → Se connecter
│   ├── POST /auth/logout       → Se déconnecter
│   └── GET  /auth/me           → Mon profil
│
├── 🎵 Artistes
│   ├── GET    /artistes        → Liste tous
│   ├── POST   /artistes        → Créer
│   ├── GET    /artistes/{id}   → Détails
│   ├── PUT    /artistes/{id}   → Modifier
│   └── DELETE /artistes/{id}   → Supprimer
│
└── ... et 6 autres catégories !
```

---

## ✨ Fonctionnalités

- ✅ Interface interactive (boutons "Try it out")
- ✅ Authentification JWT intégrée
- ✅ Exemples de requêtes pré-remplis
- ✅ Documentation des erreurs (400, 401, 404, 500)
- ✅ Export JSON compatible Postman/Insomnia
- ✅ Conforme OpenAPI 3.0

---

## 🆘 Problèmes ?

### Le serveur ne démarre pas
```bash
# Tuer les processus existants
pkill node

# Relancer
npm start
```

### La doc n'apparaît pas
Vérifiez que le serveur tourne :
```bash
curl http://localhost:3000/api/health
# Doit retourner: {"ok":true}
```

---

## 🎉 C'est tout !

Votre documentation est **prête à l'emploi**.

➡️ **Ouvrez maintenant :** http://localhost:3000/api-docs

---

*Documentation générée avec Swagger/OpenAPI 3.0 • Tous les endpoints sont testables directement depuis l'interface*

