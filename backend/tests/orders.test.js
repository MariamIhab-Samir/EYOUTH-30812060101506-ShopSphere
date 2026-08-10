const mockProductFindUnique=jest.fn()
const mockTransaction=jest.fn()
const mockProductUpdate=jest.fn()
const mockOrderCreate=jest.fn()
const mockCartItemDeleteMany=jest.fn()
const mockCartItemFindMany=jest.fn()

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                $transaction:(fn)=>mockTransaction(fn),
                order: {findUnique: jest.fn().mockResolvedValue({})}
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

global.fetch=jest.fn().mockResolvedValue({ok:true, text: jest.fn().mockResolvedValue('')});

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

const CREATE_ORDER_PATH='/api/orders';
describe('Order Creation API', ()=>{
    beforeEach(()=>{
        mockProductFindUnique.mockReset()
        mockTransaction.mockReset()
        mockProductUpdate.mockReset()
        mockOrderCreate.mockReset()
        mockCartItemDeleteMany.mockReset()
        mockCartItemFindMany.mockResolvedValue([{productId:5, quantity:2}])
        activityLogModal.create.mockReset().mockResolvedValue({});

        mockTransaction.mockImplementation(async(fn)=>{
            const tx={
                product:{findUnique:mockProductFindUnique, update: mockProductUpdate},
                order:{create: mockOrderCreate},
                product:{findUnique: mockProductFindUnique},
                cartItem:{findMany:mockCartItemFindMany, deleteMany:mockCartItemDeleteMany}
            };
            return fn(tx);
        })
    });
        
    afterAll(async()=>{
        await mongoose.connection.close();
    });
    
    it('should place an order and return 201 status', async()=>{
        mockCartItemFindMany.mockResolvedValue([{id:1, userId:1, productId:'p1', quantity:2}]);
        mockProductFindUnique.mockResolvedValue({
            id:'p1',
            name:'Black Iphone 17',
            price:800,
            stock:15
        });
        
        mockOrderCreate.mockResolvedValue({
            id:'order1',
            totalPrice:1600,
            status:'SUCCESS',
            items:[{
                productId:'p1', quantity:2, priceAtPurchase:800
            }]
        });
        mockCartItemDeleteMany.mockResolvedValue({});

        const res=await request(app)
            .post(CREATE_ORDER_PATH)
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({items:[{productId:'p1', quantity:2}]});

            expect(res.status).toBe(201);
            expect(res.body.order.id).toBe('order1');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'CHECKOUT', status:'SUCCESS'}))       
    });

    it('should reject checkout on an empty cart with 400', async()=>{
        mockCartItemFindMany.mockResolvedValue([]);
        const res=await request(app)
            .post(CREATE_ORDER_PATH)
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error')
    });

    it('should return a 500 status for non-stock/non-notFound error', async()=>{
        mockCartItemFindMany.mockRejectedValue(new Error('Database Connection Lost'));

        const res=await request(app)
            .post(CREATE_ORDER_PATH)
            .set('Authorization', 'Bearer MOCK_USER_TOKEN')
            .send({items:[{productId:'p1', quantity:1}]});
        
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
        expect(activityLogModal.create).toHaveBeenCalledWith(
        expect.objectContaining({action:'CHECKOUT', status:'FAILURE'})
        );
    })
})