const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const mongoose = require('mongoose');
const jwt=require('jsonwebtoken');
jest.mock('jsonwebtoken');

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}))

const prisma = new PrismaClient();
const AUTH_TEST_EMAIL = 'profile_test_user@example.com';
const ADMIN_TEST_EMAIL = 'admin_lifecycle_test@example.com';

let userToken = 'MOCK_USER_TOKEN'; 
let adminToken = 'MOCK_ADMIN_TOKEN';
let customerId, adminId;

let targetProductId = '';
let targetOrderId = '';

describe('Unified User Profile, Orders & Admin Product Lifecycle Suite', () => {

    beforeEach(async () => {
        await prisma.order.deleteMany({});
        
        await prisma.product.deleteMany({});
        await prisma.user.deleteMany({ where: { email: { in: [AUTH_TEST_EMAIL, ADMIN_TEST_EMAIL] } } });
        
        customer = await prisma.user.create({
            data: { name: 'Standard Customer', email: AUTH_TEST_EMAIL, password: 'password123', role: 'USER', age: 17, gender:'female'}
        });
        customerId=customer.id;

        admin = await prisma.user.create({
            data: { name: 'System Admin', email: ADMIN_TEST_EMAIL, password: 'adminpassword123', role: 'ADMIN', age: 20, gender:'male'}
        });
        adminId=admin.id;

        jwt.verify.mockImplementation((token)=>{
            if(token==='MOCK_ADMIN_TOKEN'){
                return{id: adminId, userId:adminId, email:ADMIN_TEST_EMAIL, role:'ADMIN'};
            }
            if(token==='MOCK_USER_TOKEN'){
                return{id:customerId, userId:customerId, email:AUTH_TEST_EMAIL, role:'USER'}
            }
            throw new Error('Invalid Token')
        });

        const product = await prisma.product.create({
            data: { name: 'Initial Base Item', price: 500.00, stock: 10, category: 'General', description:'/' }
        });
        targetProductId = product.id;

        const order = await prisma.order.create({
            data: {
                userId: customer.id,
                totalPrice: 1000.00,
                status: 'PENDING',
                createdAt: new Date() 
            }
        });
        targetOrderId = order.id;
    });

    afterAll(async () => {
        
        await prisma.order.deleteMany({ where: { id: targetOrderId } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: targetProductId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { email: { in: [AUTH_TEST_EMAIL, ADMIN_TEST_EMAIL] } } });
        
        await prisma.$disconnect();
        await mongoose.connection.close();
    });


    it('[STATUS 200] Should allow an authenticated user to update their profile information', async () => {
        const response = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ name: 'Updated Master Name' });

        expect(response.statusCode).toBe(200);
        expect(response.body.user.name).toBe('Updated Master Name');
    });

    it('[STATUS 201] Should allow an authorized ADMIN to add new products', async () => {
        const response = await request(app)
            .post('/api/auth/admin/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .field('name', 'Rubric Compliant Product')
            .field('price', 99.99)
            .field('category', 'Testing')
            .field('stock', 50)
            .attach('productImage', Buffer.from('fake-image-content'), 'test-image.jpg');

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('product');
        
        await prisma.product.delete({ where: { id: response.body.product.id } }).catch(() => {});
    });

    it('[STATUS 200] Should allow an authorized ADMIN to update an existing product', async () => {
        const response = await request(app)
            .put(`/api/auth/admin/products/${targetProductId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Admin Upgraded Item Name',
                price: 750.00,
                stock: 15
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.product.name).toBe('Admin Upgraded Item Name');
        expect(response.body.product.price).toBe(750.00);
    });

    it('[STATUS 200] Should allow an authorized ADMIN to delete a product completely', async () => {
        const response = await request(app)
            .delete(`/api/auth/admin/products/${targetProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        
        const searchCheck = await prisma.product.findUnique({ where: { id: targetProductId } });
        expect(searchCheck).toBeNull();
        targetProductId = null; 
    });

    it('[STATUS 403] Should strictly block a standard customer from adding products', async () => {
        const response = await request(app)
            .post('/api/auth/admin/products')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ name: 'Unauthorized Product Entry', price: 5.00, stock: 1 });

        expect(response.statusCode).toBe(403);
    });

    it('[STATUS 403] Should strictly block a standard USER from updating products via raw HTTP requests', async () => {
        const response = await request(app)
            .put(`/api/auth/admin/products/${targetProductId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ name: 'Hacker Attempted Injection Modify' });

        expect(response.statusCode).toBe(403);
    });

    it('[STATUS 403] Should strictly block a standard USER from deleting products via raw HTTP requests', async () => {
        const response = await request(app)
            .delete(`/api/auth/admin/products/${targetProductId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toBe(403);
    });
});
