require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const reviewRouter=require('./routes/routes');

const app=express();
const PORT=process.env.PORT || 5001;

app.use(cors()); 
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