# API RESTful - Golden Coast Festival 🎵

API Node.js + Express + PostgreSQL pour la gestion du festival Golden Coast.

## 🚀 Installation rapide

```powershell
cd BackEnd
npm install
```

## ⚙️ Configuration

1. Copier le fichier `.env.example` en `.env`:
```powershell
Copy-Item .env.example .env
```

2. Modifier le fichier `.env` avec vos paramètres de connexion PostgreSQL:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=golden_coast
JWT_SECRET=votre_secret_jwt_changez_moi
PORT=3000
```

3. Créer la base de données PostgreSQL:
```powershell
# Depuis PowerShell, exécuter le script SQL
psql -U postgres -f ..\SAE_S3\bdd.sql
```

## 🏃 Démarrage

### Mode production
```powershell
npm start
```

### Mode développement (avec auto-reload)
```powershell
npm run dev
```

L'API sera accessible sur `http://localhost:3000`

## 📁 Structure du projet

```
BackEnd/
├── controllers/           # Logique métier
│   ├── authController.js          # Authentification (NON-TRIVIAL)
│   ├── artistesController.js      # CRUD artistes (TRIVIAL)
│   ├── prestatairesController.js  # CRUD + routes complexes
│   ├── servicesController.js      # CRUD + routes complexes
│   ├── emplacementsController.js  # CRUD emplacements (TRIVIAL)
│   ├── utilisateursController.js  # CRUD utilisateurs (TRIVIAL)
│   ├── rolesController.js         # CRUD rôles (TRIVIAL)
│   └── statsController.js         # Statistiques (NON-TRIVIAL)
├── routes/               # Définition des routes
│   ├── auth.js
│   ├── artistes.js
│   ├── prestataires.js
│   ├── services.js
│   ├── emplacements.js
│   ├── utilisateurs.js
│   ├── roles.js
│   └── stats.js
├── models/               # (Ancien système en mémoire)
├── db.js                 # Configuration PostgreSQL
├── index.js              # Point d'entrée
├── package.json
├── .env.example
├── API_DOCUMENTATION.md       # Documentation complète des routes
├── MODIFICATIONS_SUMMARY.md   # Résumé des modifications
└── TESTING_GUIDE.md           # Guide de test
```

## 📊 Routes disponibles

### Ressources principales (CRUD complet)

| Ressource | Endpoint base | Routes |
|-----------|---------------|--------|
| **Artistes** | `/api/artistes` | GET, GET/:id, POST, PUT/:id, DELETE/:id |
| **Prestataires** | `/api/prestataires` | GET, GET/:id, POST, PUT/:id, DELETE/:id |
| **Services** | `/api/services` | GET, GET/:id, POST, PUT/:id, DELETE/:id |
| **Emplacements** | `/api/emplacements` | GET, GET/:id, POST, PUT/:id, DELETE/:id |
| **Utilisateurs** | `/api/utilisateurs` | GET, GET/:id, PUT/:id, DELETE/:id |
| **Rôles** | `/api/roles` | GET, GET/:id, POST |

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion (retourne un JWT)
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Utilisateur connecté

### Routes complexes (NON-TRIVIALES)

- `GET /api/prestataires/:id/services` - Services d'un prestataire
- `GET /api/prestataires/:id/emplacements` - Emplacements d'un prestataire
- `POST /api/prestataires/:id/emplacements` - Assigner un emplacement
- `DELETE /api/prestataires/:id/emplacements/:idEmpl` - Retirer un emplacement
- `GET /api/services/with-prestataires` - Services avec infos prestataires
- `GET /api/stats/dashboard` - Statistiques globales
- `GET /api/stats/prestataires` - Stats par prestataire
- `GET /api/stats/emplacements` - Stats par emplacement
- `GET /api/stats/artistes` - Stats par artiste

## 🧪 Tests

Voir le fichier **TESTING_GUIDE.md** pour des exemples de commandes curl.

Test rapide:
```powershell
curl http://localhost:3000/api/health
```

Résultat attendu: `{"ok":true}`

## 📖 Documentation

- **API_DOCUMENTATION.md** - Documentation complète de toutes les routes
- **MODIFICATIONS_SUMMARY.md** - Récapitulatif des modifications effectuées
- **TESTING_GUIDE.md** - Guide de test avec exemples curl

## 🔑 Authentification JWT

Les routes protégées nécessitent un header `Authorization`:
```
Authorization: Bearer <votre_token_jwt>
```

Pour obtenir un token:
1. S'inscrire via `/api/auth/register`
2. Se connecter via `/api/auth/login`
3. Récupérer le token dans la réponse
4. Utiliser ce token dans les requêtes suivantes

## 🛠️ Technologies

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de données
- **pg** - Client PostgreSQL
- **bcrypt** - Hashage des mots de passe
- **jsonwebtoken** - Authentification JWT
- **dotenv** - Variables d'environnement
- **morgan** - Logger HTTP
- **cors** - Cross-Origin Resource Sharing

## 📝 Conformité aux exigences

✅ **Routes triviales**: 27 routes CRUD fonctionnelles interagissant avec la BDD  
✅ **Routes non-triviales**: 13 routes complexes impliquant plusieurs tables  

Voir **MODIFICATIONS_SUMMARY.md** pour le détail complet.


