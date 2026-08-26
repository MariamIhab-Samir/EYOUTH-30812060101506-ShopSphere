const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();
const activityLogModal=require('../config/activityLog')
const {log}= require('../util/logger');

const validateCoupon=async(req, res)=>{
    if(req.method !== 'POST'){
        return res.status(405).json({error:'Method not allowed'});
    }

    const{code}=req.body;

    if(!code){
        return res.status(400).json({error:'Coupon code is required'})
    }

    try{
        const coupon=await prisma.coupon.findUnique({
            where:{code}
        });
        if(!coupon){
            return res.status(404).json({valid: false, error:'Coupon not found'});
        }

        if(coupon.stock<=0){
            return res.status(400).json({valid: false, error: 'Coupon is out of stock'})
        }

        const isExpired=coupon.expiresAt && new Date(coupon.expiresAt)<new Date();
        if(isExpired){
            return res.status(400).json({valid:false, error:'Coupon has expired'})
        }

        activityLogModal.create({
            action: 'COUPON_VALIDATED',
            status: 'SUCCESS',
            details:{httpStatus:200, code, discount: coupon.discountPercent}
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        return res.status(200).json({
            valid:true,
            discount:coupon.discountPercent,
            code:coupon.code
        });
    }catch(err){
        log('error', 'coupon validation failed',{code, errorMessage: err?.message?? String(err)});
        activityLogModal.create({
            action: 'COUPON_VALIDATED',
            status: 'FAILURE',
            details: {httpStatus:500, code, error: err.message}
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        return res.status(500).json({error:'Failed to validate coupon'})
    }

    
}

module.exports={validateCoupon}