const { PrismaClient } = require('@prisma/client');
const activityLogModal = require('../config/activityLog');

const prisma = new PrismaClient();

const createOrder = async (req, res) => {
    
    const userId = req.user.userId; 

    const{items}=req.body
    try {

        if (!items || !Array.isArray(items)||items.length === 0) {
            return res.status(400).json({ error: 'Cannot process checkout. Your shopping cart is empty.' });
        }

        
        const orderResult = await prisma.$transaction(async (tx) => {
            let totalPrice = 0;
            const orderItemsData = [];

            for (const{productId, quantity} of items) {
                const product=await tx.product.findUnique({where:{id: productId}})

                if (product.stock < quantity) {
                    throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}`);
                }

                totalPrice += product.price * quantity;

                
                orderItemsData.push({
                    productId,
                    quantity
                });

                
                await tx.product.update({
                    where: { id: productId },
                    data: {
                        stock: {
                            decrement: quantity
                        }
                    }
                });
            }

            
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    status: 'PENDING', 
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: true
                }
            });

            return newOrder;
        });

        activityLogModal.create({
            action: 'CHECKOUT',
            status: 'SUCCESS',
            details: {httpStatus:201, userId, orderId: orderResult.id, total: orderResult.totalPrice }
        }).catch(err => console.error('Logging bypass on order confirmation:', err));

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully.',
            order: orderResult
        });

    } catch (error) {
        console.error('Checkout error execution path:', error.message);
        const isStockError=error.message.includes('Insufficient stock');
        if(!isStockError){
            activityLogModal.create({
                action: 'CHECKOUT',
                status: 'FAILURE',
                details: {httpStatus:500, userId, error: error.message }
            }).catch(err => console.error('Logging failure tracking catch:', err));
        }
       
        if (isStockError) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(500).json({ error: 'An internal server error occurred while processing your order.' });
    }
};

module.exports = {
    createOrder
};
