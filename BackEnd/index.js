require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { sequelize } = require('./models');
const setupSwagger = require('./swagger');

// Import du middleware de sécurisation simple (S3)
const simpleAuth = require('./middleware/simpleAuth');
const { requireRole } = require('./middleware/simpleAuth');

// Import des routes
const routesAuth = require('./routes/auth');
const routesUtilisateurs = require('./routes/utilisateurs');
const routesRoles = require('./routes/roles');
const routesArtistes = require('./routes/artistes');
const routesPrest = require('./routes/prestataires');
const routesServ = require('./routes/services');
const routesEmplacements = require('./routes/emplacements');
const routesStats = require('./routes/stats');
const routesManifestations = require('./routes/manifestations');
const routesZones = require('./routes/zones');
const routesEquipements = require('./routes/equipements');
const routesAvis = require('./routes/avis');
const routesProgrammation = require('./routes/programmation');
const routesBillets = require('./routes/billets');
const routesTypesService = require('./routes/typesService');
const routesScenes = require('./routes/scenes');
const routesAvisFestival = require('./routes/avisFestival');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Configuration de Swagger
setupSwagger(app);

// Routes publiques (pas de sécurisation)
app.use('/api/auth', routesAuth); // Auth : register et login sont publics
app.get('/api/health', (req, res) => res.json({ ok: true })); // Health check public

// Routes publiques en lecture (GET) – données affichées sur la page d'accueil sans connexion
app.use('/api/manifestations', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesManifestations);
app.use('/api/prestataires', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesPrest);
app.use('/api/artistes', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesArtistes);
app.use('/api/programmation', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesProgrammation);
app.use('/api/zones', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesZones);
app.use('/api/equipements', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesEquipements);
app.use('/api/avis', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesAvis);
app.use('/api/billets', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesBillets);
app.use('/api/types-service', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesTypesService);
app.use('/api/scenes', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesScenes);
app.use('/api/avis-festival', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesAvisFestival);
app.use('/api/emplacements', (req, res, next) => {
  if (req.method === 'GET') return next();
  return simpleAuth(req, res, next);
}, routesEmplacements);

// Routes protégées (middleware de sécurisation appliqué sur tous les verbes)
app.use('/api/utilisateurs', simpleAuth, routesUtilisateurs);
app.use('/api/roles', simpleAuth, requireRole('admin', 'organisateur'), routesRoles);
app.use('/api/services', simpleAuth, routesServ);
app.use('/api/stats', simpleAuth, requireRole('admin', 'organisateur'), routesStats);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Démarrer le serveur, tenter la synchro BDD mais ne pas bloquer si elle échoue
const startServer = async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log('✅ Sequelize models synchronized');
  } catch (err) {
    console.error('⚠️  BDD indisponible – le serveur démarre en mode dégradé (JSON fallback actif):', err.message);
  }
  app.listen(PORT, () => console.log(`🚀 API listening on port ${PORT}`));
};

startServer();
