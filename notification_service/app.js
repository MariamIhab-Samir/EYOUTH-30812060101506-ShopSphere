require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const notificationRouter=require('./routes/routes');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const app=express();
app.set('trust proxy', 1);
const PORT=process.env.PORT || 5002;

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

app.use('/api', notificationRouter);

const startServer = async () => {
    try {
        if (process.env.NODE_ENV !== 'test'){
            app.listen(PORT, () => {
                console.log(`[STATUS 200] Notification Service running independently on port: ${PORT}`);
                console.log(`Health Check active at http://localhost:${PORT}/health`);
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