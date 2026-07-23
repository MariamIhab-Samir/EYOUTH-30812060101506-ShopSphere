const mockFindUnique=jest.fn();

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                user: {
                    findUnique: mockFindUnique
                },
            };
        }),
    };
});

const mockCompare=jest.fn();
jest.mock('bcrypt',()=>({
    compare: (...args)=> mockCompare(...args)
}));

const mockSign=jest.fn();
jest.mock('jsonwebtoken', ()=>({
    sign: (...args)=> mockSign(...args),
    verify: jest.fn()
}))

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}))
const request = require('supertest');
const app = require('../app');
const prisma = require('@prisma/client'); 
const activityLogModal=require('../config/activityLog');
const mongoose=require('mongoose')

const LOGIN_PATH='/api/auth/login';

describe('Login API', ()=>{
    beforeEach(()=>{
            mockFindUnique.mockReset();
            mockCompare.mockReset();
            mockSign.mockReset().mockReturnValue('mock.jwt.token');
            activityLogModal.create.mockReset().mockResolvedValue({});
        });
    
        afterAll(async()=>{
            await mongoose.connection.close();
        })
        
        it('should log in a valid user and return 200 with a token', async()=>{
            mockFindUnique.mockResolvedValue({
                id:1,
                email:'user@example.com',
                password: 'hashed_password',
                role:'USER',
                age:20,
                gender:'FEMALE',
                name:'Test User'
            });
            mockCompare.mockResolvedValue(true);

            const res=await request(app)
                .post(LOGIN_PATH)
                .send({email:'user@example.com', password:'correctpass'});
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe('user@example.com');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'LOGIN', status:'SUCCESS'})
            );
        });

        it('should reject a request missing email/password with 400', async()=>{
            const res=await request(app)
                .post(LOGIN_PATH)
                .send({email:'user@example.com'});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject a malformed email with 400', async()=>{
            const res=await request(app)
                .post(LOGIN_PATH)
                .send({email:'not-an-email', password:'whatever123'});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should reject an unknown email with 401', async()=>{
            mockFindUnique.mockResolvedValue(null);

            const res=await request(app)
                .post(LOGIN_PATH)
                .send({email:'ghost@example.com', password:'whatever123'});
                
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'LOGIN_FAILED_UNKNOWN_EMAIL', status:'FAILURE'}))
        });

        it('should reject an incorrect password with 401', async()=>{
            mockFindUnique.mockResolvedValue({
                id:1,
                email:'user@example.com',
                password: 'hashed_password',
                role:'USER'})
            mockCompare.mockResolvedValue(false);

            const res=await request(app)
                .post(LOGIN_PATH)
                .send({email:'ghost@example.com', password:'wrongpass'});
            
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'LOGIN_FAILED_WRONG_PASSWORD', status:'FAILURE'}))
        });

        it('should block a non-admin user from the admin tab with 403', async()=>{
            mockFindUnique.mockResolvedValue({
                id:1,
                email:'user@example.com',
                password: 'hashed_password',
                role:'USER'})
            mockCompare.mockResolvedValue(true);
            
            const res=await request(app)
                .post(LOGIN_PATH)
                .send({email:'ghost@example.com', password:'correctpass', isAdminTab:true});
            
            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'LOGIN_FORBIDDEN_ADMIN', status:'FAILURE'})
            )
        })

        it('should allow an admin with token to log in via the admin tab with 200', async()=>{
            mockFindUnique.mockResolvedValue({
                id:2,
                email:'admin@example.com',
                password:'hashed_password',
                role:'ADMIN'});
            mockCompare.mockResolvedValue(true);

            const res=await request(app)
                .post(LOGIN_PATH)
                .send({email:'admin@example.com', password:'correctpass', isAdminTab:true});

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('token');
                expect(res.body.user.email).toBe('admin@example.com');
                expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'LOGIN', status:'SUCCESS'})
            );
        })

        it('should return a 500 status if lookup throws', async()=>{
            mockFindUnique.mockRejectedValue(new Error('Database Connection Lost'));

            const res=await request(app)
                .post(LOGIN_PATH)
                .send({email:'user@example.com', password:'correctpass'});
            
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action:'LOGIN', status:'FAILURE'})
            );
        })
})