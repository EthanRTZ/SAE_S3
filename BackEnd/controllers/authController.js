const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_changez_moi';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/register - Inscription utilisateur
 * NON-TRIVIAL: Interagit avec utilisateurs + rôles
 */
exports.register = async (req, res) => {
    const client = await pool.connect();
    try {
        const { nom_utilisateur, email, mot_de_passe, role } = req.body;

        if (!nom_utilisateur || !email || !mot_de_passe) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        await client.query('BEGIN');

        // Vérifier si l'email existe déjà
        const userExists = await client.query(
            'SELECT id_utilisateur FROM utilisateurs WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Récupérer l'ID du rôle (par défaut: public)
        const roleName = role || 'public';
        const roleResult = await client.query(
            'SELECT id_rôle FROM rôles WHERE nom_rôle = $1',
            [roleName]
        );

        if (roleResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid role' });
        }

        const id_role = roleResult.rows[0].id_rôle;

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const userResult = await client.query(
            `INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, id_rôle)
             VALUES ($1, $2, $3, $4)
             RETURNING id_utilisateur, nom_utilisateur, email, id_rôle, date_creation`,
            [nom_utilisateur, email, hashedPassword, id_role]
        );

        await client.query('COMMIT');

        const user = userResult.rows[0];
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id_utilisateur,
                nom: user.nom_utilisateur,
                email: user.email,
                role: roleName
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    } finally {
        client.release();
    }
};

/**
 * POST /api/auth/login - Connexion utilisateur
 * NON-TRIVIAL: Interagit avec utilisateurs + rôles + session_authentification
 */
exports.login = async (req, res) => {
    const client = await pool.connect();
    try {
        const { email, mot_de_passe } = req.body;

        if (!email || !mot_de_passe) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        await client.query('BEGIN');

        // Récupérer l'utilisateur avec son rôle
        const result = await client.query(
            `SELECT u.id_utilisateur, u.nom_utilisateur, u.email, u.mot_de_passe, r.nom_rôle
             FROM utilisateurs u
             JOIN rôles r ON u.id_rôle = r.id_rôle
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (!isPasswordValid) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Générer un token JWT
        const token = jwt.sign(
            {
                id: user.id_utilisateur,
                email: user.email,
                role: user.nom_rôle
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Enregistrer la session en BDD
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);

        await client.query(
            `INSERT INTO session_authentification (id_utilisateur, token, date_expiration, actif)
             VALUES ($1, $2, $3, $4)`,
            [user.id_utilisateur, token, expirationDate, true]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id_utilisateur,
                nom: user.nom_utilisateur,
                email: user.email,
                role: user.nom_rôle
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
    } finally {
        client.release();
    }
};

/**
 * POST /api/auth/logout - Déconnexion utilisateur
 * NON-TRIVIAL: Invalide la session
 */
exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }

        await pool.query(
            'UPDATE session_authentification SET actif = FALSE WHERE token = $1',
            [token]
        );

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
};

/**
 * GET /api/auth/me - Récupérer l'utilisateur connecté
 * NON-TRIVIAL: Vérifie le token et récupère les infos utilisateur avec rôle
 */
exports.getCurrentUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token required' });
        }

        // Vérifier le token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Vérifier que la session est active
        const sessionResult = await pool.query(
            `SELECT actif, date_expiration FROM session_authentification 
             WHERE token = $1 AND actif = TRUE`,
            [token]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const session = sessionResult.rows[0];
        if (new Date(session.date_expiration) < new Date()) {
            return res.status(401).json({ error: 'Session expired' });
        }

        // Récupérer les infos complètes de l'utilisateur
        const userResult = await pool.query(
            `SELECT u.id_utilisateur, u.nom_utilisateur, u.email, r.nom_rôle, u.date_creation
             FROM utilisateurs u
             JOIN rôles r ON u.id_rôle = r.id_rôle
             WHERE u.id_utilisateur = $1`,
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        res.json({
            id: user.id_utilisateur,
            nom: user.nom_utilisateur,
            email: user.email,
            role: user.nom_rôle,
            date_creation: user.date_creation
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Failed to get user info' });
    }
};

