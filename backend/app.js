require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRouter = require('./routes/routes');
const profileRouter=require('./routes/routes');
const path=require('path');
const activityModal=require('./config/activityLog')

const app = express();
const PORT = 5000;

app.use(cors()); 
app.use(express.json());

app.get('/health', (req, res) => {
    return res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.get('/', (req,res)=>{
    return res.status(200).json({status: 'UP', message: 'Core baseline operational'})
})

app.use('/api/auth', authRouter);
app.use('/api', authRouter);

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

const startServer = async () => {
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