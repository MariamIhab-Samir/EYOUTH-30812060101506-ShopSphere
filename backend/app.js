require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const authRouter = require('./routes/routes');
const profileRouter=require('./routes/routes');
const orderRouter=require('./routes/routes')
const path=require('path');
const activityLogModal=require('./config/activityLog');

const app = express();
app.set('trust proxy', 1);
const PORT = 5000;

const allowedOrigins=[
    'https://project5-final-frontend.vercel.app',
    'http://localhost:3000'
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
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
    return res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.get('/', (req,res)=>{
    return res.status(200).json({status: 'UP', message: 'Core baseline operational'})
})

app.use('/api/auth', authRouter);
app.use('/api', authRouter);
app.use('/api/orders', orderRouter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((err, req, res, next)=>{
    console.error('Unhandled error:', err);
    res.status(500).json({error:'Internal server error'})
    activityLogModal.create({
                action: 'UNHANDLED_APP_ERROR',
                status: 'FAILURE',
                details:{httpStatus:500}
            }).catch(err=> console.error('Log bypass:', err))
})

let isConnected = false;

const connectDB=async()=>{
    if(isConnected)return;
    const mongoUri=process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_logs';
    await mongoose.connect(mongoUri);
    isConnected=true;
    console.log('[STATUS 200] MongoDB connected successfully.')
}

const startServer = async () => {
    await connectDB();
    try {
        console.log('Initializing system data engines...');
        
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_logs';
        await mongoose.connect(mongoUri);
        
        console.log('[STATUS 200] MongoDB connected successfully. (Activity Logging Engine online).');

        if (process.env.NODE_ENV !== 'test'){
            app.listen(PORT, () => {
                console.log(`[STATUS 200] Backend service deployed successfully on port: ${PORT}`);
                console.log(`Health Check active at http://localhost:${PORT}/health`);
            });
        }

    } catch (error) {
        
        console.error(`[STATUS 500] Critical failure during backend boot sequence: ${error.message}`);
            activityLogModal.create({
                action: 'UNHANDLED_APP_ERROR',
                status: 'FAILURE',
                details:{httpStatus:500}})
        
        if (process.env.NODE_ENV !== 'test'){
            process.exit(1); 
        }
    }
};

startServer();

module.exports = app;