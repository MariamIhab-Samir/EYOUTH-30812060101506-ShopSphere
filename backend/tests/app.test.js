const request=require('supertest');
const app=require('../app');
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
jest.mock('jsonwebtoken');

jwt.verify.mockImplementation((token)=>{
    if(token==='MOCK_ADMIN_TOKEN'){
        return{id: 2, email:'admin_lifecycle_test@example.com', role:'ADMIN'};
    }
    if(token==='MOCK_USER_TOKEN'){
        return{id:1, email:'profile_test_user@example.com', role:'USER'}
    }
    throw new Error('Invalid Token')
});

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));

describe('Express Application Core Middleware Baseline Suite', () =>{
    
    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('[STATUS 200] Should verify the application root or health check is responsive', async ()=>{
        const response=await request(app).get('/');

        expect(response.statusCode).toBe(200);
    });

    it('[STATUS 404] Should correctly handle unrecognized route definitions smoothly', async()=>{
        const res=await request(app).get('/api/invalid-route-target-path');
        expect(res.statusCode).toBe(404);
    });

    it('Should verify Express handles application/json requests', async ()=>{
        const res=await request(app)
            .post('/api/signup')
            .send({});

        expect(res.statusCode).not.toBe(500);
    });

    it('[STATUS 403] Should confirm auth middleware catches and blocks non-admin accounts', async()=>{
        const res=await request(app)
            .delete('/api/admin/products/101')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN');

        expect(res.statusCode).toBe(403);
    });

    it('[MULTER IMAGE] Should confirm product route handles multipart image boundaries', async()=>{
        const res= await request(app)
            .post('/api/admin/products')
            .set('Authorization', 'Bearer MOCK_ADMIN_TOKEN')
            .field('name', 'Component')
            .field('price', '300')
            .attach('productImage', Buffer.from('fake-image-data'), 'test_sheet.png')

        expect(res.statusCode).not.toBe(500);
    });
});