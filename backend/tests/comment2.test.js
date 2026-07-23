const request= require('supertest');
const app=require('../app');
const mongoose=require('mongoose')
const commentModal=require('../config/commentModal');
const {PrismaClient}=require('@prisma/client');
const jwt=require('jsonwebtoken');

jest.mock('jsonwebtoken');

jest.mock('../config/activityLog', ()=>({create: jest.fn().mockResolvedValue({})}));
jest.mock('../util/mailer', ()=>({sendEmail: jest.fn().mockResolvedValue({})}));

const prisma=new PrismaClient();
const COMMENTER_EMAIL='integration_commenter@example.com';
let commenterId, productId;

describe('POST /api/products/:id/comments - Integration', ()=>{
    beforeAll(async()=>{
        const commenter=await prisma.user.create({
            data:{
                name:'Commenter',
                email: COMMENTER_EMAIL,
                password:'hashed',
                age:22,
                gender:'FEMALE',
                role:'USER'
                }
            });

            commenterId=commenter.id;

            const product=await prisma.product.create({
                data:{
                name:'Commentable Item',
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
                        userId:commenterId, id:commenterId, email:COMMENTER_EMAIL}
                    }
                throw new Error('Invalid Token');
            });
        });
    
    afterEach(async()=>{
        await commentModal.deleteMany({productId: String(productId)})
    })

    afterAll(async()=>{
        await prisma.user.deleteMany({where:{email:COMMENTER_EMAIL}});
        await prisma.product.deleteMany({where:{id: productId}})
        await prisma.$disconnect();
        await mongoose.connection.close();
    });

    it('writes a real comment document to MongoDB and reads it back', async ()=>{
        const postRes=await request(app)
            .post(`/api/products/${productId}/comments`)
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({text:'Good', rating:4});

        expect(postRes.status).toBe(201);
        
        const getRes=await request(app).get(`/api/products/${productId}/comments`);
        expect(getRes.body.some(c=> c.text === 'Good')).toBe(true);
    })
});