const activityLogModal=require('../config/activityLog');

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));

const jwt=require('jsonwebtoken');
jest.mock('jsonwebtoken');

jwt.verify.mockImplementation((token)=>{
    if(token==='MOCK_USER_TOKEN'){
        return{userId: 1, id:1, email:'commenter@example.com', name:'Alice'}
    }throw new Error('Invalid Token');
});

global.fetch=jest.fn();

const request= require('supertest');
const app=require('../app');
const mongoose=require('mongoose');

const GET_COMMENTS_PATH='/api/products/1/comments';
const POST_COMMENTS_PATH='/api/products/1/comments';

describe('Comments proxy', ()=>{
    beforeEach(()=>{
        global.fetch.mockReset();
        activityLogModal.create.mockReset().mockResolvedValue({});
    });

    afterAll(async ()=>{
        await mongoose.connection.close();
    });

    describe('GET /comments', ()=>{
        it('forwards the review service response with 200 status', async()=>{
            global.fetch.mockResolvedValue({
                status: 200,
                json: jest.fn().mockResolvedValue([{id:'c1', text:'Great', rating:5, user:'Alice'}])
            });

            const res=await request(app).get(GET_COMMENTS_PATH);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([{id:'c1', text:'Great', rating:5, user:'Alice'}]);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/products/1/comments')
            );
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action: 'COMMENTS_RETRIEVED', status:'SUCCESS'})
            );
        });

        it('returns 503 if the review service is unreachable', async()=>{
            global.fetch.mockRejectedValue(new Error('fetch failed'));

            const res=await request(app).get(GET_COMMENTS_PATH);

            expect(res.status).toBe(503);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action: 'COMMENTS_RETRIEVED', status:'FAILURE'})
            );
        });
    });

    describe('POST /comments', ()=>{
        it('rejects an unauthorized request with 401', async()=>{
            const res= await request(app)
                .post(POST_COMMENTS_PATH)
                .send({text: 'No token here', rating: 5});

            expect(res.status).toBe(401);
        });

        it('proxies a valid comment with caller verified identity', async()=>{
            global.fetch.mockResolvedValue({
                status: 201,
                json: jest.fn().mockResolvedValue({id: 'c3', text: 'Loved it', rating: 5, user: 'Alice'})
            });

            const res= await request(app)
                .post(POST_COMMENTS_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({text: 'Loved it', rating: 5});

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({id:'c3', text: 'Loved it', rating: 5, user: 'Alice'});
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/products/1/comments'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({'x-webhook-secret': process.env.WEBHOOK_SECRET}),
                    body: JSON.stringify({text: 'Loved it', rating:5, userId:1, userName: 'Alice'})
                })
            );
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action: 'COMMENT_POSTED', status:'SUCCESS'})
            );
        });

        it('returns 503 if the review service is unreachable', async()=>{
            global.fetch.mockRejectedValue(new Error('fetch failed'));

            const res= await request(app)
                .post(POST_COMMENTS_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({text: 'Loved it', rating: 5});

            expect(res.status).toBe(503);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action: 'COMMENT_POSTED', status:'FAILURE'})
            );
        });
    })
})
