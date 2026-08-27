require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const reviewRouter=require('./routes/routes');
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

app.use('/api', reviewRouter);

let isConnected = false;

const connectDB=async()=>{
    if(isConnected)return;
    const mongoUri=process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_logs';
    console.log('DEBUG mongoUri length at connect time:', mongoUri.length, 'NODE_ENV', process.env.NODE_ENV);
    await mongoose.connect(mongoUri);
    isConnected=true;
    console.log('[STATUS 200] MongoDB connected successfully.')
}

const startServer = async () => {
    await connectDB();
    try {

        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_logs';
        console.log('[STATUS 200] MongoDB connected successfully. (Review Service Engine online).');

        if (process.env.NODE_ENV !== 'test'){
            app.listen(PORT, () => {
                console.log(`[STATUS 200] Review Service running independently on port: ${PORT}`);
                console.log(`Health Check active at http://localhost:${PORT}/health`);;
            });
        }

    } catch (error) {
        
        console.error(`[STATUS 500] Critical starting failure : ${error.message}`);
        
        if (process.env.NODE_ENV !== 'test'){
            process.exit(1); 
        }
    }
};

startServer();

module.exports = app;