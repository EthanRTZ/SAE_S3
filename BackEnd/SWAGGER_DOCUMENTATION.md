# Documentation Swagger/OpenAPI - API Golden Coast

## 📚 Accès à la documentation

La documentation interactive Swagger UI est disponible une fois le serveur backend démarré.

### Démarrage du serveur

```bash
cd BackEnd
npm install
npm start
```

### URL de la documentation

Une fois le serveur démarré, accédez à la documentation via :

**🌐 Interface Swagger UI :** http://localhost:3000/api-docs

**📄 Spécification OpenAPI JSON :** http://localhost:3000/api-docs.json

## 🎯 Utilisation de la documentation

### 1. Navigation

La documentation est organisée par **tags** :
- **Auth** : Authentification (register, login, logout)
- **Utilisateurs** : Gestion des utilisateurs
- **Artistes** : Gestion des artistes du festival
- **Prestataires** : Gestion des prestataires
- **Services** : Gestion des services
- **Emplacements** : Gestion des emplacements
- **Rôles** : Gestion des rôles utilisateurs
- **Stats** : Statistiques du système

### 2. Tester les endpoints

Pour chaque endpoint, vous pouvez :
1. Cliquer sur la route pour voir les détails
2. Cliquer sur **"Try it out"**
3. Remplir les paramètres requis
4. Cliquer sur **"Execute"** pour envoyer la requête

### 3. Authentification

Pour les routes protégées (🔒), vous devez vous authentifier :

1. **Se connecter** via `/api/auth/login`
2. **Copier le token JWT** reçu dans la réponse
3. **Cliquer sur le bouton "Authorize"** 🔓 (en haut de la page)
4. **Coller le token** dans le champ (format : `votre-token-jwt`)
5. **Cliquer sur "Authorize"**

Toutes les requêtes suivantes utiliseront automatiquement ce token.

## 📋 Exemples de requêtes

### Inscription d'un utilisateur

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "MotDePasse123!",
  "nom": "Doe",
  "prenom": "John"
}
```

### Connexion

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "MotDePasse123!"
}
```

### Récupérer tous les artistes

```bash
GET /api/artistes
```

### Créer un prestataire (authentifié)

```bash
POST /api/prestataires
Authorization: Bearer <votre-token>
Content-Type: application/json

{
  "nom": "Food Truck Paradise",
  "description": "Cuisine street food premium",
  "logo_url": "/media/prestataires/foodtruck.jpg"
}
```

## 🔧 Structure de la documentation

### Fichiers principaux

- **`swagger.js`** : Configuration OpenAPI et montage de Swagger UI
- **`routes/*.js`** : Chaque fichier de route contient les annotations OpenAPI

### Annotations OpenAPI

Les routes sont documentées avec des commentaires JSDoc spéciaux :

```javascript
/**
 * @openapi
 * /api/endpoint:
 *   get:
 *     tags:
 *       - NomDuTag
 *     summary: Courte description
 *     description: Description détaillée
 *     responses:
 *       200:
 *         description: Succès
 */
```

## 🎨 Personnalisation

### Modifier les informations de l'API

Éditez le fichier `BackEnd/swagger.js` :

```javascript
info: {
  title: 'API Golden Coast Festival',
  version: '1.0.0',
  description: 'Votre description personnalisée',
}
```

### Ajouter de nouvelles routes

1. Ajoutez les annotations OpenAPI dans le fichier de route correspondant
2. Redémarrez le serveur
3. La documentation sera automatiquement mise à jour

## 📦 Export de la documentation

### Format JSON

Téléchargez la spécification OpenAPI complète :
```bash
curl http://localhost:3000/api-docs.json > openapi.json
```

### Utilisation avec d'autres outils

La spécification OpenAPI peut être utilisée avec :
- **Postman** : Importez le fichier JSON
- **Insomnia** : Importez le fichier JSON
- **Swagger Editor** : https://editor.swagger.io/
- **Redoc** : Alternative à Swagger UI

## 🚀 Bonnes pratiques

1. **Documenter tous les endpoints** : Chaque route doit avoir ses annotations
2. **Décrire les schémas** : Utilisez `schema` pour définir le format des données
3. **Spécifier les codes de réponse** : 200, 201, 400, 401, 404, 500, etc.
4. **Ajouter des exemples** : Utilisez `example` pour montrer des valeurs types
5. **Grouper par tags** : Organisez les endpoints par fonctionnalité

## 🐛 Dépannage

### La documentation n'apparaît pas

- Vérifiez que le serveur est démarré
- Vérifiez l'URL : http://localhost:3000/api-docs
- Consultez les logs du serveur pour détecter les erreurs

### Les annotations ne s'affichent pas

- Vérifiez la syntaxe YAML dans les commentaires `@openapi`
- Redémarrez le serveur après modification
- Consultez les logs pour voir les erreurs de parsing

### Problème d'authentification

- Assurez-vous d'avoir récupéré un token valide via `/api/auth/login`
- Vérifiez que vous avez cliqué sur "Authorize" et collé le token
- Le token doit être au format JWT valide

## 📚 Ressources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)

---

✨ **Votre documentation est prête !** Accédez à http://localhost:3000/api-docs pour explorer l'API.

