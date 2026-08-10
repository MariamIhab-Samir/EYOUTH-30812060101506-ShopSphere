const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma=new PrismaClient();
const mongoose = require('mongoose');
const jwt=require('jsonwebtoken');

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));

describe('cart.js - stock.low webhook trigger - Integration', ()=>{
    let userId, productId, token;

    beforeEach(async()=>{
        await prisma.orderItem.deleteMany({});
        await prisma.cartItem.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.user.deleteMany({where: {id: userId}});

        const user=await prisma.user.create({
            data:{name:'Stock Low Tester',
                email:'stock_low_test@example.com',
                password:'hashed',
                age:24,
                gender:'FEMALE',
                role:'USER'
            }
        });
        
        userId=user.id;
        token=jwt.sign({userId, id: userId, role:'USER'}, process.env.JWT_SECRET);

        process.env.LOW_STOCK_THRESHOLD='5';
        const product=await prisma.product.create({
            data:{
            name:'Stock Low Item',
            price:800,
            stock:7,
            category:'Iphones',
            image: '/x.png',
            description:'High quality Iphone of the latest model'
            }
        });

        productId=product.id;
        global.fetch=jest.fn().mockResolvedValue({ok: true, text: jest.fn().mockResolvedValue('')});
    });
        
    afterAll(async()=>{
        await prisma.$disconnect();
        await mongoose.connection.close();
    });

    it('fires the stock-low webhook when a real add-to-cart drops below the threshold', async()=>{
        const res=await request(app)
            .post('/api/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({productId, quantity:4});
        expect(res.status).toBe(200);

        let product=await prisma.product.findUnique({where:{id:productId}});
        expect(product.stock).toBe(3);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/webhooks/stock-low'),
            expect.objectContaining({body: JSON.stringify({productId})})
        );
    })
});