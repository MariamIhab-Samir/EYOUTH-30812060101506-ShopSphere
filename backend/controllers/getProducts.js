const {PrismaClient}=require('@prisma/client');
const Comment=require('../config/commentModal');
const activityLogModal=require('../config/activityLog');

const prisma = new PrismaClient();

const getProducts = async (req, res)=>{
    try{
        const products = await prisma.product.findMany();
        const allComments=await Comment.find({});

        const statsByProduct={};
        allComments.forEach(c=>{
            if(!statsByProduct[c.productId]){
                statsByProduct[c.productId]={total:0, count:0};
            }
            statsByProduct[c.productId].total +=c.rating;
            statsByProduct[c.productId].count +=1;
        });

        const enrichedProducts=products.map(p=>{
            const stats=statsByProduct[p.id];
            return{
                ...p,
                rating: stats? +(stats.total/stats.count).toFixed(1): 0,
                reviewContent: stats? stats.count:0
            }
        })
        activityLogModal.create({
            action: 'PRODUCTS_ENRICHED',
            status: 'SUCCESS',
            details:{httpStatus:200}})
        return res.status(200).json(enrichedProducts);
    }catch(error){
        console.error('Fetch products failure:', error);
        activityLogModal.create({
            action: 'PRODUCTS_ENRICHED',
            status: 'FAILURE',
            details:{httpStatus:500}})
        return res.status(500).json({error:'Internal server error while fetching products.'})
    }
};

module.exports={getProducts};