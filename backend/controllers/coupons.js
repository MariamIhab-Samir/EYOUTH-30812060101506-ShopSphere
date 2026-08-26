const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();

const getCoupons=async(req, res)=>{
    try{
        const coupons= await prisma.coupon.findMany({
            orderBy: {discountPercent: 'asc'},
            select: {code:true, discountPercent:true, expiresAt:true}
        });
        return res.status(200).json({coupons})
    }catch(err){
        console.error('Get coupons error:', err);
        return res.status(500).json({error:'Failed to load coupons'});
    }
};

const getCouponInventory=async(req, res)=>{
    try{
        const userId=req.user.userId;
        const coupons= await prisma.coupon.findMany({
            orderBy: {discountPercent: 'asc'},
            select: {id:true, code: true, discountPercent:true, stock: true}
        });

        const enrichedCoupons=await Promise.all(coupons.map(async(coupon)=>{
            const redeemedByUser=await prisma.couponRedemption.count({
                where:{userId, couponId: coupon.id}
            })
            return{
                code: coupon.code,
                discountPercent: coupon.discountPercent,
                stock: coupon.stock - redeemedByUser
            }
        }));
        return res.status(200).json({coupons: enrichedCoupons})
    }catch(err){
        console.error('Get coupon inventory error:', err);
        return res.status(500).json({error: 'Failed to load coupon inventory'});
    }
};

module.exports={getCoupons, getCouponInventory}