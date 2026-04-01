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
const { SessionAuthentification } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_changez_moi';

async function jwtAuthMiddleware(req, res, next) {
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

    // Vérifier que la session est toujours active en base de données
    const session = await SessionAuthentification.findOne({
      where: { token, actif: true }
    });

    if (!session) {
      return res.status(401).json({
        error: 'Session révoquée',
        message: 'Votre session a été invalidée, veuillez vous reconnecter.'
      });
    }

    if (session.date_expiration && new Date(session.date_expiration) < new Date()) {
      return res.status(401).json({
        error: 'Session expirée',
        message: 'Votre session a expiré, veuillez vous reconnecter.'
      });
    }

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

/**
 * Middleware de vérification de rôle
 *
 * À utiliser APRÈS jwtAuthMiddleware (req.user doit être déjà renseigné).
 * Accepte une liste de rôles autorisés.
 *
 * Exemple : requireRole('admin', 'organisateur')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Authentification requise pour accéder à cette ressource.'
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous n\'avez pas les permissions nécessaires pour cette action.'
      });
    }
    next();
  };
}

module.exports = jwtAuthMiddleware;
module.exports.requireRole = requireRole;
