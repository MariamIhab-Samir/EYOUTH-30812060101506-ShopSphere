const { buildOrderConfirmationEmail } = require('../emails/orderConfirmation');
const activityLogModal=require('../config/activityLog')

const mockOrderFindUnique=jest.fn();
jest.mock('@prisma/client', ()=>({
    PrismaClient: jest.fn().mockImplementation(()=>({
        order: {findUnique: mockOrderFindUnique}
    }))
}));
jest.mock('../emails/orderConfirmation', ()=>({
    buildOrderConfirmationEmail: jest.fn().mockReturnValue({html: '<p>mock</p>'})
}));
jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));
jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

const{handleOrderCreatedWebhook}=require('../webhooks/orderCreatedHook');
const{sendEmail}=require('../util/mailer');
const mongoose=require('mongoose');

describe('handleOrderCreatedWebhook - Unit', ()=>{
    let req, res;
    beforeEach(()=>{
        mockOrderFindUnique.mockReset();
        sendEmail.mockClear();
        activityLogModal.create.mockReset().mockResolvedValue({});
        process.env.WEBHOOK_SECRET='test-secret';
        req={headers:{'x-webhook-secret': 'test-secret'}, body:{}};
        res={status: jest.fn().mockReturnThis(), json: jest.fn()};
    });

    afterAll(async ()=>{
        await mongoose.connection.close();
    });

    it('returns 401 when the webhook secret is wrong', async()=>{
        req.headers['x-webhook-secret']='wrong-secret';
        await handleOrderCreatedWebhook(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when orderId is missing', async()=>{
        await handleOrderCreatedWebhook(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when the order does not exist', async()=>{
        req.body={orderId:99};
        mockOrderFindUnique.mockResolvedValue(null);
        await handleOrderCreatedWebhook(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('sends the confirmation email and returns 200', async()=>{
        req.body={orderId:1};
        mockOrderFindUnique.mockResolvedValue({id:1, user:{email: 'buyer@example.com'}, items:[]});
        await handleOrderCreatedWebhook(req, res);
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({to: 'buyer@example.com'}));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action: 'ORDER_CONFIRMATION_WEBHOOK', status: 'SUCCESS'})
        );
    });

    it('returns 500 when sendEmail throws', async()=>{
        req.body={orderId:1};
        mockOrderFindUnique.mockResolvedValue({id:1, user:{email: 'buyer@example.com'}, items:[]});
        sendEmail.mockRejectedValueOnce(new Error('SMTP down'))
        await handleOrderCreatedWebhook(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action: 'ORDER_CONFIRMATION_WEBHOOK', status: 'FAILURE'})
        );
    })
})