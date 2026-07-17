const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.user = verified; // { id, email, role_id, ... }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid Token' });
    }
};

module.exports = authMiddleware;
