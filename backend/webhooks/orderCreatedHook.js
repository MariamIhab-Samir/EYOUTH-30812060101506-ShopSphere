const {PrismaClient}=require('@prisma/client');
const {buildOrderConfirmationEmail}=require('../emails/orderConfirmation');
const {sendEmail}=require('../util/mailer');
const activityLogModal=require('../config/activityLog');
const prisma = new PrismaClient();

const handleOrderCreatedWebhook=async(req, res)=>{
    const secret=req.headers['x-webhook-secret'];
    if(secret!==process.env.WEBHOOK_SECRET){
        return res.status(401).json({error: 'Unauthorized'});
    }

    const {orderId}=req.body;
    if(!orderId){
        return res.status(400).json({error: 'orderId is required'})
    }

    try{
        const order=await prisma.order.findUnique({
            where:{id: Number(orderId)},
            include:{
                user:true,
                items:{include:{product:true}}
            }
        });

        if(!order){
            return res.status(404).json({error:'Order not found'});
        }

        const{html}=
            buildOrderConfirmationEmail(order);
        await sendEmail({
            to: order.user.email,
            subject:`Order Confirmation #${order.id}`,
            html
        });

        activityLogModal.create({
            action:'ORDER_CONFIRMATION_WEBHOOK',
            status: 'SUCCESS',
            details: {httpStatus:200, orderId: order.id}
        }).catch(err=>console.error('Log bypass', err))
        return res.status(200).json({success:true, message:'Confirmation email sent'});
    }catch(err){
        console.error('Order created webhook error:', err);
        activityLogModal.create({
            action:'ORDER_CONFIRMATION_WEBHOOK',
            status: 'FAILURE',
            details: {httpStatus:500, orderId: req.body?.orderId, error: err.message}
        }).catch(err=>console.error('Log bypass', err))
        return res.status(500).json({error:'Failed to process order-created webhook'})
    }
};

module.exports={handleOrderCreatedWebhook};