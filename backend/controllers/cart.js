const { PrismaClient } = require('@prisma/client');
const activityLogModal = require('../config/activityLog');
const releaseExpiredReservations=require('../jobs/releaseExpiredReservations')
const prisma = new PrismaClient();
const {log}= require('../util/logger');

const addToCart = async (req, res) => {
    const userId =req.user.userId;
    const {productId, quantity}=req.body;
    try{
        await releaseExpiredReservations();
        const result=await prisma.$transaction(async(tx)=>{
            const product=await tx.product.findUnique({where:{id:productId}});
            if(!product){
                throw new Error('Product not found');
            }
            if (product.stock<quantity){
                throw new Error(`Insufficient stock. Only ${product.name} available: ${product.stock}`);
            }

            const updatedProduct= await tx.product.update({
                where:{id: productId},
                data:{stock:{decrement:quantity}}
            });

            const CartItem=await tx.cartItem.upsert({
                where:{userId_productId:{
                    userId, productId
                }},
                update:{quantity:{increment:quantity},
                reservedAt: new Date()},
                create:{userId, productId, quantity,
                    reservedAt: new Date()}
                }
            );
            return {CartItem, updatedProduct};
        });

        activityLogModal.create({
            action: 'CART_ITEM_ADDED',
            status: 'SUCCESS',
            details: {httpStatus:200, userId, productId, quantity }
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))

        const threshold=Number(process.env.LOW_STOCK_THRESHOLD) || 5;
        const stockAfter=result.updatedProduct.stock;
        const stockBefore=stockAfter + quantity;
        log('info', 'stock check', {stockBefore, stockAfter, threshold})
        if(stockBefore> threshold && stockAfter<= threshold){
            fetch(`${process.env.APP_URL}/api/webhooks/stock-low`, {
                method:'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.WEBHOOK_SECRET
                },
                body: JSON.stringify({productId: result.updatedProduct.id})
            }).then(async(res)=>{
                if(!res.ok){
                    const body=await res.text();
                    log('warn', 'stock-low webhook responded with non-2xx status',{status: res.status, productId: result.updatedProduct.id, responseBody: body});
                }else{
                    log('info', 'stock-low webhook succeeded', {productId: result.updatedProduct.id});
                }
            }).catch(error=> log('error', 'stock-low webhook failed',{productId: result.updatedProduct.id, errorMessage: error?.message?? String(error)}))
        }
        return res.status(200).json({message:'Item added to cart', success:true, cartItem:result.CartItem});
    }catch (err) {
        log('error', 'Add to cart error:',{userId, productId, errorMessage: err?.message?? String(err)});
        const isNotFoundError = err.message.includes('not found');
        const isStockError = err.message.includes('Insufficient stock');
        const httpStatus = isNotFoundError ? 404 : isStockError ? 400 : 500;

        if(httpStatus===500){
            activityLogModal.create({
                action: 'CART_ITEM_ADDED',
                status: 'FAILURE',
                details: {httpStatus:500, userId, productId, quantity, error: err.message }
            }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        }
        return res.status(httpStatus).json({error: err.message || 'Internal server error'});
    }
}

