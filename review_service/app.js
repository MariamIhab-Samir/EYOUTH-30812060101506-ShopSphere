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

app.use('/api', reviewRouter);

const startServer = async () => {
    try {

        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_logs';
        await mongoose.connect(mongoUri);
        
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