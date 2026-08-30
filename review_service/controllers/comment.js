const Comment=require('../config/commentModal');
const {log}=require('../util/logger');

const getComments= async(req, res)=>{
    try{
        const productId= parseInt(req.params.productId, 10);

        const comments= await Comment.find({productId}).sort({createdAt: 1});

        const formatted= comments.map(c=>({
            id: c._id,
            text: c.text,
            rating: c.rating,
            user: c.userName
        }));

        return res.status(200).json(formatted);
    }catch(error){
        log('error', 'Fetch comments error', {errorMessage: err?.message ?? String(err)});
        return res.status(500).json({error:'An error occurred while fetching comments'})
    }
};

const addComment= async(req, res)=>{
    let comment;
    try{
        const productId= parseInt(req.params.productId, 10);
        const {text, rating, userId, userName}= req.body;
        const secret=req.headers['x-webhook-secret'];

        if(secret!==process.env.WEBHOOK_SECRET){
            return res.status(401).json({error:'Unauthorized'})
        }

        if(!text || !text.trim()){
            return res.status(400).json({error:'Comment text is required'});
        }

        const numericRating= parseInt(rating, 10);
        if(isNaN(numericRating) || numericRating<1 || numericRating>5){
            return res.status(400).json({error:'Rating must be between 1 and 5'})
        }

        if(!userId){
            return res.status(400).json({error:'userId is required'})
        }

        comment=await Comment.create({
            productId,
            userId,
            userName: userName || 'Anonymous',
            text,
            rating: numericRating
        });

        return res.status(201).json({
            id:comment._id,
            text:comment.text,
            rating:comment.rating,
            user:comment.userName
        });
    }catch(error){
        log ('error', 'Add comment error', {errorMessage: error?.message ?? String(error)});
        return res.status(500).json({error:'An error occured while posting your comment'});
    }
}

const getReviewStats=async(req, res)=>{
    try{
        const stats=await Comment.aggregate([
            {
                $group: {
                    _id: '$productId',
                    total: {$sum: '$rating'},
                    count: {$sum: 1}
                }
            }
        ]);

        const formatted=stats.map(s=>({
            productId: s._id,
            rating: +(s.total/s.count).toFixed(1),
            reviewCount: s.count
        }));

        return res.status(200).json(formatted);
    }catch(error){
        log ('error', 'Fetch review stats error', {errorMessage: err?.message ?? String(err)});
        return res.status(500).json({error: 'An error occurred while fetching review stats'})
    }
}

module.exports={getComments, addComment, getReviewStats};