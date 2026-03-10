/**
 * Middleware d'authentification JWT
 *
 * Vérifie et décode le token JWT soit :
 * - Via header Authorization : Bearer xxxxx
 * - Via query string : ?session=xxxxx
 *
 * En cas de succès, attache les informations décodées à req.user
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_changez_moi';

function jwtAuthMiddleware(req, res, next) {
  // Récupérer le token depuis le header OU la query string
  const token = (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null)
                || req.query.session;

  // Si pas de token, refuser l'accès
  if (!token) {
    return res.status(401).json({
      error: 'Non authentifié',
      message: 'Token JWT requis (via Authorization: Bearer xxx)'
    });
  }

  // Vérifier et décoder le token JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attacher les infos utilisateur à la requête
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expiré',
        message: 'Votre session a expiré, veuillez vous reconnecter.'
      });
    }
    return res.status(401).json({
      error: 'Token invalide',
      message: 'Le token JWT est invalide.'
    });
  }
}

module.exports = jwtAuthMiddleware;

