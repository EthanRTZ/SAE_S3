# 🔗 Guide de Test Backend ↔ Frontend

## 📋 Étapes pour tester la communication Backend/Frontend

### 1️⃣ Démarrer le Backend

**Terminal 1 - Backend :**
```powershell
cd D:\cours\BUT2\S3\SAE\SAE_S3\BackEnd
npm start
```

✅ Le backend devrait afficher :
```
API listening on port 3000
✅ Connected to PostgreSQL database
```

❗ **Si erreur de base de données :**
- Vérifiez que PostgreSQL est lancé
- Vérifiez les variables dans le fichier `.env` (BackEnd/.env)
- La base de données `golden_coast` doit exister

---

### 2️⃣ Démarrer le Frontend

**Terminal 2 - Frontend :**
```powershell
cd D:\cours\BUT2\S3\SAE\SAE_S3\SAE_S3
npm run dev
```

✅ Le frontend devrait afficher :
```
VITE v7.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

### 3️⃣ Accéder à la page de test

Ouvrez votre navigateur et allez à :
```
http://localhost:5173/test-backend
```

**Cette page vous permet de :**
- ✅ Tester la connexion au backend
- ✅ Tester les différents endpoints (artistes, prestataires, services)
- ✅ Voir les réponses en temps réel
- ✅ Diagnostiquer les problèmes de connexion

---

### 4️⃣ Tests manuels dans le navigateur

#### Test 1 : Endpoint de santé
Ouvrez la console développeur (F12) et tapez :
```javascript
fetch('http://localhost:3000/api/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend OK:', data))
  .catch(err => console.error('❌ Erreur:', err));
```

#### Test 2 : Liste des artistes
```javascript
fetch('http://localhost:3000/api/artistes')
  .then(res => res.json())
  .then(data => console.log('Artistes:', data))
  .catch(err => console.error('❌ Erreur:', err));
```

#### Test 3 : Liste des prestataires
```javascript
fetch('http://localhost:3000/api/prestataires')
  .then(res => res.json())
  .then(data => console.log('Prestataires:', data))
  .catch(err => console.error('❌ Erreur:', err));
```

---

### 5️⃣ Utiliser le service API dans vos composants

Le fichier `src/services/api.js` est maintenant disponible. Utilisez-le dans vos composants Vue :

```vue
<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const artistes = ref([]);
const loading = ref(false);
const error = ref(null);

onMounted(async () => {
  loading.value = true;
  const result = await api.getAllArtistes();
  
  if (result.success) {
    artistes.value = result.data;
  } else {
    error.value = result.error;
  }
  
  loading.value = false;
});
</script>

<template>
  <div>
    <h2>Liste des Artistes</h2>
    <p v-if="loading">Chargement...</p>
    <p v-if="error" class="error">Erreur : {{ error }}</p>
    <ul v-if="artistes.length">
      <li v-for="artiste in artistes" :key="artiste.id">
        {{ artiste.nom }}
      </li>
    </ul>
  </div>
</template>
```

---

## 🔍 Résolution de problèmes

### ❌ Erreur CORS
Si vous voyez une erreur CORS dans la console :
```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution :** Le backend a déjà `cors` activé dans `index.js`. Si le problème persiste, vérifiez que le backend est bien démarré.

---

### ❌ Erreur de connexion
```
Failed to fetch
```

**Vérifications :**
1. Le backend tourne-t-il sur le port 3000 ?
2. Pouvez-vous accéder à http://localhost:3000/api/health dans votre navigateur ?
3. Le frontend tourne-t-il sur un port différent (ex: 5173) ?

---

### ❌ Erreur de base de données
```
❌ Unexpected database error
```

**Solutions :**
1. Vérifiez que PostgreSQL est installé et lancé
2. Créez la base de données si elle n'existe pas :
   ```sql
   CREATE DATABASE golden_coast;
   ```
3. Vérifiez le fichier `.env` dans BackEnd :
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=golden_coast
   DB_USER=postgres
   DB_PASSWORD=votre_mot_de_passe
   ```

---

## 📊 Endpoints disponibles

### Artistes
- `GET /api/artistes` - Liste tous les artistes
- `GET /api/artistes/:id` - Détails d'un artiste
- `POST /api/artistes` - Créer un artiste
- `PUT /api/artistes/:id` - Modifier un artiste
- `DELETE /api/artistes/:id` - Supprimer un artiste

### Prestataires
- `GET /api/prestataires` - Liste tous les prestataires
- `GET /api/prestataires/:id` - Détails d'un prestataire
- `POST /api/prestataires` - Créer un prestataire
- `PUT /api/prestataires/:id` - Modifier un prestataire
- `DELETE /api/prestataires/:id` - Supprimer un prestataire
- `GET /api/prestataires/:id/services` - Services d'un prestataire
- `GET /api/prestataires/:id/emplacements` - Emplacements d'un prestataire

### Services
- `GET /api/services` - Liste tous les services
- `GET /api/services/:id` - Détails d'un service
- `GET /api/services/with-prestataires` - Services avec leurs prestataires
- `POST /api/services` - Créer un service
- `PUT /api/services/:id` - Modifier un service
- `DELETE /api/services/:id` - Supprimer un service

### Utilisateurs
- `GET /api/utilisateurs` - Liste tous les utilisateurs
- `GET /api/utilisateurs/:id` - Détails d'un utilisateur
- `POST /api/utilisateurs` - Créer un utilisateur
- `PUT /api/utilisateurs/:id` - Modifier un utilisateur
- `DELETE /api/utilisateurs/:id` - Supprimer un utilisateur

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription

### Statistiques
- `GET /api/stats` - Statistiques générales

---

## 🚀 Prochaines étapes

1. ✅ Testez la page http://localhost:5173/test-backend
2. ✅ Vérifiez que tous les endpoints répondent
3. ✅ Intégrez le service `api.js` dans vos composants existants
4. ✅ Remplacez les fichiers JSON statiques par des appels API

---

## 💡 Astuce

Pour voir toutes les requêtes réseau :
1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet "Network" / "Réseau"
3. Rechargez votre page
4. Vous verrez toutes les requêtes HTTP vers le backend

---

**Bonne chance ! 🎉**

