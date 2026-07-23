const mockFindUnique=jest.fn();
const mockUpdate=jest.fn();
const mockCompare=jest.fn();

jest.mock('@prisma/client', ()=>{
    return{
        PrismaClient: jest.fn().mockImplementation(()=>{
            return{
                user:{
                    findUnique: mockFindUnique,
                    update: mockUpdate
                }
            }
        })
    }
})

jest.mock('bcrypt', ()=>({
    compare: (...args)=> mockCompare(...args),
    hash: jest.fn().mockResolvedValue('hashed_password')
}));

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

const jwt=require('jsonwebtoken');
jest.mock('jsonwebtoken')

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));

jwt.verify.mockImplementation((token)=>{
    if(token==='MOCK_USER_TOKEN'){
        return{
            userId:1, id:1, email:'profileuser@example.com', role:'USER'}
        }
    throw new Error('Invalid Token');
});

const request= require('supertest');
const app=require('../app');
const mongoose=require('mongoose')
const activityLogModal=require('../config/activityLog');

const GET_PROFILE_PATH='/api/auth/profile';
const UPDATE_PROFILE_PATH='/api/auth/profile';

describe('Profile API', ()=>{
    beforeEach(()=>{
        mockFindUnique.mockReset();
        mockUpdate.mockReset();
        mockCompare.mockReset();
        activityLogModal.create.mockReset().mockResolvedValue({});
    });

    afterAll(async()=>{
        await mongoose.connection.close();
    })

    describe('GET /Profile', ()=>{
        it('should fetch and return the user profile with 200 status', async()=>{
            mockFindUnique.mockResolvedValue({
                name:'Profile User',
                email:'profileuser@example.com',
                age:20,
                gender:'FEMALE',
                role:'USER'
            });

            const res=await request(app)
                .get(GET_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN');
            
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                name:'Profile User', email: 'profileuser@example.com'});
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'PROFILE_RETRIEVED',
                    status:'SUCCESS'})
            );
        });

        it('should return if the user does not exist', async()=>{
            mockFindUnique.mockResolvedValue(null);

            const res=await request(app)
                .get(GET_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a 500 status if the lookup throws', async()=>{
            mockFindUnique.mockRejectedValue(new Error('Database Connection Lost'));

            const res=await request(app)
                .get(GET_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN');

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'PROFILE_RETRIEVED',
                    status:'FAILURE'})
                )
            });
        })

    describe('PUT /profile', ()=>{
        it('should update the profile and return 200 status',
            async()=>{
                mockUpdate.mockResolvedValue({
                name:'Updated Name',
                email:'profileuser@example.com',
                age:20,
                gender:'FEMALE',
                role:'USER'
            });

            const res=await request(app)
                .put(UPDATE_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({name:'Updated Name'});

            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe('Updated Name')
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'PROFILE_UPDATED',
                    status:'SUCCESS'})
            );
        });
        
        it('should reject an invalid email with 400', async()=>{
            const res=await request(app)
                .put(UPDATE_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({email: 'not-an-email'});

            expect(res.status).toBe(400);
        });

        it('should reject a duplicate email with 400', async()=>{
            mockFindUnique.mockResolvedValue({id:999, email:'taken@example.com'})
            const res=await request(app)
                .put(UPDATE_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({email: 'taken@example.com'});

            expect(res.status).toBe(400);
        });

        it('should reject age user 16 with 400', async()=>{
            const res=await request(app)
                .put(UPDATE_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({age:12});

            expect(res.status).toBe(400);
        });

        it('should reject a password change with missing current password with 400', async()=>{
            const res=await request(app)
                .put(UPDATE_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({currentPassword:'', newPassword: 'newSecurePass123'});

            expect(res.status).toBe(400);
        });

        it('should reject an incorrect current password with 401', async()=>{
            mockFindUnique.mockResolvedValue({id:1, password:'hashed_old_password'});
            mockCompare.mockResolvedValue(false);
            const res=await request(app)
                .put(UPDATE_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({currentPassword:'wrongpass', newPassword: 'newSecurePass123'});

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'PROFILE_UPDATED',
                    status:'FAILURE',
                    details: expect.objectContaining({
                        httpStatus:401, userId: 1
                    })})
            );
        });

        it('should reject a new password under 6 characters with 400', async()=>{
            mockFindUnique.mockResolvedValue({id:1, password:'hashed_old_password'});
            mockCompare.mockResolvedValue(true);

            const res=await request(app)
                .put(UPDATE_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({currentPassword:'correctpass', newPassword: '123'});

            expect(res.status).toBe(400);
        });

        it('should reject an empty update payload with 400', async()=>{

            const res=await request(app)
                .put(UPDATE_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({});

            expect(res.status).toBe(400);
        });
        it('should return a 500 status if the update throws', async()=>{
            mockUpdate.mockRejectedValue(new Error('Database Connection Lost'));
            const res=await request(app)
                .put(UPDATE_PROFILE_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({name:'Will Fail'});

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'PROFILE_UPDATED',
                    status:'FAILURE'})
            );
        });
    })
})