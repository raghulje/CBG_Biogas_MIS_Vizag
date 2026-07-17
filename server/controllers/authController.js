const { User, Role, UserActivityLog, Permission } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const generateTokens = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        role: user.role ? user.role.name : null
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: process.env.JWT_EXPIRY || '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key', { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });

    return { accessToken, refreshToken };
};

const crypto = require('crypto');
const { PasswordResetToken } = require('../models');
const emailService = require('../services/emailService');
// Prefer explicit FRONTEND_URL, then CLIENT_ORIGIN (legacy), else localhost for dev
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3015';

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email) return res.status(400).json({ message: 'Email is required' });
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(200).json({ message: 'If an account exists for this email, a reset link has been sent.' });
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await PasswordResetToken.create({ user_id: user.id, token, expires_at: expiresAt });
        const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
        const subject = 'Password reset for BioGas MIS';
        const body = `<p>Hello ${user.name || ''},</p>\n<p>We received a request to reset your password. Click the link below to reset it (valid for 1 hour):</p>\n<p><a href="${resetLink}">${resetLink}</a></p>\n<p>If you didn't request this, ignore this email.</p>`;
        try { await emailService.sendEmail(user.email, subject, body); } catch (e) { console.warn('Forgot password email failed:', e.message); }
        res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
    } catch (err) {
        console.error('forgotPassword error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body || {};
        if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });
        const row = await PasswordResetToken.findOne({ where: { token } });
        if (!row || row.used) return res.status(400).json({ message: 'Invalid or used token' });
        if (new Date(row.expires_at) < new Date()) return res.status(400).json({ message: 'Token expired' });
        const user = await User.findByPk(row.user_id);
        if (!user) return res.status(400).json({ message: 'Invalid token' });
        user.password = password;
        await user.save();
        row.used = true;
        await row.save();
        await UserActivityLog.create({ user_id: user.id, activity_type: 'PASSWORD_RESET', description: 'User reset password via token', ip_address: req.ip });
        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('resetPassword error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

function parseUserAgent(ua) {
    if (!ua) return { userAgent: '', deviceType: 'Unknown', os: '', browser: '' };
    const uaLower = ua.toLowerCase();
    let deviceType = 'Desktop';
    if (/mobile|android|iphone|ipad|ipod/.test(uaLower)) deviceType = 'Mobile';
    if (/tablet/.test(uaLower)) deviceType = 'Tablet';

    let os = '';
    if (/android/.test(uaLower)) os = 'Android';
    else if (/iphone|ipad|ipod/.test(uaLower)) os = 'iOS';
    else if (/windows/.test(uaLower)) os = 'Windows';
    else if (/mac os|macintosh/.test(uaLower)) os = 'macOS';
    else if (/linux/.test(uaLower)) os = 'Linux';

    let browser = '';
    if (/chrome\/\d+/.test(uaLower) && !/edge\/\d+/.test(uaLower)) browser = 'Chrome';
    else if (/safari\/\d+/.test(uaLower) && /version\/\d+/.test(uaLower)) browser = 'Safari';
    else if (/firefox\/\d+/.test(uaLower)) browser = 'Firefox';
    else if (/edge\/\d+/.test(uaLower)) browser = 'Edge';
    else if (/opr\/\d+/.test(uaLower)) browser = 'Opera';

    return { userAgent: ua, deviceType, os, browser };
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        console.log('Login attempt for:', email);

        const user = await User.findOne({
            where: { email },
            include: [{ model: Role, as: 'role' }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            try {
                const uaInfo = parseUserAgent(req.get('user-agent') || '');
                await UserActivityLog.create({
                    user_id: user.id,
                    activity_type: 'LOGIN_FAILED',
                    description: 'Invalid password',
                    ip_address: req.ip,
                    metadata: uaInfo
                });
            } catch (logErr) {
                console.warn('Activity log failed:', logErr.message);
            }
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.is_active) {
            return res.status(403).json({ message: 'Account is inactive' });
        }

        const tokens = generateTokens(user);

        try {
            const uaInfo = parseUserAgent(req.get('user-agent') || '');
            await UserActivityLog.create({
                user_id: user.id,
                activity_type: 'LOGIN',
                description: 'User logged in successfully',
                ip_address: req.ip,
                metadata: uaInfo
            });
        } catch (logErr) {
            console.warn('Activity log failed:', logErr.message);
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            ...tokens
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key', (err, user) => {
        if (err) return res.sendStatus(403);
        // We need to fetch the user again to ensure role/permissions are up to date logic if needed
        // For now, re-sign based on payload
        // Ideally fetch user from DB
        User.findByPk(user.id, { include: ['role'] }).then(dbUser => {
            if (!dbUser) return res.sendStatus(403);
            const tokens = generateTokens(dbUser);
            res.json(tokens);
        });
    });
};

exports.logout = async (req, res) => {
    // In stateless JWT, logout is client-side (delete token). 
    // Server-side we can log the activity.
    if (req.user) {
        await UserActivityLog.create({
            user_id: req.user.id,
            activity_type: 'LOGOUT',
            description: 'User logged out',
            ip_address: req.ip
        });
    }
    res.json({ message: 'Logged out successfully' });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [
                { model: Role, as: 'role', include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }] },
                { model: Permission, as: 'permissions', through: { attributes: [] } },
            ],
            attributes: { exclude: ['password'] }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const userData = user.toJSON();

        // Admin always gets everything in the UI too
        if (userData.role && (userData.role.name === 'Admin' || userData.role.name === 'SuperAdmin')) {
            // No need to inject, UI will check role
        } else {
            // Inject effective permissions for the frontend (strict user-based only)
            userData.permissions = userData.permissions || [];
        }

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createUser = async (req, res) => {
    // Basic user creation for Admin
    try {
        const { name, email, password, role_id } = req.body;
        const exists = await User.findOne({ where: { email } });
        if (exists) return res.status(400).json({ message: 'Email already exists' });

        const newUser = await User.create({ name, email, password, role_id });
        res.status(201).json({ message: 'User created successfully', user: { id: newUser.id, email: newUser.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
