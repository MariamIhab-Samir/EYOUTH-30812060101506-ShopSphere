const request=require('supertest');
const app=require('../app');
const {PrismaClient}=require('@prisma/client');
const bcrypt=require('bcrypt');
const mongoose =require('mongoose');

jest.mock('../config/activityLog', ()=>({create: jest.fn().mockResolvedValue({})}));
jest.mock('../util/mailer', ()=>({sendEmail: jest.fn().mockResolvedValue({})}));

const prisma=new PrismaClient();
const LOGIN_TEST_EMAIL='integration_login_test@example.com';

describe('POST /api/login - Integration', ()=>{
    beforeAll(async()=>{
        const hashed=await bcrypt.hash('RealPassword123',10);
        await prisma.user.create({
            data:{
                name:'Login Test',
                email:LOGIN_TEST_EMAIL,
                password:hashed,
                age:25,
                gender:'FEMALE',
                role:'USER'
            }
        })
    });

    afterAll(async()=>{
        await prisma.user.deleteMany({where:{email:LOGIN_TEST_EMAIL}});
        await prisma.$disconnect();
        await mongoose.connection.close();
    });

    it('logs in with a real hashed password and returns a real signed token', async()=>{
        const res=await request(app).post('/api/login').send({email: LOGIN_TEST_EMAIL, password:'RealPassword123'});
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('rejects the correct email with the wrong password against real bcrypt', async()=>{
        const res=await request(app).post('/api/login').send({email: LOGIN_TEST_EMAIL, password:'WrongPassword123'});
        expect(res.status).toBe(401);
    })
})