const { PrismaClient } = require('@prisma/client');
const activityLogModal = require('../config/activityLog');
const {log}= require('../util/logger');

const prisma = new PrismaClient();

const getUserOrders = async (req, res) => {
    const userId = req.user.userId;

    try {
        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: { product: true }
                }
            },
            orderBy: {
                createdAt: 'desc' 
            }
        });

        activityLogModal.create({
            action: 'ORDERS_RETRIEVED',
            status: 'SUCCESS',
            details: {httpStatus:200, userId, count:orders.length}})
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        log('error', 'get user orders failed', {userId, errorMessage: error?.message?? String(error)});
        activityLogModal.create({
            action: 'ORDERS_RETRIEVED',
            status: 'FAILURE',
            details: {httpStatus:500, userId, errror:error.message}})
        return res.status(500).json({ error: 'Failed to retrieve order history.' });
    }
};

module.exports={getUserOrders}