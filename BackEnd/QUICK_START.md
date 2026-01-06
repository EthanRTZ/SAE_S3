# 🚀 Démarrage rapide - API Golden Coast

## ⚡ Installation en 4 étapes

### Étape 1 : Installer les dépendances
```powershell
cd BackEnd
npm install
```

### Étape 2 : Configurer la base de données
```powershell
# Copier le fichier d'exemple
Copy-Item .env.example .env

# Éditer le fichier .env avec vos paramètres
notepad .env
```

Contenu du `.env` à adapter :
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE_ICI
DB_NAME=golden_coast
JWT_SECRET=changez_moi_avec_une_longue_chaine_aleatoire
PORT=3000
```

### Étape 3 : Créer la base de données
```powershell
# Exécuter le script SQL
psql -U postgres -f ..\SAE_S3\bdd.sql
```

Si vous avez une erreur, vous pouvez aussi :
1. Ouvrir pgAdmin
2. Créer une base de données nommée `golden_coast`
3. Exécuter le contenu du fichier `../SAE_S3/bdd.sql` dans cette base

### Étape 4 : Lancer le serveur
```powershell
# Mode production
npm start

# OU mode développement avec auto-reload
npm run dev
```

✅ **L'API est maintenant accessible sur http://localhost:3000**

---

## 🧪 Test rapide

Ouvrez un autre terminal et testez :

```powershell
# Test de santé
curl http://localhost:3000/api/health

# Liste des artistes
curl http://localhost:3000/api/artistes

# Liste des prestataires
curl http://localhost:3000/api/prestataires

# Stats globales
curl http://localhost:3000/api/stats/dashboard
```

---

## 📖 Aller plus loin

- **API_DOCUMENTATION.md** - Documentation complète de toutes les routes
- **TESTING_GUIDE.md** - Guide de test avec exemples
- **LISTE_ROUTES_COMPLETE.md** - Liste exhaustive des 40 routes
- **RAPPORT_FINAL.md** - Rapport complet du projet

---

## ❓ Problèmes courants

### Erreur : "Cannot connect to database"
→ Vérifiez que PostgreSQL est démarré et que les identifiants dans `.env` sont corrects

### Erreur : "Port 3000 already in use"
→ Changez le port dans `.env` ou arrêtez l'application qui utilise le port 3000

### Erreur : "Table does not exist"
→ Assurez-vous d'avoir exécuté le script SQL de création de la base de données

---

## 🎯 Routes principales

| Route | Description |
|-------|-------------|
| `GET /api/health` | Vérifier que l'API fonctionne |
| `GET /api/artistes` | Liste des artistes |
| `GET /api/prestataires` | Liste des prestataires |
| `GET /api/services` | Liste des services |
| `GET /api/emplacements` | Liste des emplacements |
| `GET /api/stats/dashboard` | Statistiques globales |
| `POST /api/auth/register` | Créer un compte |
| `POST /api/auth/login` | Se connecter |

Voir **API_DOCUMENTATION.md** pour la liste complète.

---

**🎉 Bon développement ! 🎉**

