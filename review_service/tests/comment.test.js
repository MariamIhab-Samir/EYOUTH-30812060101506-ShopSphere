process.env.WEBHOOK_SECRET=process.env.WEBHOOK_SECRET || 'test_webhook_secret'

const mockCommentFind=jest.fn();
const mockCommentCreate=jest.fn();

jest.mock('../config/commentModal', ()=>({
    find:(...args)=>mockCommentFind(...args),
    create:(...args)=>mockCommentCreate(...args)
}));

const request= require('supertest');
const app=require('../app');
const mongoose=require('mongoose')

const GET_COMMENTS_PATH='/api/products/1/comments';
const POST_COMMENTS_PATH='/api/products/1/comments';
const WEBHOOK_SECRET= process.env.WEBHOOK_SECRET;

describe('Comments API', ()=>{
    beforeEach(()=>{
        mockCommentFind.mockReset();
        mockCommentCreate.mockReset();
    });

    afterAll(async()=>{
        await mongoose.connection.close();
    })

    describe('GET /comments', ()=>{
        it('should fetch and return comments for a product with 200 status', async()=>{
            const mockComments=[
                {_id: 'c1', text: 'Great product', rating: 5, userName:'Alice'},
                {_id:'c2', text:'Not bad', rating:3, userName:'Bob'}
            ];

            mockCommentFind.mockReturnValue({
                sort:jest.fn().mockResolvedValue(mockComments)
            });

            const res=await request(app).get(GET_COMMENTS_PATH);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0]).toMatchObject({id:'c1', text:'Great product', rating:5, user:'Alice'});
            });
            
        it('should safely return an empty array if no comments exist', async()=>{
            mockCommentFind.mockReturnValue({
                sort:jest.fn().mockResolvedValue([])
            });

            const res=await request(app).get(GET_COMMENTS_PATH);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('should return a 500 status if fetching comments fails', async()=>{
            mockCommentFind.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database Connection Lost'))
            });
            
            const res=await request(app).get(GET_COMMENTS_PATH);

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
        })
    });

    describe('POST /comments', ()=>{
        it('should post a valid comment and return 201 status', async()=>{
            mockCommentCreate.mockResolvedValue({
                _id: 'c3',
                text: 'Loved it',
                rating: 5,
                userName:'Alice'
            });

            const res=await request(app)
                .post(POST_COMMENTS_PATH)
                .set('x-webhook-secret', process.env.WEBHOOK_SECRET)
                .send({text:'Loved it', rating:5, userId: 1, userName: 'Alice'});

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                id:'c3',
                text: 'Loved it',
                rating:5,
                user: 'Alice'
            });
        })
        it('should reject an unauthorized request with 401', async()=>{
            const res=await request(app)
                .post(POST_COMMENTS_PATH)
                .send({text:'No token here', rating:5, userId: 1, userName: 'Alice'});

            expect(res.status).toBe(401);
        });

        it('should reject an empty comment with 400', async()=>{
            const res=await request(app)
                .post(POST_COMMENTS_PATH)
                .set('x-webhook-secret', process.env.WEBHOOK_SECRET)
                .send({text:'', rating:5, userId: 1, userName: 'Alice'});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject a rating outside 1-5 with 400', async()=>{
            const res= await request(app)
                .post(POST_COMMENTS_PATH)
                .set('x-webhook-secret', process.env.WEBHOOK_SECRET)
                .send({text:'Meh', rating:0, userId: 1, userName: 'Alice'});
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a 500 status if saving the comment fails', async()=>{
            mockCommentCreate.mockRejectedValue(new Error('Database Connection Lost'));

            const res= await request(app)
                .post(POST_COMMENTS_PATH)
                .set('x-webhook-secret', process.env.WEBHOOK_SECRET)
                .send({text:'Meh', rating:2, userId: 1, userName: 'Alice'});

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
        })
    })   
})
