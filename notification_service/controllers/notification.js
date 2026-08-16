const{PrismaClient}=require('@prisma/client');
const sendPromoNotificationEmails=require('../jobs/promoNotification')
const prisma=new PrismaClient();

const handleProductCreated=async(req, res)=>{
    const secret=req.headers['x-webhook-secret'];
    if(secret!==process.env.WEBHOOK_SECRET){
        return res.status(401).json({error: 'Unauthorized'});
    }

    const {productId, productName, productImage, productCategory, productDescription, matchedUsers}=req.body;
    if(!productId || !matchedUsers){
        return res.status(400).json({error: 'productId and matchedUsers are required'})
    }

    try{

        await Promise.all(matchedUsers.map(user=>
            prisma.notification.upsert({
                where: {userId_productId:{
                    userId: user.id, productId
                }},
                update:{},
                create:{
                    userId: user.id,
                    userEmail: user.email,
                    productId,
                    productName,
                    productImage,
                    productCategory,
                    productDescription,
                    type:'NEW_PRODUCT_MATCH',
                }
            })
        ));
        console.log('DEBUG DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 'UNDEFINED');
        const emailedCount=await sendPromoNotificationEmails();
        return res.status(200).json({success:true, matched:matchedUsers.length, message:'Promotion email sent', emailed: emailedCount});
    }catch(err){
        console.error('Product-created webhook error:', err);
        return res.status(500).json({error:'Failed to process product-created webhook'})
        
    }
};

module.exports={handleProductCreated};