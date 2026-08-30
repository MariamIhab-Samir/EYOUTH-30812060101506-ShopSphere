const {PrismaClient}=require('@prisma/client');
const activityLogModal=require('../config/activityLog');
const {log}= require('../util/logger');

const prisma = new PrismaClient();

const getProducts = async (req, res)=>{
    try{
        const products = await prisma.product.findMany({
            orderBy: {id: 'asc'}
        });

        const statsByProduct={};
        try{
            const response=await fetch
            (`${process.env.REVIEW_SERVICE_URL}/api/reviews/stats`);
            if (response.ok){
                const stats=await response.json();
                stats.forEach(s=>{
                    statsByProduct[s.productId]=
                    {rating: s.rating, count: s.reviewCount};
                })
            }else{
                log('error', 'Review service responded with', {status: response.status});
            }
        }catch(reviewErr){
            log('warn', 'review Service unavailable', {errorMessage: reviewErr.message});
        }

        const enrichedProducts=products.map(p=>{
            const stats=statsByProduct[p.id];
            return{
                ...p,
                rating: stats? stats.rating.toFixed(1): 0,
                reviewContent: stats? stats.count:0
            }
        })
        activityLogModal.create({
            action: 'PRODUCTS_ENRICHED',
            status: 'SUCCESS',
            details:{httpStatus:200}})
        return res.status(200).json(enrichedProducts);
    }catch(error){
        log('error', 'get products failed', {errorMessage: error?.message?? String(error)});
        activityLogModal.create({
            action: 'PRODUCTS_ENRICHED',
            status: 'FAILURE',
            details:{httpStatus:500}})
        return res.status(500).json({error:'Internal server error while fetching products.'})
    }
};

module.exports={getProducts};