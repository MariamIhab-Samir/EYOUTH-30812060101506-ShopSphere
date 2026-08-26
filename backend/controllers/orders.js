const { PrismaClient } = require('@prisma/client');
const activityLogModal = require('../config/activityLog');
const prisma=new PrismaClient();
const sessionPrisma = new PrismaClient({
    datasources: {db: {url: process.env.SESSION_URL}}
});
const {log}= require('../util/logger');

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
            let subtotal = totalPrice;
            let appliedDiscount=0;
            let redeemedCouponId=null;
            if(couponCode){
                const coupon=await tx.coupon.findUnique({where:{code: couponCode}})
                if(!coupon){
                    throw new Error('Coupon not found')
                }
                const isExpired= coupon.expiresAt && new Date(coupon.expiresAt)<new Date();
                if(isExpired){
                    throw new Error('Coupon has expired')
                }
                const userRedemptionCount=await tx.couponRedemption.count({
                    where: {userId, couponId: coupon.id}
                })
                const remainingForUser=coupon.stock-userRedemptionCount
                if(remainingForUser <= 0){
                    throw new Error('Coupon stock exhausted for this user')
                }
                appliedDiscount = coupon.discountPercent;
                redeemedCouponId = coupon.id;
            }

            const finalPrice = appliedDiscount > 0
                ? subtotal * (1 - appliedDiscount / 100)
                : subtotal;
            
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalPrice: finalPrice,
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
                await tx.couponRedemption.create({
                    data: {userId, couponId: redeemedCouponId}
                })
            }
            await tx.cartItem.deleteMany({
                where: { userId }
            });
            return newOrder;
        }, {maxWait: 10000, timeout: 10000});

        activityLogModal.create({
            action: 'CHECKOUT',
            status: 'SUCCESS',
            details: {httpStatus:201, userId, orderId: orderResult.id, total: orderResult.totalPrice }
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))

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
                log('warn', 'order-created webhook responded with non-2xx status',{status: res.status, orderId: orderResult.id, responseBody: body})
            }else{
                log('info', 'order-created webhook succeeded', {orderId: orderResult.id});
            }
        }).catch(error=> log('error', 'order-created webhook failed',{orderId: orderResult.id, errorMessage: error?.message?? String(error)}));
        return res.status(201).json({
            success: true,
            message: 'Order placed successfully.',
            order: orderResult
        });

    } catch (error) {
        log('warn', 'checkout rejected',{userId, reason: error.message})
        const isClientError=error.message.includes('empty') || error.message.includes('Coupon');
        if(!isClientError){
            activityLogModal.create({
                action: 'CHECKOUT',
                status: 'FAILURE',
                details: {httpStatus:500, userId, error: error.message }
            }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        }
       
        if (isClientError) {
            log('error', 'checkout failed',{userId, reason: error.message})
            return res.status(400).json({ error: error.message });
        }

        return res.status(500).json({ error: 'An internal server error occurred while processing your order.' });
    }
};

module.exports = {
    createOrder
};