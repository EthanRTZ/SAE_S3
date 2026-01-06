const { Utilisateur, Role, SessionAuthentification } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_changez_moi';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/register - Inscription utilisateur
 * NON-TRIVIAL: Interagit avec utilisateurs + rôles
 */
exports.register = async (req, res) => {
    try {
        const { nom_utilisateur, email, mot_de_passe, role } = req.body;

        if (!nom_utilisateur || !email || !mot_de_passe) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Vérifier si l'email existe déjà
        const userExists = await Utilisateur.findOne({ where: { email } });

        if (userExists) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Récupérer l'ID du rôle (par défaut: public)
        const roleName = role || 'public';
        const roleRecord = await Role.findOne({ where: { nom_rôle: roleName } });

        if (!roleRecord) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const user = await Utilisateur.create({
            nom_utilisateur,
            email,
            mot_de_passe: hashedPassword,
            id_rôle: roleRecord.id_rôle
        });

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
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

/**
 * POST /api/auth/login - Connexion utilisateur
 * NON-TRIVIAL: Interagit avec utilisateurs + rôles + session_authentification
 */
exports.login = async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        if (!email || !mot_de_passe) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Récupérer l'utilisateur avec son rôle
        const user = await Utilisateur.findOne({
            where: { email },
            include: [{
                model: Role,
                as: 'role',
                attributes: ['nom_rôle']
            }]
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Générer un token JWT
        const token = jwt.sign(
            {
                id: user.id_utilisateur,
                email: user.email,
                role: user.role.nom_rôle
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Enregistrer la session en BDD
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);

        await SessionAuthentification.create({
            id_utilisateur: user.id_utilisateur,
            token,
            date_expiration: expirationDate,
            actif: true
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id_utilisateur,
                nom: user.nom_utilisateur,
                email: user.email,
                role: user.role.nom_rôle
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
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

        await SessionAuthentification.update(
            { actif: false },
            { where: { token } }
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
        const session = await SessionAuthentification.findOne({
            where: { token, actif: true }
        });

        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        if (new Date(session.date_expiration) < new Date()) {
            return res.status(401).json({ error: 'Session expired' });
        }

        // Récupérer les infos complètes de l'utilisateur
        const user = await Utilisateur.findByPk(decoded.id, {
            include: [{
                model: Role,
                as: 'role',
                attributes: ['nom_rôle']
            }],
            attributes: ['id_utilisateur', 'nom_utilisateur', 'email', 'date_creation']
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id_utilisateur,
            nom: user.nom_utilisateur,
            email: user.email,
            role: user.role.nom_rôle,
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

