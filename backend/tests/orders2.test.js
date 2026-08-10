const request= require('supertest');
const app=require('../app');
const mongoose=require('mongoose')
const {PrismaClient}=require('@prisma/client');
const jwt=require('jsonwebtoken');

jest.mock('jsonwebtoken');

jest.mock('../config/activityLog', ()=>({create: jest.fn().mockResolvedValue({})}));
jest.mock('../util/mailer', ()=>({sendEmail: jest.fn().mockResolvedValue({})}));

const prisma=new PrismaClient();
const BUYER_EMAIL='integration_checkout_buyer@example.com';
let buyerId, productId, cartId;

describe('POST /api/orders - Integration', ()=>{
    beforeEach(async()=>{
        await prisma.orderItem.deleteMany({});
        await prisma.cartItem.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.user.deleteMany({where: {email: BUYER_EMAIL}});

        const buyer=await prisma.user.create({
            data:{name:'Buyer',
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
            name:'Checkout Test Item',
            price:800,
            stock:5,
            category:'Iphones',
            description:'High quality Iphone of the latest model'
            }
        });

        productId=product.id;

        await prisma.cartItem.create({
            data:{
                userId:buyerId, productId, quantity:2
            }
        });
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

    it('places a real order from an existing cart reservation and clears the cart', async()=>{

        await prisma.product.update({
            where:{id:productId},
            data:{stock:{decrement:2}}
        });

        const res=await request(app)
            .post('/api/auth/orders')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({});

        expect(res.status).toBe(201);

        const updatedProduct=await prisma.product.findUnique({where:{id:productId}});
        expect(updatedProduct.stock).toBe(3);

        const remainingCartItems=await prisma.cartItem.findMany({where:{userId:buyerId}});
        expect(remainingCartItems.length).toBe(0);
    });
})
