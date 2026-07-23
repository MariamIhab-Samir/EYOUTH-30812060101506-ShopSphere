const mockFindUnique= jest.fn();
const mockCreate=jest.fn();

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                user: {
                    findUnique: mockFindUnique,
                    create: mockCreate,
                },
            };
        }),
    };
});

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));

jest.mock('../emails/welcome', ()=>({
    sendWelcomeEmail: jest.fn().mockResolvedValue({})
}))

const request = require('supertest');
const app = require('../app');
const prisma = require('@prisma/client'); 
const { sendWelcomeEmail } = require('../emails/welcome');
const activityLogModal=require('../config/activityLog')

describe('POST /api/signup - Registration System', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        
        const { PrismaClient } = require('@prisma/client');
        mockPrismaInstance = new PrismaClient();
    });

    it('should register a valid user and return 201 status', async () => {
        
        mockFindUnique.mockResolvedValue(null);
        mockCreate.mockResolvedValue({
            id: 1,
            name:'Username',
            email: 'mariam@example.com',
            gender: 'FEMALE',
            age: 17,
        });

        const res = await request(app)
            .post('/api/signup')
            .send({
                name:'Mariam',
                email: 'mariam@example.com',
                password: 'SecurePassword123',
                gender: 'FEMALE',
                age: 18,
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message');
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'USER_REGISTER',
                status:'SUCCESS'
                })
            );
    });

    it('should reject registration if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/signup')
            .send({
                email: 'incomplete@example.com',
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/missing/i);
    });

    it('should reject registration if the user age is under 16', async () => {
        const res = await request(app)
            .post('/api/signup')
            .send({
                name: 'Young user',
                email: 'youngeruser@example.com',
                password: 'SecurePassword123',
                gender: 'FEMALE',
                age: 15
            });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Registration denied. You must be at least 16 years old to create an account.')
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'USER_REGISTER_BLOCKED',
                status:'FAILURE',
                details: expect.objectContaining({httpStatus:403})
                })
            );
    });

    it('should reject registration if the email is already registered', async () => {
        mockFindUnique.mockResolvedValue({ id: 5, email: 'duplicate@example.com' });

        const res = await request(app)
            .post('/api/signup')
            .send({
                name:'Duplicate User',
                email: 'duplicate@example.com',
                password: 'SecurePassword123',
                gender: 'FEMALE',
                age: 20,
            });

        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/already exists/i);
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'USER_REGISTER_BLOCKED',
                status:'FAILURE',
                details: expect.objectContaining({httpStatus:409})
                })
            );
        });

        it('should return a 500 status if saving the comment fails', async()=>{
            mockFindUnique.mockRejectedValue(null);
            mockCreate.mockRejectedValue(new Error('Database Connection Lost'));
        
            const res = await request(app)
                .post('/api/signup')
                .send({
                    name:'Duplicate User',
                    email: 'duplicate@example.com',
                    password: 'SecurePassword123',
                    gender: 'FEMALE',
                    age: 20,
                });

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'USER_REGISTER', status:'FAILURE',
                    details:expect.objectContaining({httpStatus:500})
                })
            )
        })
});