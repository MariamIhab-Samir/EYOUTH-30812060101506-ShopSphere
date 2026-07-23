const { PrismaClient } = require('@prisma/client');

const mockFindUnique=jest.fn();
const mockCreate=jest.fn();
const mockUpdate=jest.fn();
const mockDelete=jest.fn();

jest.mock('@prisma/client', ()=>{
    return{
        PrismaClient: jest.fn().mockImplementation(()=>{
            return{
                product:{
                    findUnique:mockFindUnique,
                    create: mockCreate,
                    update:mockUpdate,
                    delete:mockDelete
                }
            }
        })
    }
});

jest.mock('../config/activityLog', ()=>({create: jest.fn().mockResolvedValue({})}));
jest.mock('../util/mailer', ()=>({sendEmail: jest.fn().mockResolvedValue({})}));

const jwt=require('jsonwebtoken');
jest.mock('jsonwebtoken')

jwt.verify.mockImplementation((token)=>{
    if(token==='MOCK_USER_TOKEN'){
        return{
            userId:1, id:1, email:'user@example.com', role:'USER'}
        }
    if(token==='MOCK_ADMIN_TOKEN'){
        return{
            userId:2, id:2, email:'admin@example.com', role:'ADMIN'}
        }
    throw new Error('Invalid Token');
});

const request= require('supertest');
const app=require('../app');
const mongoose=require('mongoose')
const activityLogModal=require('../config/activityLog');

describe('Admin Catalog API', ()=>{
    beforeEach(()=>{
        mockFindUnique.mockReset();
        mockCreate.mockReset();
        mockUpdate.mockReset()
        mockDelete.mockReset()
        activityLogModal.create.mockReset().mockResolvedValue({});
    });

    afterAll(async()=>{
        await mongoose.connection.close();
    })

    describe('POST /api/admin/products', ()=>{
        it('creates a product and returns 201 for an admin with an image', async()=>{
            mockCreate.mockResolvedValue({id:1, name:'New product', price:800, stock:15, description:'High Quality Iphone'});

            const response = await request(app)
                .post('/api/auth/admin/products')
                .set('Authorization', 'Bearer MOCK_ADMIN_TOKEN')
                .field('name', 'Rubric Compliant Product')
                .field('price', 800)
                .field('category', 'Iphones')
                .field('stock', 50)
                .attach('productImage', Buffer.from('fake-image-content'), 'test-image.jpg');

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('product');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'ADMIN_PRODUCT_CREATED', status:'SUCCESS', details:expect.objectContaining({httpStatus:201})
                })
            );
        });

        it('rejects a non-admin attempt of product creation with 403 and does not call Prisma', async()=>{
            const response = await request(app)
                .post('/api/auth/admin/products')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .field('name', 'Blocked Product')
                .field('price', 800)
                .field('category', 'Iphones')
                .field('stock', 50)
                .field('description', 'High quality product')
                .attach('productImage', Buffer.from('fake-image-content'), 'test-image.jpg');

            expect(response.statusCode).toBe(403);
            expect(response.body).toHaveProperty('error');
            expect(mockCreate).not.toHaveBeenCalled();
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'ADMIN_ACTION_FORBIDDEN', status:'FAILURE', details:expect.objectContaining({httpStatus:403})
                })
            )
        });

        it('rejects a request missing the image with 400', async()=>{
            const response = await request(app)
                .post('/api/auth/admin/products')
                .set('Authorization', 'Bearer MOCK_ADMIN_TOKEN')
                .field('name', 'Blocked Product')
                .field('price', 800)
                .field('category', 'Iphones')
                .field('stock', 50)
                .field('description', 'High quality product')

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');            
        })
    });

    it('returns 500 and logs failure if Prisma create throws', async()=>{
        mockCreate.mockRejectedValue(new Error('Database Connection Lost'));

        const response = await request(app)
                .post('/api/auth/admin/products')
                .set('Authorization', 'Bearer MOCK_ADMIN_TOKEN')
                .field('name', 'Blocked Product')
                .field('price', 800)
                .field('category', 'Iphones')
                .field('stock', 50)
                .field('description', 'High quality product')
                .attach('productImage', Buffer.from('fake-image-content'), 'test-image.jpg');

        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty('error');
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action:'ADMIN_PRODUCT_CREATED', status:'FAILURE', details:expect.objectContaining({httpStatus:500})
            })
        )
    });

    describe('PUT /api/admin/products/:id',()=>{
        it('updates a product and returns 200 for an admin', async()=>{
            mockFindUnique.mockResolvedValue({id:1, name:'Old name'})
            mockUpdate.mockResolvedValue({id:1, name:'Updated name'})

            const res=await request(app)
                .put('/api/admin/products/1')
                .set('Authorization', 'Bearer MOCK_ADMIN_TOKEN')
                .send({name:'Updated name', price:800})

            expect(res.status).toBe(200);
            expect(res.body.product.name).toBe('Updated name')
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'ADMIN_PRODUCT_UPDATED', status:'SUCCESS', details:expect.objectContaining({httpStatus:200})
                })
            )
        });

        it('rejects a non-admin with 403', async()=>{
            const res=await request(app)
                .put('/api/admin/products/1')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')
                .send({name:'Hacked name'})

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'ADMIN_ACTION_FORBIDDEN', status:'FAILURE', details:expect.objectContaining({httpStatus:403})
                })
            )
        });

    it('returns 500 and logs failure if Prisma create throws', async()=>{
        mockFindUnique.mockResolvedValue({id:1, name:'Old name'})
        mockUpdate.mockRejectedValue(new Error('Database Connection Lost'));

        const res=await request(app)
                .put('/api/admin/products/1')
                .set('Authorization', 'Bearer MOCK_ADMIN_TOKEN')
                .send({name:'Will fail'})

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action:'ADMIN_PRODUCT_UPDATED', status:'FAILURE', details:expect.objectContaining({httpStatus:500})})
            )
        });
    });

    describe('DELETE /api/admin/products/:id', ()=>{
        it('deletes a product and returns 200 for an admin', async()=>{
            mockFindUnique.mockResolvedValue({id:1, name:'To be deleted'});
            mockDelete.mockResolvedValue({});

            const res=await request(app)
                .delete('/api/admin/products/1')
                .set('Authorization', 'Bearer MOCK_ADMIN_TOKEN')

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        })

        it('rejects a non-admin with 403', async()=>{
            const res=await request(app)
                .delete('/api/admin/products/1')
                .set('Authorization', 'Bearer MOCK_USER_TOKEN')

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'ADMIN_ACTION_FORBIDDEN', status:'FAILURE', details:expect.objectContaining({httpStatus:403})
                })
            )
        });

        it('returns 500 and logs failure if Prisma create throws', async()=>{
            mockFindUnique.mockResolvedValue({id:1, name:'To be deleted'})
            mockDelete.mockRejectedValue(new Error('Database Connection Lost'));

            const res=await request(app)
                    .delete('/api/admin/products/1')
                    .set('Authorization', 'Bearer MOCK_ADMIN_TOKEN')

            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error');
            expect(activityLogModal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    action:'ADMIN_PRODUCT_DELETED', status:'FAILURE', details:expect.objectContaining({httpStatus:500})
                })
            )
        });
    });
});
