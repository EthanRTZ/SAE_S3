#!/bin/bash

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Démarrage de l'environnement SAE_S3 ===${NC}\n"

# Vérifier si Node.js est installé
echo -e "${YELLOW}Vérification de Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js n'est pas installé. Installe-le puis réessaie.${NC}"
    exit 1
fi

# ==========================
# 1) Démarrage PostgreSQL
# ==========================

echo -e "${YELLOW}Démarrage de PostgreSQL...${NC}"

# Détection du service PostgreSQL selon la distro Linux
if command -v systemctl &> /dev/null; then
    # Tentative avec le nom de service classique
    if systemctl list-unit-files | grep -q "postgresql"; then
        sudo systemctl start postgresql
    elif systemctl list-unit-files | grep -q "postgresql@"; then
        # Certaines distros utilisent postgresql@version
        # On essaie de démarrer tout service postgresql@ actif
        for svc in $(systemctl list-units --type=service --all | grep "postgresql@" | awk '{print $1}'); do
            sudo systemctl start "$svc"
        done
    else
        echo -e "${YELLOW}Service PostgreSQL non trouvé via systemctl.\nVérifie le nom du service (ex: postgresql, postgresql-14, etc.).${NC}"
    fi
else
    echo -e "${YELLOW}systemctl non disponible.\nDémarre PostgreSQL manuellement (ex: pg_ctl start ...) si nécessaire.${NC}"
fi

# Vérification rapide que PostgreSQL répond
if command -v psql &> /dev/null; then
    if PGPASSWORD="$PGPASSWORD" psql -h "${PGHOST:-localhost}" -U "${PGUSER:-$USER}" -d "${PGDATABASE:-postgres}" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}PostgreSQL est démarré et accessible.${NC}"
    else
        echo -e "${YELLOW}PostgreSQL semble ne pas répondre encore ou les identifiants sont incorrects.${NC}"
        echo -e "${YELLOW}Assure-toi que PGHOST, PGUSER, PGPASSWORD et PGDATABASE sont correctement configurés si nécessaire.${NC}"
    fi
else
    echo -e "${YELLOW}psql n'est pas installé, impossible de vérifier la connexion PostgreSQL.${NC}"
fi

# ==========================
# 2) Démarrage du backend
# ==========================

# Libérer le port 3000 si déjà occupé
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}Le port 3000 est occupé, arrêt du/des processus avant démarrage...${NC}"
    lsof -ti :3000 | xargs -r kill
    sleep 1
fi

echo -e "${YELLOW}Démarrage du backend...${NC}"
cd BackEnd || { echo -e "${RED}Dossier BackEnd introuvable.${NC}"; exit 1; }

# Installation des dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installation des dépendances backend...${NC}"
  npm install
fi

npm run dev &
BACKEND_PID=$!
cd - > /dev/null || exit 1

sleep 3

# ==========================
# 3) Démarrage du frontend
# ==========================

echo -e "${YELLOW}Démarrage du frontend...${NC}"
cd FrontEnd || { echo -e "${RED}Dossier FrontEnd introuvable.${NC}"; exit 1; }

if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installation des dépendances frontend...${NC}"
  npm install
fi

# Vite utilise généralement `npm run dev`
npm run dev &
FRONTEND_PID=$!
cd - > /dev/null || exit 1

# ==========================
# 4) Récap et attente
# ==========================

echo -e "${GREEN}✓ Backend lancé (PID: $BACKEND_PID)${NC}"
echo -e "${GREEN}✓ Frontend lancé (PID: $FRONTEND_PID)${NC}"
echo -e "${GREEN}\nTout est démarré.${NC}"

echo -e "${YELLOW}Backend : http://localhost:3000 ou selon ta config (voir BackEnd/index.js)${NC}"
echo -e "${YELLOW}Frontend : http://localhost:5173 (port par défaut de Vite)${NC}\n"

# Garder le script actif pour suivre les processus
wait
