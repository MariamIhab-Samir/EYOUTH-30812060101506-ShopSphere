const mockProductFindUnique=jest.fn()
const mockCartItemUpsert=jest.fn()
const mockCartItemFindUnique=jest.fn()
const mockTransaction=jest.fn()
const mockProductUpdate=jest.fn()
const mockCartItemDelete=jest.fn()
const mockCartItemDeleteMany=jest.fn()
const mockCartItemFindMany=jest.fn()
const mockCartItemUpdate=jest.fn()

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                $transaction:(fn)=>mockTransaction(fn),
                cartItem:{
                    findMany: mockCartItemFindMany,
                    delete: mockCartItemDelete
                },
                product: {
                    update: mockProductUpdate
                }
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

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const activityLogModal=require('../config/activityLog');

describe('Cart API', ()=>{
    beforeEach(()=>{
        mockProductFindUnique.mockReset()
        mockCartItemUpsert.mockReset()
        mockCartItemFindUnique.mockReset()
        mockTransaction.mockReset()
        mockProductUpdate.mockReset()
        mockCartItemDelete.mockReset()
        mockCartItemDeleteMany.mockReset()
        mockCartItemFindMany.mockResolvedValue([])
        mockCartItemUpdate.mockReset() 
        activityLogModal.create.mockReset().mockResolvedValue({});
        
        mockTransaction.mockImplementation(async(fn)=>{
            const tx={
                product:{findUnique:mockProductFindUnique, update: mockProductUpdate},
                cartItem:{upsert:mockCartItemUpsert, findUnique:mockCartItemFindUnique, delete:mockCartItemDelete, deleteMany:mockCartItemDeleteMany, findMany:mockCartItemFindMany, update:mockCartItemUpdate}
            };
            return fn(tx);
        });
    });
    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('POST /api/cart', () => {
        it('should add an item and returns 200', async () => {
            mockProductFindUnique.mockResolvedValue({ id: 5, name:'Black Iphone 17', stock: 15 });
            mockProductUpdate.mockResolvedValue({});
            mockCartItemUpsert.mockResolvedValue({ id: 1, userId: 1, productId: 5, quantity: 1 });

            const res=await request(app)
                .post('/api/cart')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({productId:5, quantity:1});

            expect(res.status).toBe(200);
            expect(res.body.cartItem.id).toBe(1);
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_ITEM_ADDED', status: 'SUCCESS'})
            );
        });

        it('returns 404 when the product does not exist', async()=>{
            mockProductFindUnique.mockResolvedValue(null);

                const res=await request(app)
                    .post('/api/cart')
                    .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                    .send({productId:9, quantity:1});

                expect(res.status).toBe(404);
                expect(res.body).toHaveProperty('error');
            });

        it('returns 400 for insufficient stock', async()=>{
            mockProductFindUnique.mockResolvedValue({id:5, name:'Black Iphone 17', stock:1});

            const res=await request(app)
                .post('/api/cart')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({productId:5, quantity:2});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        })

        it('returns 500 and logs failure on a real server error', async()=>{
            mockProductFindUnique.mockRejectedValue(new Error('Database Connection Lost'))

            const res=await request(app)
                .post('/api/cart')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({productId:5, quantity:5});

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_ITEM_ADDED', status: 'FAILURE'})
            );
        })
    })

    describe('GET /api/cart', ()=>{
        it('returns the user\'s cart items with 200', async()=>{
            mockCartItemFindMany.mockResolvedValueOnce([]);
            mockCartItemFindMany.mockResolvedValue([{ id: 1, userId: 1, productId: 5, quantity: 1, product:{id: 5, name:'Black Iphone 17'}}]);

            const res=await request(app)
                .get('/api/cart')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')

            expect(res.status).toBe(200);
            expect(res.body.cartItems).toHaveLength(1);
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_RETRIEVED', status: 'SUCCESS'})
            );
        })

        it('returns 500 and logs failure if the lookup throws', async()=>{
            mockCartItemFindMany.mockRejectedValue(new Error('Database Connection Lost'))

            const res=await request(app)
                .get('/api/cart')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({productId:5, quantity:5});

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_RETRIEVED', status: 'FAILURE'})
            );
        })
    })

    describe('PUT /api/cart/:id', ()=>{
        it('updates quantity and returns 200', async()=>{
            mockCartItemFindUnique.mockResolvedValue({ id: 1, userId: 1, productId: 5, quantity: 1 });
            mockProductFindUnique.mockResolvedValue({ id: 5, name:'Black Iphone 17', stock: 10 });
            mockProductUpdate.mockResolvedValue({});
            mockCartItemUpdate.mockResolvedValue({ id: 1, userId: 1, productId: 5, quantity: 3 });

            const res=await request(app)
                .put('/api/cart/2')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({quantity:3});

            expect(res.status).toBe(200);
            expect(res.body.cartItem.updatedCartItem.quantity).toBe(3);
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_ITEM_UPDATED', status: 'SUCCESS'})
            );
        })

        it('returns 404 when the cart item does not belong to the user', async()=>{
            mockCartItemFindUnique.mockResolvedValue({ id: 1, userId: 9, productId: 5, quantity: 1 });

            const res=await request(app)
                .put('/api/cart/2')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({quantity:2});

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        })

        it('returns 400 when increasing beyond available stock', async()=>{
            mockCartItemFindUnique.mockResolvedValue({ id: 1, userId: 1, productId: 5, quantity: 1 });
            mockProductFindUnique.mockResolvedValue({ id: 5, stock: 0 });

            const res=await request(app)
                .put('/api/cart/2')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({quantity:2});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        })

        it('returns 500 and logs failure on a server error', async()=>{
            mockCartItemFindUnique.mockRejectedValue(new Error('Database Connection Lost'));

            const res=await request(app)
                .put('/api/cart/1')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({quantity:2});

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_ITEM_UPDATED', status: 'FAILURE'})
            );
        })
    })

    describe('DELETE /api/cart/:id', ()=>{
        it('removes the item and returns 200', async()=>{
            mockCartItemFindUnique.mockResolvedValue({ id: 1, userId: 1, productId: 5, quantity: 2 });
            mockProductUpdate.mockResolvedValue({});
            mockCartItemDelete.mockResolvedValue({});

            const res=await request(app)
                .delete('/api/cart/2')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')

            expect(res.status).toBe(200);
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_ITEM_REMOVED', status: 'SUCCESS'})
            );
        })

        it('returns 404 when the item is not found', async()=>{
            mockCartItemFindUnique.mockResolvedValue(null);

            const res=await request(app)
                .delete('/api/cart/2')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        })

        it('returns 500 and logs failure on a server error', async()=>{
            mockCartItemFindUnique.mockRejectedValue(new Error('Database Connection Lost'));

            const res=await request(app)
                .delete('/api/cart/2')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_ITEM_REMOVED', status: 'FAILURE'})
            );
        })
    })

    describe('DELETE /api/cart', ()=>{
        it('clears the cart and returns 200', async()=>{
            mockCartItemFindMany.mockResolvedValue([
                {id:1, userId:1, productId:5,quantity:2}
            ])
            mockProductUpdate.mockResolvedValue({});
            mockCartItemDeleteMany.mockResolvedValue({});

            const res=await request(app)
                .delete('/api/cart')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')

            expect(res.status).toBe(200);
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_CLEARED', status: 'SUCCESS'})
            );
        })

        it('returns 500 and logs failure on a server error', async()=>{
            mockCartItemFindMany.mockRejectedValue(new Error('Database Connection Lost'));

            const res=await request(app)
                .delete('/api/cart')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({action:'CART_CLEARED', status: 'FAILURE'})
            );
        })
    })
});