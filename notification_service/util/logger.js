function log(level, message, meta = {}){
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    
    const cairoTime= new Date(Date.now() + 3 * 60 * 60 * 1000)
        .toISOString()
        .replace('Z', '+03:00')
    fn(JSON.stringify({level, timestamp: cairoTime, message, ...meta}));
}
module.exports={log}