require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const reviewRouter=require('./routes/routes');
const {log}=require('./util/logger');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const app=express();
app.set('trust proxy', 1);
const PORT=process.env.PORT || 5001;

const allowedOrigins=[
    'https://frontend-eyouth-30812060101506-shopsphere.vercel.app',
    'http://localhost:3000',
    'http://localhost:3010'
]
app.use(cors({
    origin: function (origin, callback){
        if(!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        }else{
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
const limiter= rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
    return res.status(200).json({ status: 'UP', timestamp: new Date() });
});

let isConnected = false;

const delay=(ms)=> new Promise(resolve=> setTimeout(resolve, ms))
const connectDB=async()=>{
    if(isConnected && mongoose.connection.readyState===1)return;
    const mongoUri=process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_logs';
    const maxAttempts=3;
    let lastError;

    for (let attempt=1; attempt <=maxAttempts; attempt++){
        try{
            await mongoose.connect(mongoUri);
            isConnected=true;
            log('info', '[STATUS 200] MongoDB connected successfully', {attempt});
            return;
        }catch(err){
            lastError=err;
            log('error', `MongoDB connection attempt ${attempt} of ${maxAttempts} failed`, {errorMessage: err.message});
            if(attempt<maxAttempts){
                await delay(attempt * 500)
            }
        }
    }
    isConnected= false;
    throw lastError;
}

app.use(async (req, res, next)=> {
    try{
        await connectDB();
        next();
    }catch(err){
        log('error', 'DB connection failed for request', {errorMessage: err.message});
        return res.status(503).json({error: 'Database temporarily unavailable, please retry'});
    }
});
app.use('/api', reviewRouter);

const startServer = async () => {
    try {
        await connectDB();
        log('info', '[STATUS 200] MongoDB connected successfully. (Review Service Engine online).');

    } catch (error) {
        log ('error', '[STATUS 500] Critical starting failure', {errorMessage: error.message});
    }
    if (process.env.NODE_ENV !== 'test'){
        app.listen(PORT, () => {
            log('info', '[STATUS 200] Review Service running independently on port', {port: PORT});
            log('info', 'Health Check active', {url:`http://localhost:${PORT}/health`});;
        });
    }
};

startServer();

module.exports = app;