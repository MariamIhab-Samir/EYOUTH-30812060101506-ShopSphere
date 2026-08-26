const mockProductFindUnique=jest.fn() 
const mockTransaction=jest.fn() 
const mockCartItemDeleteMany=jest.fn() 
const mockCartItemFindMany=jest.fn() 
const mockCouponFindUnique=jest.fn() 
const mockCouponUpdate=jest.fn() 
const mockCouponRedemptionCount=jest.fn() 
const mockCouponRedemptionCreate=jest.fn() 
const mockOrderCreate=jest.fn() 
const mockTopLevelOrderFindUnique=jest.fn().mockResolvedValue({id:1}) 

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                $transaction:(fn)=>mockTransaction(fn),
                order:{ findUnique:mockTopLevelOrderFindUnique}
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

global.fetch=jest.fn().mockResolvedValue({
    ok: true, text: jest.fn().mockResolvedValue('')
})
const jwt=require('jsonwebtoken');
jest.mock('jsonwebtoken');

jwt.verify.mockImplementation((token)=>{
    if(token==='MOCK_USER_TOKEN'){
        return{userId:1, id:1, email:'buyer@example.com', role:'USER'};
    }
    throw new Error('Invalid Token');
});

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const activityLogModal=require('../config/activityLog');

describe('POST /api/orders', ()=>{
    beforeEach(()=>{
        mockProductFindUnique.mockReset()
        mockTransaction.mockReset() 
        mockCartItemDeleteMany.mockReset()
        mockCartItemFindMany.mockReset()
        mockCouponFindUnique.mockReset() 
        mockCouponUpdate.mockReset()
        mockCouponRedemptionCount.mockReset()
        mockCouponRedemptionCreate.mockReset()
        mockOrderCreate.mockReset()
        global.fetch.mockReset()
        activityLogModal.create.mockReset().mockResolvedValue({});
        
        global.fetch.mockResolvedValue({
            ok:true, text: jest.fn().mockResolvedValue('')
        })

        mockTransaction.mockImplementation(async(fn)=>{
            const tx={
                product:{findUnique:mockProductFindUnique},
                cartItem:{deleteMany:mockCartItemDeleteMany, findMany:mockCartItemFindMany},
                coupon:{findUnique: mockCouponFindUnique},
                couponRedemption:{count: mockCouponRedemptionCount, create: mockCouponRedemptionCreate},
                order: {create: mockOrderCreate}
            };
            return fn(tx);
        });

        mockCartItemFindMany.mockResolvedValue([{
            productId: 5, quantity:2
        }]);

        mockProductFindUnique.mockResolvedValue({
            id: 5, price: 100, name: 'Test Item'
        });

        mockOrderCreate.mockResolvedValue({
            id: 1, totalPrice: 180, items: []
        })
    });
    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('rejects a coupon code that does not exist', async()=>{
        mockCouponFindUnique.mockResolvedValue(null);
        const res=await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({couponCode: 'GHOST10'});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Coupon not found')
    });

    it('rejects a coupon once the user has exhausted their personal redemption allowance', async()=>{
        mockCouponFindUnique.mockResolvedValue({
            id: 1, code: 'SALE10', stock: 0, discountPercent: 10, expiresAt: null
        });
        mockCouponRedemptionCount.mockResolvedValue(2)
        const res=await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({couponCode: 'SALE10'});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Coupon stock exhausted for this user')
    });

    it('rejects an expired coupon', async()=>{
        mockCouponFindUnique.mockResolvedValue({
            id: 1, code: 'OLD10', stock: 5, discountPercent: 10, expiresAt: '2020-01-01'
        });
        const res=await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({couponCode: 'OLD10'});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Coupon has expired')
    });

    it('applies the discount, decrements coupon stock and records the redemption', async()=>{
        mockCouponFindUnique.mockResolvedValue({
                id: 7, code: 'SALE10', stock: 5, discountPercent: 10, expiresAt: null
        });
        mockCouponRedemptionCount.mockResolvedValue(2)
        const res=await request(app)
            .post('/api/orders')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({couponCode: 'SALE10'});
        expect(res.status).toBe(201);
        expect(mockOrderCreate).toHaveBeenCalledWith
        (expect.objectContaining({
            data: expect.objectContaining({
                totalPrice: 180
            })
        }));
        expect(mockCouponRedemptionCreate).toHaveBeenCalledWith({
            data: {userId: 1, couponId:7}
        })
    })
})