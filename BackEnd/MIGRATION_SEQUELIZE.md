# 📦 Migration vers Sequelize - Backend Golden Coast

## ✅ Ce qui a été fait

Le backend a été migré de **requêtes SQL brutes avec `pg`** vers **Sequelize ORM** pour PostgreSQL.

---

## 🗂️ Structure des nouveaux fichiers

### Configuration
- **`config/database.js`** : Configuration de la connexion Sequelize à PostgreSQL

### Modèles Sequelize (`models/`)
- **`Role.js`** : Modèle pour la table `rôles`
- **`Utilisateur.js`** : Modèle pour la table `utilisateurs`
- **`Artiste.js`** : Modèle pour la table `artiste`
- **`Prestataire.js`** : Modèle pour la table `prestataire`
- **`Service.js`** : Modèle pour la table `services`
- **`Emplacement.js`** : Modèle pour la table `emplacements`
- **`PrestataireEmplacement.js`** : Modèle pour la table de liaison `prestataire_emplacement`
- **`SessionAuthentification.js`** : Modèle pour la table `session_authentification`
- **`index.js`** : Fichier central qui exporte tous les modèles et définit les associations

---

## 🔄 Contrôleurs mis à jour

Tous les contrôleurs ont été migrés pour utiliser Sequelize :

### ✅ Contrôleurs CRUD de base
- **`artistesController.js`** : Utilise le modèle `Artiste`
- **`prestatairesController.js`** : Utilise `Prestataire`, `Service`, `Emplacement`
- **`servicesController.js`** : Utilise `Service` et `Prestataire`
- **`emplacementsController.js`** : Utilise `Emplacement`
- **`utilisateursController.js`** : Utilise `Utilisateur` et `Role`
- **`rolesController.js`** : Utilise `Role`

### ✅ Contrôleurs complexes
- **`authController.js`** : Utilise `Utilisateur`, `Role`, `SessionAuthentification`
- **`statsController.js`** : Utilise tous les modèles avec agrégations Sequelize

---

## 🎯 Avantages de Sequelize

### 1. **Code plus propre et maintenable**
Avant (SQL brut) :
```javascript
const result = await pool.query(
    'SELECT * FROM artiste WHERE id_artiste = $1',
    [id]
);
```

Après (Sequelize) :
```javascript
const artiste = await Artiste.findByPk(id);
```

### 2. **Relations automatiques**
```javascript
// Récupérer un prestataire avec ses services
const prestataire = await Prestataire.findByPk(id, {
    include: [{
        model: Service,
        as: 'services'
    }]
});
```

### 3. **Validation et typage**
Les modèles définissent les types et contraintes des champs.

### 4. **Protection contre les injections SQL**
Sequelize échappe automatiquement les valeurs.

### 5. **Migrations facilitées**
Sequelize peut générer et exécuter des migrations.

---

## 📊 Associations définies

### One-to-Many
- `Role` ➜ `Utilisateur` (un rôle a plusieurs utilisateurs)
- `Prestataire` ➜ `Service` (un prestataire a plusieurs services)
- `Utilisateur` ➜ `SessionAuthentification` (un utilisateur a plusieurs sessions)

### Many-to-Many
- `Prestataire` ⟷ `Emplacement` (via `PrestataireEmplacement`)

---

## 🚀 Comment démarrer le backend

### 1. Installer les dépendances
```bash
cd BackEnd
npm install
```

Les nouvelles dépendances installées :
- `sequelize` : ORM
- `sequelize-cli` : CLI pour migrations

### 2. Configuration
Vérifier que le fichier `.env` contient :
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=golden_coast
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=votre_secret_jwt
```

### 3. Démarrer le serveur
```bash
npm start
```

Vous devriez voir :
```
✅ Connected to PostgreSQL database via Sequelize
✅ Sequelize models synchronized
API listening on port 3000
```

---

## 🔧 Fichiers modifiés

### Supprimés/Remplacés
- ❌ `db.js` : Remplacé par `config/database.js`
- ❌ Ancien `models/repository.js` : Logique déplacée dans les contrôleurs Sequelize

### Nouveaux fichiers
- ✅ `config/database.js`
- ✅ `models/*.js` (8 fichiers de modèles)
- ✅ Tous les contrôleurs mis à jour

---

## 📝 Exemples d'utilisation

### Récupérer tous les artistes
```javascript
const artistes = await Artiste.findAll({
    order: [['id_artiste', 'ASC']]
});
```

### Récupérer un prestataire avec ses services
```javascript
const prestataire = await Prestataire.findByPk(id, {
    include: [{
        model: Service,
        as: 'services'
    }]
});
```

### Créer un utilisateur
```javascript
const user = await Utilisateur.create({
    nom_utilisateur: 'John',
    email: 'john@example.com',
    mot_de_passe: hashedPassword,
    id_rôle: 1
});
```

### Agrégations
```javascript
const count = await Artiste.count();
const avg = await Artiste.findOne({
    attributes: [
        [sequelize.fn('AVG', sequelize.col('cachet')), 'moyenne']
    ]
});
```

---

## 🐛 Résolution de problèmes

### Erreur de connexion
```
❌ Unable to connect to database
```
**Solution** : Vérifier PostgreSQL et les credentials dans `.env`

### Erreur de modèle non trouvé
```
Error: Cannot find module '../models'
```
**Solution** : Vérifier que tous les fichiers de modèles existent

### Erreur de synchronisation
```
❌ Failed to sync Sequelize
```
**Solution** : 
1. Vérifier que la base de données existe
2. Vérifier les permissions utilisateur
3. En cas de problème, utiliser `sequelize.sync({ force: false })`

---

## 📚 Documentation Sequelize

- [Documentation officielle](https://sequelize.org/)
- [Modèles](https://sequelize.org/docs/v6/core-concepts/model-basics/)
- [Associations](https://sequelize.org/docs/v6/core-concepts/assocs/)
- [Requêtes](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/)

---

## ✨ Prochaines étapes possibles

1. **Migrations** : Utiliser `sequelize-cli` pour gérer les changements de schéma
2. **Seeders** : Créer des seeders pour peupler la base de données
3. **Validation** : Ajouter des validateurs personnalisés dans les modèles
4. **Hooks** : Utiliser les hooks Sequelize (beforeCreate, afterUpdate, etc.)
5. **Scopes** : Définir des scopes pour des requêtes réutilisables

---

**✅ Migration terminée avec succès !**

