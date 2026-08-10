const cron=require('node-cron');
const releaseExpiredReservations=require('./releaseExpiredReservations');

function startReservationCleanupJob(){
    cron.schedule('*/5 * * * *', async()=>{
        try{
            const releasedCount=await releaseExpiredReservations();
            if(releasedCount>0){
                console.log(`
                    [Reservation Cleanup] Released ${releasedCount} expired cart reservation(s).`)
            }
        }catch(err){
            console.error('[Reservation Cleanup] Failed to release expired reservations', err);
        }
    })

    console.log('[Reservation Cleanup] Scheduled job registered (every 5 minutes).')
}

module.exports={startReservationCleanupJob}