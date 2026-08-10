process.env.WEBHOOK_SECRET= process.env.WEBHOOK_SECRET || 'test_webhook_secret'

const request= require('supertest');
const app=require('../app');
const mongoose=require('mongoose')
const commentModal=require('../config/commentModal');

describe('POST /api/products/:id/comments - Integration', ()=>{
        const productId= 1;
        const commenterId= 1;
        const commenterName='Integration Commenter'

    afterEach(async()=>{
        await commentModal.deleteMany({productId: String(productId)})
    })

    afterAll(async()=>{
        await mongoose.connection.close();
    });


    it('writes a real comment document to MongoDB and reads it back', async ()=>{
        const postRes=await request(app)
            .post(`/api/products/${productId}/comments`)
            .set('x-webhook-secret', process.env.WEBHOOK_SECRET)
            .send({text:'Good', rating:4, userId: commenterId, userName: commenterName});

        expect(postRes.status).toBe(201);
        
        const getRes=await request(app).get(`/api/products/${productId}/comments`);
        expect(getRes.body.some(c=> c.text === 'Good')).toBe(true);
    })
});