const activityLogModal=require('../config/activityLog')
const getComments=async(req,res)=>{
    try{
        const{productId}=req.params;
        const response=await fetch(`${process.env.REVIEW_SERVICE_URL}/api/products/${productId}/comments`);
        const data=await response.json();
        activityLogModal.create({
            action:'COMMENTS_RETRIEVED',
            status: 'SUCCESS',
            details: {httpStatus:200, productId}
        }).catch(err=>console.error('Log bypass', err))
        return res.status(response.status).json(data);
    }catch(err){
        console.error('Get comments proxy error:', err);
        activityLogModal.create({
            action:'COMMENTS_RETRIEVED',
            status: 'FAILURE',
            details: {httpStatus:503, productId: req.params.productId}
        }).catch(err=>console.error('Log bypass', err))
        return res.status(503).json({error:'Review service is currently unavailable'})
    }
};
const addComment=async(req, res)=>{
    try{
        const{productId}=req.params;
        const{text, rating}=req.body;

        const response= await fetch(`${process.env.REVIEW_SERVICE_URL}/api/products/${productId}/comments`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.WEBHOOK_SECRET
                },
                body: JSON.stringify({
                text,
                rating,
                userId: req.user.userId,
                userName: req.user.name
                })
            }
        )

        const data=await response.json();
        activityLogModal.create({
            action:'COMMENT_POSTED',
            status: 'SUCCESS',
            details: {httpStatus:201, productId, userId: req.user.userId}
        }).catch(err=>console.error('Log bypass', err))
        return res.status(response.status).json(data);
    }catch(err){
        console.error('Add comment proxy error:', err);
            activityLogModal.create({
                action:'COMMENT_POSTED',
                status: 'FAILURE',
                details: {httpStatus:503, productId: req.params.productId, userId: req.user.userId, error:err.message}
            }).catch(err=>console.error('Log bypass', err))
        return res.status(503).json({error:'Review service is currently unavailable'})
    }
};

module.exports={getComments, addComment};