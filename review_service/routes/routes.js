const express=require('express');
const router = express.Router();

const{getComments, addComment, getReviewStats}=require('../controllers/comment');

router.get('/products/:productId/comments', getComments);
router.post('/products/:productId/comments', addComment);
router.get('/reviews/stats', getReviewStats);

module.exports = router;