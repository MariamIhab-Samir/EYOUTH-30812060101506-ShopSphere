const cron=require('node-cron');
const sendPromoNotificationEmails=require('./promoNotification')
function startPromoEmailJob(){
    cron.schedule('0 9 * * *', async()=>{
        try{
            const emailedCount=await sendPromoNotificationEmails();
            if(emailedCount>0){
                console.log(`[Promo Emails] Sent digest to ${emailedCount} user(s).`)
            }
        }catch(err){
            console.error(`[Promo emails] Dailed to send notification emails`, err);
        }
    })
    console.log('[Promo Emails] Scheduled job registered (daily at 9am).')
}
module.exports={startPromoEmailJob}