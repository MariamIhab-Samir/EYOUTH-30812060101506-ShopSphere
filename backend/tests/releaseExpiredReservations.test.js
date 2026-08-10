const mockTransaction=jest.fn() 
const mockProductUpdate=jest.fn() 
const mockCartItemDelete=jest.fn() 
const mockCartItemFindMany=jest.fn() 

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                cartItem:{ findMany:mockCartItemFindMany, delete:mockCartItemDelete},
                product:{update: mockProductUpdate},
                $transaction:(...args)=>mockTransaction(...args)
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
        return{userId:1, id:1, email:'buyer@example.com', role:'USER'};
    }
    throw new Error('Invalid Token');
});

const releaseExpiredReservations= require('../jobs/releaseExpiredReservations');

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const activityLogModal=require('../config/activityLog');

describe('releaseExpiredReservations - Unit', ()=>{
    beforeEach(()=>{
        mockTransaction.mockReset().mockResolvedValue([{}, {}])
        mockCartItemFindMany.mockReset()
        activityLogModal.create.mockReset().mockResolvedValue({});
        
        mockTransaction.mockImplementation(async(fn)=>{
        });
    });
    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('returns 0 and does nothing when there are no expired reservations', async()=>{
        mockCartItemFindMany.mockResolvedValue([]);
        const count = await releaseExpiredReservations();
        expect(count).toBe(0);
        expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('runs a transaction per expired item and returns the released count', async()=>{
        mockCartItemFindMany.mockResolvedValue([
            {id:1, productId: 5, quantity:2},
            {id:2, productId:6, quantity:1}
        ]);
        const count = await releaseExpiredReservations();
        expect(count).toBe(2);
        expect(mockTransaction).toHaveBeenCalledTimes(2);
    })

    it('queries with a cutoff of roughly 20 mins ago', async()=>{
        mockCartItemFindMany.mockResolvedValue([]);
        const before=Date.now();
        await releaseExpiredReservations();
        const cutoff=mockCartItemFindMany.mock.calls[0][0].where.reservedAt.lt;
        expect((before - cutoff.getTime()) /60000).toBeCloseTo(20,0)
    })
})