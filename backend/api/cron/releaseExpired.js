const releaseExpiredReservations=require('../jobs/releaseExpiredReservations');

module.exports=async(req,res)=>{
    if(req.headers['authorization']!==`Bearer ${process.env.CRON_SECRET}`){
        return res.status(401).end();
    }
    try{
        const releasedCount=await releaseExpiredReservations();
        if(releasedCount>0){
            console.log(`[Reservation Cleanup] Released ${releasedCount} expired cart reservation(s)`);
        }
        return res.status(200).json({releasedCount})
    }catch(err){
        console.error('[Reservation Cleanup] Failed to release expired reservations', err);
        return res.status(500).json({error: 'Cleanup failed'})
    }
}