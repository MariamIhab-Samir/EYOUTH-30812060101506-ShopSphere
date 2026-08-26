function log(level, message, meta = {}){
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(JSON.stringify({level, timestamp: new Date().toISOString(), message, ...meta}));
}
module.exports={log}