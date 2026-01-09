/**
 * Middleware de sécurisation simple pour le S3
 *
 * Vérifie la présence d'un token de session soit :
 * - Via query string : ?session=xxxxx
 * - Via header Authorization : Bearer xxxxx
 *
 * Ce middleware est "à moitié fonctionnel" comme demandé pour le S3 :
 * - Il vérifie seulement la PRÉSENCE du token (pas sa validité complète)
 * - Il est facilement remplaçable par une vérification JWT forte pour le S4
 */

function simpleAuthMiddleware(req, res, next) {
  // Récupérer le token depuis query string (?session=xxx) OU header (Authorization: Bearer xxx)
  const sessionToken = req.query.session ||
                       (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);

  // Si pas de token, refuser l'accès
  if (!sessionToken) {
    return res.status(401).json({
      error: 'Non authentifié',
      message: 'Token de session requis (via ?session=xxx ou Authorization header)'
    });
  }

  // Vérification minimale : le token doit avoir une longueur raisonnable
  if (sessionToken.length < 10) {
    return res.status(401).json({
      error: 'Token invalide',
      message: 'Le token de session est trop court'
    });
  }

  // Pour le S3 : on accepte tout token qui a une longueur correcte
  // TODO S4 : Remplacer par une vérification JWT complète
  // const jwt = require('jsonwebtoken');
  // try {
  //   const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
  //   req.user = decoded;
  // } catch (err) {
  //   return res.status(401).json({ error: 'Token invalide ou expiré' });
  // }

  // Token présent et format OK → on autorise
  console.log(`✅ Accès autorisé avec token: ${sessionToken.substring(0, 10)}...`);
  next();
}

module.exports = simpleAuthMiddleware;