const getCart = async (req, res) => {
    const userId = req.user.userId;
    try {
        await releaseExpiredReservations();
        const cartItems = await prisma.cartItem.findMany({
            where: { userId },
            include: { product: true }
        });

        activityLogModal.create({
            action: 'CART_RETRIEVED',
            status: 'SUCCESS',
            details: {httpStatus:200, userId, itemCount: cartItems.length }
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        return res.status(200).json({ cartItems });
    }catch (err) {
        activityLogModal.create({
            action: 'CART_RETRIEVED',
            status: 'FAILURE',
            details: {httpStatus:500, userId, error: err.message }
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        return res.status(500).json({ error: 'Internal server error' });
    }}

const updateCartItem = async (req, res) => {
    const userId = req.user.userId;
    const cartItemId=parseInt(req.params.id);
    const {quantity: newQuantity}=req.body;
    try{
        await releaseExpiredReservations();
        const result=await prisma.$transaction(async(tx)=>{
            const item=await tx.cartItem.findUnique({
                where:{id:cartItemId}
            });
            if(!item || item.userId !== userId){
                throw new Error('Item not found in cart');
            }

            const delta=newQuantity - item.quantity;
            if(delta>0){
                const product=await tx.product.findUnique({where:{id:item.productId}});
            if (product.stock < delta) {
                throw new Error(`Insufficient stock. Only ${product.stock} available`);
            }
        }
            const updatedProduct= await tx.product.update({
                where:{id:item.productId},
                data:{stock:{decrement:delta}}
            });
            const updatedCartItem= await tx.cartItem.update({
                where:{id:cartItemId},
                data:{quantity:newQuantity}
            });
            return{updatedProduct, updatedCartItem, delta}
        });

        activityLogModal.create({
            action: 'CART_ITEM_UPDATED',
            status: 'SUCCESS',
            details: {httpStatus:200, userId, cartItemId, newQuantity }
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))

        const threshold=Number(process.env.LOW_STOCK_THRESHOLD) || 5;
        const stockAfter=result.updatedProduct.stock;
        const stockBefore=stockAfter + result.delta;
        log('info', 'stock check', {stockBefore, stockAfter, threshold})
        if(stockBefore> threshold && stockAfter<= threshold){
            fetch(`${process.env.APP_URL}/api/webhooks/stock-low`, {
                method:'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.WEBHOOK_SECRET
                },
                body: JSON.stringify({productId: result.updatedProduct.id})
            }).then(async(res)=>{
                if(!res.ok){
                    const body=await res.text();
                    log('warn', 'stock-low webhook responded with non-2xx status',{status: res.status, productId: result.updatedProduct.id, responseBody: body});
                }else{
                    log('info', 'stock-low webhook succeeded', {productId: result.updatedProduct.id});
                }
            }).catch(error=> log('error', 'stock-low webhook failed',{productId: result.updatedProduct.id, errorMessage: error?.message?? String(error)}))
        }
        return res.status(200).json({ message: 'Item quantity updated', success: true, cartItem: result });
    } catch (err) {
        log('error', 'Update cart item error:',{userId, productId, errorMessage: err?.message?? String(err)});;
        const isNotFoundError = err.message.includes('not found');
        const isStockError = err.message.includes('Insufficient stock') || err.message.includes('not found');
        const httpStatus = isNotFoundError ? 404 : isStockError ? 400 : 500;

        if(httpStatus===500){
            activityLogModal.create({
                action: 'CART_ITEM_UPDATED',
                status: 'FAILURE',
                details: {httpStatus: 500, userId, cartItemId, newQuantity, error: err.message }
            }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        }
        return res.status(isNotFoundError ? 404 : isStockError ? 400 : 500).json({ error: err.message || 'Internal server error' });
    }
};

const removeFromCart = async (req, res) => {
    const userId = req.user.userId;
    const cartItemId=parseInt(req.params.id);

    try{
        await prisma.$transaction(async(tx)=>{
            const item=await tx.cartItem.findUnique({
                where:{id:cartItemId}
            });
            if (!item || item.userId !== userId) {
                throw new Error('Item not found in cart');
            }
            await tx.product.update({
                where:{id:item.productId},
                data:{stock:{increment:item.quantity}}
            });
            await tx.cartItem.delete({
                where:{id:item.id}})
        });
        activityLogModal.create({
            action: 'CART_ITEM_REMOVED',
            status: 'SUCCESS',
            details: {httpStatus:200, userId, cartItemId }
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        return res.status(200).json({ message: 'Item removed from cart', success: true });
    } catch (err) {
        const isNotFoundError= err.message.includes('not found');
        const isStockError = err.message.includes('Insufficient stock');
        const httpStatus = isNotFoundError ? 404 : isStockError ? 400 : 500;

        if(httpStatus===500){
            activityLogModal.create({
                action: 'CART_ITEM_REMOVED',
                status: 'FAILURE',
                details: {httpStatus: 500, userId, cartItemId, error: err.message }
            }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        }
        return res.status(httpStatus).json({ error: err.message || 'Internal server error' });
    }
};

const clearCart = async (req, res) => {
    const userId = req.user.userId;
    try{
        await prisma.$transaction(async(tx)=>{
            const items=await tx.cartItem.findMany({where:{userId}});
            for (const item of items) {
                await tx.product.update({
                    where:{id:item.productId},
                    data:{stock:{increment:item.quantity}}
                });
            }
            await tx.cartItem.deleteMany({where:{userId}});
        });
        activityLogModal.create({
            action: 'CART_CLEARED',
            status: 'SUCCESS',
            details: {httpStatus:200, userId }
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        return res.status(200).json({ message: 'Cart cleared', success: true });
    } catch (err) {
        activityLogModal.create({
            action: 'CART_CLEARED',
            status: 'FAILURE',
            details: {httpStatus: 500, userId, error: err.message }
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports={addToCart, removeFromCart, getCart, updateCartItem, clearCart};
