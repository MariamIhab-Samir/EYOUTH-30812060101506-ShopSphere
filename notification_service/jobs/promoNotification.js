const {PrismaClient}=require('@prisma/client');
const {sendEmail}=require('../util/mailer');
const { buildPromoEmail } = require('../emails/promoNotification');
const prisma=new PrismaClient();

async function sendPromoNotificationEmails(){
    const pending=await prisma.notification.findMany({
        where:{emailedAt: null},
        //include:{user:true, product:true}
    });

    if(pending.length===0)return 0;
    const byUser={};
    for(const n of pending){
        if(!byUser[n.userId])byUser[n.userId]={userEmail:n.userEmail, notificationIds:[], products:[]};
        byUser[n.userId].products.push(n);
        byUser[n.userId].notificationIds.push(n.id);
    }

    let emailedCount=0;
    for(const userId in byUser){
        const{userEmail, products, notificationIds}=byUser[userId];
        const {html}=buildPromoEmail(products)
        try{
            await sendEmail({
                to:userEmail,
                subject:products.length>1 ? `${products.length} new arrivals you might like`
                    :`ew arrival: $(products[0].name)`,
                html
            });
            await prisma.notification.updateMany({
                where:{id: {in: notificationIds}},
                data: {emailedAt: new Date()}
            });

            emailedCount++;
        }catch(err){
            console.error(`[Promo Emails] Failed to email user ${userId}:`, err);
        }
    }
    return emailedCount;
}

module.exports=sendPromoNotificationEmails;