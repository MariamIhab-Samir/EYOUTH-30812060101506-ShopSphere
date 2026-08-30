const sendPromoNotificationEmails=require('../../jobs/promoNotification');
const {log}=require('../../util/logger');

module.exports=async(req, res)=>{
    if(req.headers['authorization']!==`Bearer ${process.env.CRON_SECRET}`){
        return res.status(401).end();
    }
    try{
        const emailedCount=await sendPromoNotificationEmails();
        if(emailedCount>0){
            log('info', '[Promo Emails] digest sent', {emailedCount});
        }
        return res.status(200).json({emailedCount});
    }catch(err){
        log('error', '[Promo Emails] Failed to notification emails', {errorMessage: err?.message ?? String(err)});
        return res.status(500).json({error: 'Promo email job failed'})
    }
}