const request=require('supertest');
const app=require('../app');
const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();

jest.mock('../util/mailer', ()=> ({
    sendEmail: jest.fn().mockResolvedValue({})
}));

const {sendEmail}=require('../util/mailer');
const sendPromoNotificationEmails=require('../jobs/promoNotification');

const WEBHOOK_PATH='/api/notifications/product-created';
const TEST_USER_EMAIL='integration_notification_user@example.com';
const TEST_USER_ID= 999;
const TEST_PRODUCT_ID= 999;

describe('POST /api/notifications/product-created - Integration', ()=>{
    beforeEach(async()=>{
        await prisma.notification.deleteMany({where: {userId: TEST_USER_ID}});
        sendEmail.mockClear();
        sendEmail.mockResolvedValue({});
        process.env.WEBHOOK_SECRET='test-webhook-secret';
    })

    afterAll(async()=>{
        await prisma.notification.deleteMany({where: {userId: TEST_USER_ID}});
        await prisma.$disconnect();
    })

    it('creates a real notification row and sends a promo email', async()=>{
        const res=await request(app)
            .post(WEBHOOK_PATH)
            .set('x-webhook-secret', 'test-webhook-secret')
            .send({
                productId: TEST_PRODUCT_ID,
                productName: 'Integration Test Product',
                productImage: '/x.png',
                productCategory: 'Iphones',
                productDescription: 'A product used for integration testing',
                matchedUsers: [{id: TEST_USER_ID, email: TEST_USER_EMAIL}]
            });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({to: TEST_USER_EMAIL})
        );

        const notification=await prisma.notification.findUnique({
            where: {userId_productId:{userId: TEST_USER_ID, productId: TEST_PRODUCT_ID}}
        });
        expect(notification).not.toBeNull();
        expect(notification.emailedAt).not.toBeNull();
    })
})