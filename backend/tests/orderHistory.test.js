const mockFindMany=jest.fn();
jest.setTimeout(20000);
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                order: {
                    findMany: mockFindMany
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
}))

const jwt=require('jsonwebtoken');
jest.mock('jsonwebtoken');

jwt.verify.mockImplementation((token)=>{
    if(token==='MOCK_USER_TOKEN'){
        return{userId:1, email:'buyer@example.com', role:'USER'}
    }
    throw new Error('Invalid Token');
})

const request = require('supertest');
const app = require('../app');
const activityLogModal=require('../config/activityLog');
const mongoose=require('mongoose');

const prisma = require('@prisma/client'); 

const ORDER_HISTORY_PATH='/api/auth/orders';

describe('Order History API', ()=>{
    beforeEach(()=>{
        mockFindMany.mockReset();
        activityLogModal.create.mockReset().mockResolvedValue({});
    });
            
    afterAll(async()=>{
        await mongoose.connection.close();
    });

    it('should fetch and return the user\'s order history with 200 status', async()=>{
        const mockOrders=[
            {id:'o1', totalAmount:800, status:'SUCCESS', items:['Black Iphone 17']},
            {id:'o2', totalAmoun:700, status:'FAILURE', items:['Green Iphone 17']}
        ];
        mockFindMany.mockResolvedValue(mockOrders);

        const res=await request(app)
            .get(ORDER_HISTORY_PATH)
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')

        expect(res.status).toBe(200);
        expect(res.body.orders).toHaveLength(2);
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action:'ORDERS_RETRIEVED', status:'SUCCESS', details: expect.objectContaining({count:2})})
        );
    })

    it('should safely return an empty array if the user has no orders', async()=>{
        mockFindMany.mockResolvedValue([]);

        const res=await request(app)
            .get(ORDER_HISTORY_PATH)
            .set('Authorization', 'Bearer MOCK_USER_TOKEN');

        expect(res.status).toBe(200);
        expect(res.body.orders).toEqual([]);
    })

    it('should return a 500 status and log the failure if the lookup throws', async()=>{
        mockFindMany.mockRejectedValue(new Error('Database Connection Lost'));

            const res=await request(app)
                .get(ORDER_HISTORY_PATH)
                .set('Authorization', 'Bearer MOCK_USER_TOKEN');
            
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action:'ORDERS_RETRIEVED', status:'FAILURE'}))
    })
})