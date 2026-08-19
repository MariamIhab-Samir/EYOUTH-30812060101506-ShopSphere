const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const activityLogModal = require('../config/activityLog');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const login = async (req, res) => {
    try {
        
        const { email, password, isAdminTab } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            activityLogModal.create({
                action:'LOGIN_FAILED_UNKNOWN_EMAIL',
                status:'FAILURE',
                details:{httpStatus:401,email}
            }).catch(err=>console.error('Log bypass', err));
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            activityLogModal.create({
                action:'LOGIN_FAILED_WRONG_PASSWORD',
                status:'FAILURE',
                details:{httpStatus:401, userId: user.id, email:user.email}
            }).catch(err=>console.error('Log bypass', err));
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!isAdminTab && user.role === 'ADMIN') {
            activityLogModal.create({
                action: 'LOGIN_REDIRECT_ADMIN',
                status: 'FAILURE',
                details: { httpStatus:403, userId: user.id, email: user.email, attemptedAccess: 'user tab', reason: 'Admin must use Admin tab' }
            }).catch(err => console.error('Error logging activity:', err));

            return res.status(403).json({ 
                error: 'You have an admin account. Please use the Admin tab to log in',
                redirectToAdminTab: true 
            });
        }

        if (isAdminTab && user.role !== 'ADMIN') {
            activityLogModal.create({
                user: { id: user.id, email: user.email },
                action: 'LOGIN_FORBIDDEN_ADMIN',
                status: 'FAILURE',
                details: { httpStatus:403, userId: user.id, email: user.email, attemptedAccess: 'admin tab', reason: 'User is not an admin' }
            }).catch(err => console.error('Error logging activity:', err));

            return res.status(403).json({ 
                error: 'Access denied. Admin privileges required.',
                redirectToUserTab: true 
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, name: user.name},
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        activityLogModal.create({
            user: { id: user.id, email: user.email },
            action: 'LOGIN',
            status: 'SUCCESS',
            details: { httpStatus:200, userId:user.id, email:user.email }
        }).catch(err => console.error('Log bypass:', err));

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role ,
                age: user.age,
                gender: user.gender,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        await activityLogModal.create({
            action: 'LOGIN',
            status: 'FAILURE',
            details: { error: error.message, errorStack: error.stack },
        }).catch(err => console.error('Error logging activity:', err));
        return res.status(500).json({ error: 'An error occurred during login.' });
    }
};

module.exports = { login };