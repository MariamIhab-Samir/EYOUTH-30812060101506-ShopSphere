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
}))

const {sendConfirmationEmail}=require('../api/sendConfirmation');
const {sendEmail}=require('../util/mailer');
const {buildOrderConfirmationEmail}=require('../emails/orderConfirmation');
const activityLogModal=require('../config/activityLog');
const { PrismaClient } = require('@prisma/client');
const mongoose=require('mongoose');

describe('sendConfirmationEmail - Unit', ()=>{
    let req, res;
    beforeEach(()=>{
        mockOrderFindUnique.mockReset();
        sendEmail.mockClear();
        buildOrderConfirmationEmail.mockClear();
        activityLogModal.create.mockReset().mockResolvedValue({});
        req={method: 'POST', body:{}};
        res={status: jest.fn().mockReturnThis(), json: jest.fn()};
    });

    afterAll(async ()=>{
        await mongoose.connection.close();
    });

    it('returns 400 when orderId is missing', async()=>{
        await sendConfirmationEmail(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when the order does not exist', async()=>{
        req.body={orderId: 99};
        mockOrderFindUnique.mockResolvedValue(null);
        await sendConfirmationEmail(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('builds and sends the comfirmation email, returns 200', async()=>{
        req.body={orderId: 99};
        const order={id:1, user:{email:'buyer@example.com'}, items: []};
        mockOrderFindUnique.mockResolvedValue(order);
        await sendConfirmationEmail(req, res);
        expect(buildOrderConfirmationEmail).toHaveBeenCalledWith(order);
        expect(sendEmail).toHaveBeenCalledWith({
            to: 'buyer@example.com',
            subject: 'Order Confirmation #1',
            html: '<p>mock</p>'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action: 'CONFIRMATION_EMAIL_SENT', status: 'SUCCESS'})
        );
    })

    it('returns 500 when sendEmail throws', async()=>{
        req.body={orderId: 1};
        mockOrderFindUnique.mockResolvedValue({id: 1, user: {email: 'buyer@example.com'}, items: []});
        sendEmail.mockRejectedValueOnce(new Error('SMTP down'));
        await sendConfirmationEmail(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action: 'CONFIRMATION_EMAIL_SENT', status: 'FAILURE'})
        );
    });
})