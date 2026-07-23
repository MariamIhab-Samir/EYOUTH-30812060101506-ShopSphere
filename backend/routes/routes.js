const express=require('express');
const router = express.Router();

const {verifyToken, isAdmin} = require('../middleware/verifyToken'); 

const {upload}=require('../middleware/uploadPic');
const { register } = require('../controllers/signup');
const { login } = require('../controllers/login');
const { adminAddProduct, adminEditProduct, adminDeleteProduct } = require('../controllers/auth');
const { createOrder, getOrderById } = require('../controllers/orders');
const{getUserOrders}=require('../controllers/orderHistory');
const { getProducts } = require('../controllers/getProducts');
const{getProfile, updateProfile}=require('../controllers/profile');
const{getComments, addComment}=require('../controllers/comment');


router.post('/signup', register);
router.post('/login', login);
router.post('/admin/login', login);

router.get('/products', getProducts);

router.get('/products/:productId/comments', getComments);
router.post('/products/:productId/comments', verifyToken, addComment);
router.get('/profile', verifyToken, getProfile);

router.put('/profile', verifyToken, updateProfile);

router.post('/orders', verifyToken, createOrder);

router.get('/orders/:userId?', verifyToken, getUserOrders);

router.post('/admin/products', verifyToken, isAdmin, upload.single('productImage'), adminAddProduct);
router.put('/admin/products/:id', verifyToken, isAdmin, upload.single('productImage'), adminEditProduct);
router.delete('/admin/products/:id', verifyToken, isAdmin, adminDeleteProduct)

module.exports = router;