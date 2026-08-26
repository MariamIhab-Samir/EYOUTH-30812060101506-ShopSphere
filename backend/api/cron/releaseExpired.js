const releaseExpiredReservations=require('../jobs/releaseExpiredReservations');
const {log}= require('../../util/logger');

module.exports=async(req,res)=>{
    if(req.headers['authorization']!==`Bearer ${process.env.CRON_SECRET}`){
        return res.status(401).end();
    }
    try{
        const releasedCount=await releaseExpiredReservations();
        if(releasedCount>0){
            log('info', 'expired reservations released', {releasedCount});
        }
        return res.status(200).json({releasedCount})
    }catch(err){
        log('error', 'reservation cleanup failed',{errorMessage: err?.message?? String(err)});
        return res.status(500).json({error: 'Cleanup failed'})
    }
}