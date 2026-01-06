# 📌 Référence Rapide - Tous les Endpoints

## 🔐 Authentification (4 routes NON-TRIVIALES)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

## 👤 Utilisateurs (4 routes TRIVIALES)
```
GET    /api/utilisateurs
GET    /api/utilisateurs/:id
PUT    /api/utilisateurs/:id
DELETE /api/utilisateurs/:id
```

## 🎭 Rôles (3 routes TRIVIALES)
```
GET    /api/roles
GET    /api/roles/:id
POST   /api/roles
```

## 🎵 Artistes (5 routes TRIVIALES)
```
GET    /api/artistes
GET    /api/artistes/:id
POST   /api/artistes
PUT    /api/artistes/:id
DELETE /api/artistes/:id
```

## 🏢 Prestataires (9 routes : 5 TRIVIALES + 4 NON-TRIVIALES)
```
# TRIVIALES
GET    /api/prestataires
GET    /api/prestataires/:id
POST   /api/prestataires
PUT    /api/prestataires/:id
DELETE /api/prestataires/:id

# NON-TRIVIALES
GET    /api/prestataires/:id/services
GET    /api/prestataires/:id/emplacements
POST   /api/prestataires/:id/emplacements
DELETE /api/prestataires/:id/emplacements/:idEmplacement
```

## 🛠️ Services (6 routes : 5 TRIVIALES + 1 NON-TRIVIALE)
```
# TRIVIALES
GET    /api/services
GET    /api/services/:id
POST   /api/services
PUT    /api/services/:id
DELETE /api/services/:id

# NON-TRIVIALE
GET    /api/services/with-prestataires
```

## 📍 Emplacements (5 routes TRIVIALES)
```
GET    /api/emplacements
GET    /api/emplacements/:id
POST   /api/emplacements
PUT    /api/emplacements/:id
DELETE /api/emplacements/:id
```

## 📊 Statistiques (4 routes NON-TRIVIALES)
```
GET    /api/stats/dashboard
GET    /api/stats/prestataires
GET    /api/stats/emplacements
GET    /api/stats/artistes
```

## ❤️ Santé
```
GET    /api/health
```

---

## 📊 Total : 40 routes

- **27 TRIVIALES** (CRUD simple)
- **13 NON-TRIVIALES** (multi-tables)

