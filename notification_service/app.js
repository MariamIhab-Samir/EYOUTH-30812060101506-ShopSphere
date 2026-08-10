require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const notificationRouter=require('./routes/routes');
const {startPromoEmailJob}=require('./jobs/scheduler');

const app=express();
const PORT=process.env.PORT || 5002;

app.use(cors()); 
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
                console.log(`Health Check active at http://localhost:${PORT}/health`);;
                startPromoEmailJob();
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