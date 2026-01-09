require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { sequelize } = require('./models');
const setupSwagger = require('./swagger');

// Import des routes
const routesAuth = require('./routes/auth');
const routesUtilisateurs = require('./routes/utilisateurs');
const routesRoles = require('./routes/roles');
const routesArtistes = require('./routes/artistes');
const routesPrest = require('./routes/prestataires');
const routesServ = require('./routes/services');
const routesEmplacements = require('./routes/emplacements');
const routesStats = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Configuration de Swagger
setupSwagger(app);

// Routes de l'API
app.use('/api/auth', routesAuth);
app.use('/api/utilisateurs', routesUtilisateurs);
app.use('/api/roles', routesRoles);
app.use('/api/artistes', routesArtistes);
app.use('/api/prestataires', routesPrest);
app.use('/api/services', routesServ);
app.use('/api/emplacements', routesEmplacements);
app.use('/api/stats', routesStats);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Synchroniser Sequelize et démarrer le serveur
sequelize.sync({ alter: false }) // alter: false pour ne pas modifier la structure existante
  .then(() => {
    console.log('✅ Sequelize models synchronized');
    app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Failed to sync Sequelize:', err);
    process.exit(1);
  });



