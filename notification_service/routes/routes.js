const express=require('express');
const router = express.Router();

const { handleProductCreated } = require('../controllers/notification');

router.post('/notifications/product-created', handleProductCreated);

module.exports=router;