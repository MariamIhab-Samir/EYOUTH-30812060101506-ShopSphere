const mockFindUniqueUser=jest.fn();

jest.mock('@prisma/client', ()=>{
    return{
        PrismaClient: jest.fn().mockImplementation(()=>{
            return{
                user:{
                    findUnique: mockFindUniqueUser
                }
            }
        })
    }
})

const mockCommentFind=jest.fn();
const mockCommentCreate=jest.fn();

jest.mock('../config/commentModal', ()=>({
    find:(...args)=>mockCommentFind(...args),
    create:(...args)=>mockCommentCreate(...args)
}));

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
        return{userId: 1, id:1, email:'commenter@example.com'}
    }throw new Error('Invalid Token');
});

const request= require('supertest');
const app=require('../app');
const mongoose=require('mongoose')
const activityLogModal=require('../config/activityLog');

const GET_COMMENTS_PATH='/api/products/1/comments';
const POST_COMMENTS_PATH='/api/products/1/comments';

describe('Comments API', ()=>{
    beforeEach(()=>{
        mockFindUniqueUser.mockReset();
        mockCommentFind.mockReset();
        mockCommentCreate.mockReset();
        activityLogModal.create.mockReset().mockResolvedValue({});
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

            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'COMMENTS_RETRIEVED',
                    status:'SUCCESS',
                    details: expect.objectContaining({userId:null})
                    })
                );
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
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                action: 'COMMENTS_RETRIEVED',
                status:'FAILURE'})
            );
        })
    });

    describe('POST /comments', ()=>{
        it('should post a valid comment and return 201 status', async()=>{
            mockFindUniqueUser.mockResolvedValue({name:'Alice'})
            mockCommentCreate.mockResolvedValue({
                _id: 'c3',
                text: 'Loved it',
                rating: 5,
                userName:'Alice'
            });

            const res=await request(app)
                .post(POST_COMMENTS_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({text:'Loved it', rating:5});

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                id:'c3',
                text: 'Loved it',
                rating:5,
                user: 'Alice'
            });
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'COMMENTS_POSTED', status:'SUCCESS'
                })
            )
        })
        it('should reject an unauthorized request with 401', async()=>{
            const res=await request(app)
                .post(POST_COMMENTS_PATH)
                .send({text:'No token here', rating:5});

            expect(res.status).toBe(401);
        });

        it('should reject an empty comment with 400', async()=>{
            const res=await request(app)
                .post(POST_COMMENTS_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({text:'', rating:5});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject a rating outside 1-5 with 400', async()=>{
            const res= await request(app)
                .post(POST_COMMENTS_PATH)
                .set('Authorization', `Bearer MOCK_USER_TOKEN`)
                .send({text:'Meh', rating:0});
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a 500 status if saving the comment fails', async()=>{
            mockFindUniqueUser.mockRejectedValue({name:'Alice'});
            mockCommentCreate.mockRejectedValue(new Error('Database Connection Lost'));

            const res= await request(app)
                .post(POST_COMMENTS_PATH)
                .set('Authorization', `Bearer MOCK_USER_TOKEN`)
                .send({text:'Meh', rating:2});

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'COMMENTS_POSTED', status:'FAILURE'
                })
            )
        })
    })   
})
