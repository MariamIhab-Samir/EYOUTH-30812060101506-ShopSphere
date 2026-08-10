const mockProductFindUnique=jest.fn() 
const mockCartItemUpsert=jest.fn() 
const mockCartItemFindUnique=jest.fn() 
const mockTransaction=jest.fn() 
const mockProductUpdate=jest.fn() 

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                $transaction:(fn)=>mockTransaction(fn)
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

const jwt=require('jsonwebtoken');
jest.mock('jsonwebtoken');

jwt.verify.mockImplementation((token)=>{
    if(token==='MOCK_USER_TOKEN'){
        return{userId:1, id:1, email:'buyer@example.com', role:'USER'};
    }
    throw new Error('Invalid Token');
});

global.fetch=jest.fn().mockResolvedValue({
    ok: true, text: jest.fn().mockResolvedValue('')
})

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const activityLogModal=require('../config/activityLog');

describe('cart.js - stock-low webhook trigger unit', ()=>{
    beforeEach(()=>{
        mockProductFindUnique.mockReset()
        mockCartItemUpsert.mockReset()
        mockCartItemFindUnique.mockReset()
        mockTransaction.mockReset()
        mockProductUpdate.mockReset()
        global.fetch.mockReset()
        global.fetch.mockResolvedValue({
            ok: true, text: jest.fn().mockResolvedValue('')
        });

        process.env.LOW_STOCK_THRESHOLD='5';
    });
    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('addToCart: fires the webhook when stock crosses the threshold', async () => {
        mockTransaction.mockImplementation(async (fn)=> fn({
            product: {findUnique: mockProductFindUnique,
                update: mockProductUpdate
            },
            cartItem: {upsert: mockCartItemUpsert}
        }))
        mockProductFindUnique.mockResolvedValue({ id: 5, name:'Black Iphone 17', stock: 18 });
        mockProductUpdate.mockResolvedValue({id: 5, stock: 4});
        mockCartItemUpsert.mockResolvedValue({ id: 1, userId: 1, productId: 5, quantity:  4});

        const res=await request(app)
            .post('/api/cart')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({productId:5, quantity:4});

        expect(res.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/webhooks/stock-low'),
            expect.objectContaining({body: JSON.stringify({productId: 5})})
        )
    });

    it('addToCart: does not fire the webhook when stock stays above threshold', async () => {
        mockTransaction.mockImplementation(async (fn)=> fn({
            product: {findUnique: mockProductFindUnique,
                update: mockProductUpdate
            },
            cartItem: {upsert: mockCartItemUpsert}
        }))
        mockProductFindUnique.mockResolvedValue({ id: 5, name:'Black Iphone 17', stock: 20 });
        mockProductUpdate.mockResolvedValue({id: 5, stock: 18});
        mockCartItemUpsert.mockResolvedValue({ id: 1, userId: 1, productId: 5, quantity:  2});

        const res=await request(app)
            .post('/api/cart')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({productId:5, quantity:2});

        expect(res.status).toBe(200);
        expect(global.fetch).not.toHaveBeenCalledWith();
    });

    it('updateCartItem: fires the webhook when a quantity increase crosses the threshold', async () => {
        mockTransaction.mockImplementation(async (fn)=> fn({
            product: {findUnique: mockProductFindUnique,
                update: mockProductUpdate
            },
            cartItem: {findUnique: mockCartItemFindUnique, update: mockCartItemUpsert}
        }))

        mockCartItemFindUnique.mockResolvedValue({id: 10, userId: 1, productId: 5, quantity: 1})
        mockProductFindUnique.mockResolvedValue({ id: 5, name:'Black Iphone 17',stock: 9});
        mockProductUpdate.mockResolvedValue({id: 5, stock: 3});
        mockCartItemUpsert.mockResolvedValue({ id: 10, userId: 1, productId: 5, quantity: 7});

        const res=await request(app)
            .put('/api/cart/10')
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({quantity:7});

        expect(res.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/webhooks/stock-low'),
            expect.objectContaining({body: JSON.stringify({productId: 5})})
        )
    });
});