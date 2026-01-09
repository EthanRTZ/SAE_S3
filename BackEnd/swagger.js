const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Golden Coast Festival',
      version: '1.0.0',
      description: 'Documentation de l\'API REST pour la gestion du festival Golden Coast',
      contact: {
        name: 'Équipe SAE_S3',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT (reçu lors du login) dans le header Authorization',
        },
        sessionQuery: {
          type: 'apiKey',
          in: 'query',
          name: 'session',
          description: 'Token de session passé en paramètre d\'URL (?session=xxx) - Alternative au header',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Message d\'erreur',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message de succès',
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentification et gestion de session' },
      { name: 'Utilisateurs', description: 'Gestion des utilisateurs' },
      { name: 'Artistes', description: 'Gestion des artistes' },
      { name: 'Prestataires', description: 'Gestion des prestataires' },
      { name: 'Services', description: 'Gestion des services' },
      { name: 'Emplacements', description: 'Gestion des emplacements' },
      { name: 'Rôles', description: 'Gestion des rôles' },
      { name: 'Stats', description: 'Statistiques' },
    ],
  },
  apis: ['./routes/*.js'], // Chemin vers les fichiers contenant les annotations
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  // Route pour obtenir le JSON de la spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Interface Swagger UI
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Golden Coast - Documentation',
  }));
}

module.exports = setupSwagger;

