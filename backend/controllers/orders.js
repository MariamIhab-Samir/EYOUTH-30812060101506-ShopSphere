const { PrismaClient } = require('@prisma/client');
const activityLogModal = require('../config/activityLog');
const prisma = new PrismaClient();

const createOrder = async (req, res) => {
    
    const userId = req.user.userId;
    const {couponCode} = req.body;
    try {
        const orderResult = await prisma.$transaction(async (tx) => {
            const cartItems = await tx.cartItem.findMany({
                where: { userId }
            });
            if (cartItems.length === 0) {
                throw new Error('Cart is empty. Cannot create an order.');
            }

            let totalPrice = 0;
            const orderItemsData = [];
            for (const item of cartItems) {
                const product=await tx.product.findUnique({where:{id: item.productId}})

                totalPrice += product.price * item.quantity;
                orderItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity
                });

            }

            let appliedDiscount=0;
            let redeemedCouponId=null;
            if(couponCode){
                const coupon=await tx.coupon.findUnique({where:{code: couponCode}})
                if(!coupon){
                    throw new Error('Coupon not found')
                }
                if(coupon.stock<=0){
                    throw new Error('Coupon is out of stock')
                }
                const isExpired= coupon.expiresAt && new Date(coupon.expiresAt)<new Date();
                if(isExpired){
                    throw new Error('Coupon has expired')
                }
            }
            
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    status: 'SUCCESS', 
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: true
                }
            });

            if(redeemedCouponId){
                await tx.coupon.update({
                    where:{id: redeemedCouponId},
                    data: {stock: {decrement: 1}}
                })
                await tx.couponRedemption.create({
                    data: {userId, couponId: redeemedCouponId}
                })
            }
            await tx.cartItem.deleteMany({
                where: { userId }
            });
            return newOrder;
        });

        activityLogModal.create({
            action: 'CHECKOUT',
            status: 'SUCCESS',
            details: {httpStatus:201, userId, orderId: orderResult.id, total: orderResult.totalPrice }
        }).catch(err => console.error('Logging bypass on order confirmation:', err));

        prisma.order.findUnique({
            where:{id:orderResult.id},
            include:{
                user:true,
                items:{include:{product:true}}
            }
        })

        fetch(`${process.env.APP_URL}/api/webhooks/order-created`, {
            method:'POST',
            headers:{
                'Content-Type': 'application/json',
                'x-webhook-secret': process.env.WEBHOOK_SECRET
            },
            body: JSON.stringify({orderId: orderResult.id})
        }).then(async(res)=>{
            if(!res.ok){
                const body=await res.text();
                console.error(`order-created webhook responded with ${res.status}`, body)
            }else{
                console.log('order-created webhook succeeded')
            }
        }).catch(error=> console.error('order created webhook failed:', error))

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully.',
            order: orderResult
        });

    } catch (error) {
        console.error('Checkout error execution path:', error.message);
        const isClientError=error.message.includes('empty') || error.message.includes('Coupon');
        if(!isClientError){
            activityLogModal.create({
                action: 'CHECKOUT',
                status: 'FAILURE',
                details: {httpStatus:500, userId, error: error.message }
            }).catch(err => console.error('Logging failure tracking catch:', err));
        }
       
        if (isClientError) {
            console.error('Checkout error due to empty cart:', error.message);
            return res.status(400).json({ error: error.message });
        }

        return res.status(500).json({ error: 'An internal server error occurred while processing your order.' });
    }
};

module.exports = {
    createOrder
};