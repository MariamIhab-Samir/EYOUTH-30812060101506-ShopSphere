const { PrismaClient } = require('@prisma/client');
const activityLogModal = require('../config/activityLog');

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
                createdAt: 'asc' 
            }
        });

        activityLogModal.create({
            action: 'ORDERS_RETRIEVED',
            status: 'SUCCESS',
            details: {httpStatus:200, userId, count:orders.length}})
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Get user orders error:', error);
        activityLogModal.create({
            action: 'ORDERS_RETRIEVED',
            status: 'FAILURE',
            details: {httpStatus:500, userId, count:error.message}})
        return res.status(500).json({ error: 'Failed to retrieve order history.' });
    }
};

module.exports={getUserOrders}