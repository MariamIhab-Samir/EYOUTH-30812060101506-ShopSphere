const{PrismaClient}=require('@prisma/client');
const activityLogModal=require('../config/activityLog');
const {log}= require('../util/logger');
const prisma=new PrismaClient();

const handleProductCreatedWebhook=async(req, res)=>{
    const secret=req.headers['x-webhook-secret'];
    if(secret!==process.env.WEBHOOK_SECRET){
        return res.status(401).json({error: 'Unauthorized'});
    }

    const {productId}=req.body;
    if(!productId){
        return res.status(400).json({error: 'productId is required'})
    }

    try{
        const product=await prisma.product.findUnique({
            where:{id: Number(productId)}
        });

        if(!product){
            return res.status(404).json({error:'Product not found'});
        }

        const matchedUsers=await prisma.user.findMany({
            where:{
                Orders:{
                    some:{
                        items:{
                            some:
                                {product: {category: product.category}
                            }
                        }
                    }
                }
            },
            select:{id:true, email:true}
        })

        const response=await fetch(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/product-created`,{
            method:'POST',
            headers:{
                'Content-Type': 'application/json',
                'x-webhook-secret': process.env.WEBHOOK_SECRET
            },
            body: JSON.stringify({
                productId: product.id,
                productName: product.name,
                productImage: product.image,
                productCategory: product.category,
                productDescription: product.description,
                matchedUsers
            })
        })

        if(!response.ok){
            const body=await response.text();
            log('warn','Notification service non-2xx', {status: response.status, product: product.id, responseBody: body});
            activityLogModal.create({
                action:'PRODUCT_CREATED_WEBHOOK',
                status: 'FAILURE',
                details: {httpStatus:502, productId: product.id}
            }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
            return res.status(502).json({error: 'Notification service unavailable'})
        }

        const data=await response.json();
        activityLogModal.create({
            action:'PRODUCT_CREATED_WEBHOOK',
            status: 'SUCCESS',
            details: {httpStatus:200, productId: product.id, matched: matchedUsers.length}
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        return res.status(200).json(data);
    }catch(err){
        log('error','product-created webhook failed:', {productId: req.body?.productId, errorMessage: err?.message?? String(err)});
        activityLogModal.create({
            action:'PRODUCT_CREATED_WEBHOOK',
            status: 'FAILURE',
            details: {httpStatus:500, productId: req.body?.productId, error:err.message}
        }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
        return res.status(500).json({error:'Failed to process product-created webhook'})
        
    }
};

module.exports={handleProductCreatedWebhook};