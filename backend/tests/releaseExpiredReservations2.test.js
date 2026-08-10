const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma=new PrismaClient();
const mongoose = require('mongoose');
const releaseExpiredReservations = require('../jobs/releaseExpiredReservations');

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}))

describe('releaseExpiredReservations - Integration', ()=>{
    let userId, productId;

    beforeEach(async()=>{
        await prisma.orderItem.deleteMany({where:{productId}});
        await prisma.order.deleteMany({where:{userId}})
        await prisma.cartItem.deleteMany({where:{userId}});
        await prisma.product.deleteMany({where:{id:productId}});
        await prisma.user.deleteMany({where: {id:userId}});

        const user=await prisma.user.create({
            data:{name:'Reservation Tester',
                email:'reservation_test@example.com',
                password:'hashed',
                age:30,
                gender:'FEMALE',
                role:'USER'
            }
        });
        
        userId=user.id;

        const product=await prisma.product.create({
            data:{
            name:'Expiry Test Item',
            price:800,
            stock:3,
            category:'Iphones',
            image:'/x.png',
            description:'High quality Iphone of the latest model'
            }
        });

        productId=product.id;
    });
        
    afterAll(async()=>{
        await prisma.$disconnect();
        await mongoose.connection.close();
    });

    it('releases stock and removes a reservation older than 20 mins', async()=>{
        const staleDate=new Date(Date.now() - 30 * 60 * 1000);
        await prisma.cartItem.create({data:{
            userId, productId, quantity:2, reservedAt: staleDate
        }})

        const releasedCount= await releaseExpiredReservations();
        expect(releasedCount).toBe(1);

        const product=await prisma.product.findUnique({
            where: {id: productId}
        });
        expect(product.stock).toBe(5);

        const remaining=await prisma.cartItem.findMany({where: {userId}});
        expect(remaining).toHaveLength(0);
    })
});