const sendPromoNotificationEmails=require('../jobs/promoNotification');

module.exports=async(req, res)=>{
    if(req.headers['authorization']!==`Bearer ${process.env.CRON_SECRET}`){
        return res.status(401).end();
    }
    try{
        const emailedCount=await sendPromoNotificationEmails();
        if(emailedCount>0){
            console.log(`[Promo Emails] Sent digest to ${emailedCount} user(s)`);
        }
        return res.status(200).json({emailedCount});
    }catch(err){
        console.error('[Promo emails] Failed to send notification emails', err);
        return res.status(500).json({error: 'Promo email job failed'})
    }
}