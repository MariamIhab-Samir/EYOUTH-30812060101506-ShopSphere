const {PrismaClient}=require('@prisma/client');
const {buildStockLowEmail}=require('../emails/stockLow');
const {sendEmail}=require('../util/mailer')
const prisma=new PrismaClient();

const handleStockLowWebhook=async(req, res)=>{
    const secret=req.headers['x-webhook-secret'];
    if(secret!==process.env.WEBHOOK_SECRET){
        return res.status(401).json({error: 'Unauthorized'});
    }

    const {productId}=req.body;
    if(!productId){
        return res.status(400).json({error: 'productId is required'})
    }

    try{
        const product=await prisma.product.findUnique({
            where:{id: Number(productId)}
        });

        if(!product){
            return res.status(404).json({error:'Product not found'});
        }

        const{html}=
            buildStockLowEmail(product);
        await sendEmail({
            to: process.env.ADMIN_ALERT_EMAIL,
            subject:`Low stock alert: ${product.name} (${product.stock} left)`,
            html
        });

        activityLogModal.create({
            action:'STOCK_LOW_WEBHOOK',
            status: 'SUCCESS',
            details: {httpStatus:200, productId: product.id, stock: product.stock}
        }).catch(err=>console.error('Log bypass', err))
        return res.status(200).json({success:true, message:'Low Stock alert sent'});
    }catch(err){
        console.error('Stock low webhook error:', err);
        activityLogModal.create({
            action:'STOCK_LOW_WEBHOOK',
            status: 'FAILURE',
            details: {httpStatus:500, productId: req.body?.productId, error: err.message}
        }).catch(err=>console.error('Log bypass', err))
        return res.status(500).json({error:'Failed to process stock-low webhook'})
    }
};

module.exports={handleStockLowWebhook};