const express=require('express');
const router = express.Router();

const {verifyToken, isAdmin} = require('../middleware/verifyToken'); 

const {upload}=require('../middleware/uploadPic');
const { register } = require('../controllers/signup');
const { login } = require('../controllers/login');
const { adminAddProduct, adminEditProduct, adminDeleteProduct } = require('../controllers/auth');
const { createOrder} = require('../controllers/orders');
const{getUserOrders}=require('../controllers/orderHistory');
const { getProducts } = require('../controllers/getProducts');
const{getProfile, updateProfile}=require('../controllers/profile');
const{getComments, addComment}=require('../controllers/comment');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart} = require('../controllers/cart');
const {sendConfirmationEmail}=require('../api/sendConfirmation');
const {validateCoupon}=require('../api/validateCoupon');
const{checkAvailability}=require('../api/checkAvaliability');
const{handleOrderCreatedWebhook}=require('../webhooks/orderCreatedHook');
const{handleStockLowWebhook}=require('../webhooks/stockLowHook');
const { handleProductCreatedWebhook } = require('../webhooks/productCreated');
const {getCoupons, getCouponInventory}=require('../controllers/coupons')

router.post('/signup', register);
router.post('/login', login);
router.post('/admin/login', login);

router.get('/products', getProducts);

router.get('/cart', verifyToken, getCart);
router.post('/cart', verifyToken, addToCart);
router.put('/cart/:id', verifyToken, updateCartItem);
router.delete('/cart/:id', verifyToken, removeFromCart);
router.delete('/cart', verifyToken, clearCart);

router.get('/products/availability', checkAvailability)
router.get('/products/:productId/comments', getComments);
router.post('/products/:productId/comments', verifyToken, addComment);
router.post('/webhooks/stock-low', handleStockLowWebhook);
router.get('/profile', verifyToken, getProfile);

router.put('/profile', verifyToken, updateProfile);

router.post('/orders', verifyToken, createOrder);

router.get('/orders/:userId?', verifyToken, getUserOrders);
router.post('/send-confirmation', sendConfirmationEmail);
router.post('/webhooks/order-created', handleOrderCreatedWebhook);
router.post('/coupons/validate', validateCoupon);
router.get('/coupons/codes', getCoupons);
router.get('/coupons/inventory', verifyToken, getCouponInventory)

router.post('/admin/products', verifyToken, isAdmin, upload.single('productImage'), adminAddProduct);
router.post('/webhooks/product-created', handleProductCreatedWebhook);
router.put('/admin/products/:id', verifyToken, isAdmin, upload.single('productImage'), adminEditProduct);
router.delete('/admin/products/:id', verifyToken, isAdmin, adminDeleteProduct);

module.exports = router;