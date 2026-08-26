const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma=new PrismaClient();
const mongoose = require('mongoose');
const jwt=require('jsonwebtoken');
jest.setTimeout(20000);

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}))

describe('POST /api/orders - coupon redemption - Integration', ()=>{
    let userId, productId, token;
    const couponCode='INTEGRATION_REDEEM10';

    beforeEach(async()=>{
        await prisma.orderItem.deleteMany({where:{order: {userId}}});
        await prisma.order.deleteMany({where: {userId}});
        await prisma.couponRedemption.deleteMany({where: {userId}});
        await prisma.coupon.deleteMany({where: {code: couponCode}});
        await prisma.cartItem.deleteMany({where:{id: productId}})
        await prisma.product.deleteMany({where: {id: productId}});
        await prisma.user.deleteMany({where: {id: userId}});

        const user=await prisma.user.create({
            data:{name:'Coupon Redeem Tester',
                email:'coupon_redeem_tester@example.com',
                password:'hashed',
                age:26,
                gender:'FEMALE',
                role:'USER'
            }
        });
        userId= user.id;
        token= jwt.sign({userId, id: userId, role: 'USER'}, process.env.JWT_SECRET);

        const product=await prisma.product.create({
            data:{
            name:'Coupon Redeem Item',
            price:800,
            stock:10,
            image: '/x.png',
            category:'Iphones',
            description:'High quality Iphone of the latest model'
            }
        });

        productId=product.id;

        await prisma.cartItem.create({
            data: {
                userId, productId, quantity: 2,
                reservedAt: new Date()
            }
        });
        await prisma.coupon.create({data: {
            code: couponCode, discountPercent: 10,
            stock: 1, expiresAt: new Date('2027-01-01')
        }})
    });
        
    afterAll(async()=>{
        await prisma.$disconnect();
        await mongoose.connection.close();
    });

    it('checks out with a real coupon, applies the discount and decrements real coupon stock', async()=>{
        const res=await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({couponCode});
        expect(res.status).toBe(201);
        expect(res.body.order.totalPrice).toBe(1440);

        const coupon=await prisma.coupon.findUnique({where:{code:couponCode}});
        expect(coupon.stock).toBe(1);
        const redemption=await prisma.couponRedemption.findFirst({where:{userId, couponId:coupon.id}})
        expect(redemption).not.toBeNull()
    })
})