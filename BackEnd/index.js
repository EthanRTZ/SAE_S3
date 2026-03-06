require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { sequelize } = require('./models');
const setupSwagger = require('./swagger');

// Import du middleware de sécurisation simple (S3)
const simpleAuth = require('./middleware/simpleAuth');

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

// Routes protégées (middleware de sécurisation appliqué)
// Pour le S3 : vérification simple de la présence du token
// Pour le S4 : ce middleware sera remplacé par une vérification JWT complète
app.use('/api/utilisateurs', simpleAuth, routesUtilisateurs);
app.use('/api/roles', simpleAuth, routesRoles);
app.use('/api/artistes', simpleAuth, routesArtistes);
app.use('/api/prestataires', simpleAuth, routesPrest);
app.use('/api/services', simpleAuth, routesServ);
app.use('/api/emplacements', simpleAuth, routesEmplacements);
app.use('/api/stats', simpleAuth, routesStats);
app.use('/api/manifestations', simpleAuth, routesManifestations);
app.use('/api/zones', simpleAuth, routesZones);
app.use('/api/equipements', simpleAuth, routesEquipements);
app.use('/api/avis', simpleAuth, routesAvis);
app.use('/api/programmation', simpleAuth, routesProgrammation);
app.use('/api/billets', simpleAuth, routesBillets);

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
