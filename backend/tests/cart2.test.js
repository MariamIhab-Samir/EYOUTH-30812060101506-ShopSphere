const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma=new PrismaClient();
const mongoose = require('mongoose');
const jwt=require('jsonwebtoken');
jest.mock('jsonwebtoken');

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}))

const BUYER_EMAIL='integration_cart_buyer@example.com';
let buyerId, productId;

describe('CART API - Integration', ()=>{
    beforeEach(async()=>{
        await prisma.orderItem.deleteMany({});
        await prisma.cartItem.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.user.deleteMany({where: {email: BUYER_EMAIL}});

        const buyer=await prisma.user.create({
            data:{name:'Cart Buyer',
                email:BUYER_EMAIL,
                password:'hashed',
                age:20,
                gender:'FEMALE',
                role:'USER'
            }
        });
        
        buyerId=buyer.id;

        const product=await prisma.product.create({
            data:{
            name:'Cart Test Item',
            price:800,
            stock:5,
            category:'Iphones',
            description:'High quality Iphone of the latest model'
            }
        });

        productId=product.id;

        jwt.verify.mockImplementation((token)=>{
            if(token==='MOCK_USER_TOKEN'){
                return{
                    userId:buyerId, id:buyerId, email:BUYER_EMAIL
                }};
            throw new Error('Invalid Token');
        });
    });
        
    afterAll(async()=>{
        await prisma.$disconnect();
        await mongoose.connection.close();
    });

    it('reserves stock on add, adjusts it on update and releases it on remove', async()=>{
        const addRes=await request(app)
            .post('/api/cart')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({productId, quantity:2});
        expect(addRes.status).toBe(200);

        let product=await prisma.product.findUnique({where:{id:productId}});
        expect(product.stock).toBe(3);

        const cartItemId=addRes.body.cartItem.id;

        const updateRes=await request(app)
            .put(`/api/cart/${cartItemId}`)
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({quantity:4});
        expect(addRes.status).toBe(200);

        product=await prisma.product.findUnique({where:{id:productId}});
        expect(product.stock).toBe(1);

        const overRes=await request(app)
            .put(`/api/cart/${cartItemId}`)
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({quantity:10});
        expect(overRes.status).toBe(400);

        const removeRes=await request(app)
            .delete(`/api/cart/${cartItemId}`)
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
        expect(removeRes.status).toBe(200);

        product=await prisma.product.findUnique({where:{id:productId}});
        expect(product.stock).toBe(5);

        const remaining=await prisma.cartItem.findMany({where:{userId:buyerId}})
        expect(remaining.length).toBe(0);
    }, 45000)
});