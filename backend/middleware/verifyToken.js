const jwt = require('jsonwebtoken');
const activityLogModal=require('../config/activityLog')

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access Denied: No Token Provided' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = verified; 
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or Expired Token' });
    }
};

const isAdmin = (req, res, next) => {
    
    if (req.user && req.user.role === 'ADMIN') {
        next(); 
    } else {
        activityLogModal.create({
                action: 'ADMIN_ACTION_FORBIDDEN',
                status: 'FAILURE',
                details: {httpStatus:403, adminId: req.user?.userId?? null}})
        return res.status(403).json({ error: 'Forbidden: Administrative Privileges Required' });
    }
};

module.exports = { verifyToken, isAdmin };