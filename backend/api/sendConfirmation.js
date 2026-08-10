const { buildOrderConfirmationEmail } = require('../emails/orderConfirmation');
const {sendEmail}=require('../util/mailer');
const{PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();
const activityLogModal=require('../config/activityLog');

async function sendConfirmationEmail (req, res){
    if(req.method!=='POST'){
        return res.status(405).json({error:'Method not allowed'})
    }

    const {orderId}=req.body;
    if(!orderId){
        return res.status(400).json({error:'orderId is required'})
    }

    try{
        const order=await prisma.order.findUnique({
            where:{
                id: Number(orderId)
            },
            include:{
                user:true, items: {include:{product: true}}
            }
        });
        if(!order){
            return res.status(404).json({error:'Order not found'})
        }
        console.log('Order found:', order.id, order.user.email);
        const{html}=buildOrderConfirmationEmail(order);
        await sendEmail({
            to:order.user.email,
            subject:`Order Confirmation #${order.id}`,
            html
        });
        console.log('sendEmail resolved')
        activityLogModal.create({
            action:'CONFIRMATION_EMAIL_SENT',
            status: 'SUCCESS',
            details: {httpStatus: 200, orderId: order.id}
        }).catch(err=>console.error('Log bypass', err));
        return res.status(200).json({success:true, message:'Confirmation email sent'})
    }catch(err){
        console.error('Send confirmation email error:', err);
        activityLogModal.create({
            action:'CONFIRMATION_EMAIL_SENT',
            status: 'FAILURE',
            details: {httpStatus: 500, orderId: req.body?.orderId, error: err.message}
        }).catch(err=>console.error('Log bypass', err));
        return res.status(500).json({error:'Failed to send confirmation email'})
    }
}

module.exports={sendConfirmationEmail}