const mockFindMany=jest.fn();

jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                product: {
                    findMany: mockFindMany
                },
            };
        }),
    };
});

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue([])
}))
const request = require('supertest');
const app = require('../app');
const prisma = require('@prisma/client');
const activityLogModal=require('../config/activityLog');

const { PrismaClient } = require('@prisma/client');
const mongoose = require('mongoose');

describe('GET /api/products - Product Listing System', () => {

    beforeEach(() => {
        mockFindMany.mockReset();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should fetch and return a list of all products with 200 status', async () => {
        const mockProductList = [
            { id: 1, name: 'Samsung S26', price: 900, stock: 15 },
            { id: 2, name: 'Iphone 17', price: 800, stock: 40 },
        ];
        
        mockFindMany.mockResolvedValue(mockProductList);

        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body[1].name).toBe('Iphone 17');
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action:'PRODUCTS_ENRICHED', status:'SUCCESS'})
        )
    });

    it('should safely return an empty array if no products exist', async () => {
        mockFindMany.mockResolvedValue([]);

        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(0);
    });

    it('should return a 500 server error status if the database query fails', async () => {
        
        mockFindMany.mockRejectedValue(new Error('Database Connection Lost'));

        const res = await request(app).get('/api/products');

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action:'PRODUCTS_ENRICHED', status:'FAILURE'})
        )
    });
});