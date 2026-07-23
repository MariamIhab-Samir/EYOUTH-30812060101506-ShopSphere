const request=require('supertest');
const app=require('../app');
const {PrismaClient}=require('@prisma/client');
const mongoose =require('mongoose');

jest.mock('../config/activityLog', ()=>({create: jest.fn().mockResolvedValue({})}));
jest.mock('../emails/welcome', ()=>({create: jest.fn().mockResolvedValue({})}));

const prisma=new PrismaClient();
const TEST_EMAIL='integration_signup_test@example.com';

describe('POST /api/signup - Integration', ()=>{
    afterEach(async()=>{
        await prisma.user.deleteMany({where:{email:TEST_EMAIL}});
    })


    afterAll(async()=>{
        await prisma.$disconnect();
        await mongoose.connection.close();
    });

    it('creates a real row in the database on valid signup', async()=>{
        const res=await request(app).post('/api/signup').send({
            name:'Real Row',
            email:TEST_EMAIL,
            password:'SecurePassword123',
            gender:'FEMALE',
            age:18
        });

        expect (res.status).toBe(201);
        const userInDb=await prisma.user.findUnique({
            where:{email:TEST_EMAIL}})
        expect(userInDb).not.toBeNull();
    });

    it('returns 409 when the email already exists in the real database', async()=>{
        await prisma.user.create({
            data:{name:'Existing', email:TEST_EMAIL, password:'x', age:20, gender:'FEMALE', role:'USER'}
        });

        const res=await request(app).post('/api/signup').send({
            name:'Dup',
            email:TEST_EMAIL,
            password:'SecurePassword123',
            gender:'FEMALE',
            age:18
        });
        expect(res.status).toBe(409);
    })
})