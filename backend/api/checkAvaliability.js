const {PrismaClient} =require('@prisma/client');
const prisma=new PrismaClient();
const {log}= require('../util/logger');

async function checkAvailability (req, res){
    if(req.method!=='GET'){
        return res.status(405).json({error:'Method not allowed'})
    }

    const{productId, quantity}=req.query;
    if(!productId || !quantity){
        return res.status(400).json({error:'productId and quantity are required'});
    }

    try{
        const product=await prisma.product.findUnique({
            where: {id: Number(productId)}
        });
        if(!product){
            return res.status(404).json({
                available:false, error:'Product not found'
            });
        }

        const available=product.stock>=Number(quantity);
        return res.status(200).json({
            available,
            inStock: product.stock,
            requested: Number(quantity)
        });
    }catch(err){
        log('error', 'avaliability check failed',{productId, quantity, errorMessage: err?.message?? String(err)});
        return res.status(500).json({error:'Failed to check availability'})
    }
}

module.exports={checkAvailability}