const Comment=require('../config/commentModal');
const {PrismaClient}=require('@prisma/client');
const activityLogModal=require('../config/activityLog');

const prisma=new PrismaClient();

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
        activityLogModal.create({
            action: 'COMMENTS_RETRIEVED',
            status: 'SUCCESS',
            details:{httpStatus:200, userId: req.user?.id?? null}
        }).catch(err=>console.error('Log bypass:', err));

        return res.status(200).json(formatted);
    }catch(error){
        console.error('Fetch comments error:', error);
        activityLogModal.create({
            action: 'COMMENTS_RETRIEVED',
            status: 'FAILURE',
            details:{httpStatus:500, userId: req.user?.id??null}
        }).catch(err=>console.error('Log bypass:', err));
        return res.status(500).json({error:'An error occurred while fetching comments'})
    }
};

const addComment= async(req, res)=>{
    let comment;
    try{
        const productId= parseInt(req.params.productId, 10);
        const {text, rating}= req.body;

        if(!text || !text.trim()){
            return res.status(400).json({error:'Comment text is required'});
        }

        const numericRating= parseInt(rating, 10);
        if(isNaN(numericRating) || numericRating<1 || numericRating>5){
            return res.status(400).json({error:'Rating must be between 1 and 5'})
        }

        const user= await prisma.user.findUnique({
            where: {id: req.user.userId},
            select: {name:true}
        });

        comment=await Comment.create({
            productId,
            userId: req.user.userId,
            userName: user?.name || 'Anonymous',
            text,
            rating: numericRating
        });
        activityLogModal.create({
            action: 'COMMENTS_POSTED',
            status: 'SUCCESS',
            details:{httpStatus:201, userId: req.user?.userId??null, commentId: comment._id}
        }).catch(err=> console.error('Log bypass:', err));

        return res.status(201).json({
            id:comment._id,
            text:comment.text,
            rating:comment.rating,
            user:comment.userName
        });
    }catch(error){
        console.error('Add comment error:', error);
        activityLogModal.create({
            action: 'COMMENTS_POSTED',
            status: 'FAILURE',
            details:{httpStatus:500, userId: req.user?.userId??null, commentId: comment?._id??null}
        }).catch(err=> console.error('Log bypass:', err))
        return res.status(500).json({error:'An error occured while posting your comment'});
    }
}

module.exports={getComments, addComment};