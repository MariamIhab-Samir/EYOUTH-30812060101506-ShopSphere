const mockNotificationUpsert=jest.fn();
const mockNotificationFindMany=jest.fn();
const mockNotificationUpdateMany=jest.fn();

jest.mock('@Prisma/client', ()=>{
    return{
        PrismaClient: jest.fn().mockImplementation(()=>{
            return{
                notification: {
                    upsert: mockNotificationUpsert,
                    findMany: mockNotificationFindMany,
                    updateMany: mockNotificationUpdateMany
                }
            };
        }),
    };
});

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));

const{sendEmail}=require('../util/mailer');
const request=require('supertest');
const app=require('../app');
const sendPromoNotificationEmails=require('../jobs/promoNotification');

describe('POST /api/notifications/product-created', ()=>{
    const WEBHOOK_PATH='/api/notifications/product-created';

    beforeEach(()=>{
        mockNotificationUpsert.mockReset();
        mockNotificationFindMany.mockReset();
        mockNotificationUpdateMany.mockReset();
        sendEmail.mockClear();
        process.env.WEBHOOK_SECRET='test-webhook-secret';
    });

    it('rejects a request with the wrong webhook secret with 401', async()=>{
        const res=await request(app)
            .post(WEBHOOK_PATH)
            .set('x-webhook-secret', 'wrong-secret')
            .send({productId:1, matchedUsers: [{id:1, email:'a@example.com'}]});
        expect(res.status).toBe(401);
        expect(mockNotificationUpsert).not.toHaveBeenCalled();
    })

    it('rejects a request missing productId or matchedUsers with 400', async()=>{
        const res=await request(app)
            .post(WEBHOOK_PATH)
            .set('x-webhook-secret', 'test-webhook-secret')
            .send({productId:1})
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    })

    it('upserts a notification per matched user and sends promo emails, returns 200', async()=>{
        mockNotificationUpsert.mockResolvedValue({});
        mockNotificationFindMany.mockResolvedValue([
            {id:1, userId:1, userEmail:'a@example.com', productId:5, productName:'Black Iphone 17'}
        ]);
        mockNotificationUpdateMany.mockResolvedValue({});

        const res=await request(app)
            .post(WEBHOOK_PATH)
            .set('x-webhook-secret', 'test-webhook-secret')
            .send({
                productId:5,
                productName: 'Black Iphone 17',
                productImage: '/x.png',
                productCategory: 'Iphones',
                productDescription: 'Great phone',
                matchedUsers: [{id:1, email:'a@example.com'}]
            });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({success: true, matched:1});
        expect(mockNotificationUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {userId_productId: {userId:1, productId:5}},
                create: expect.objectContaining({userId:1,  productId:5, type:'NEW_PRODUCT_MATCH'})
            })
        );
        expect(sendEmail).toHaveBeenCalled();
    })

    it('returns 500 if the upsert throws', async()=>{
        mockNotificationUpsert.mockRejectedValue(new Error('Database Connection Lost'));

        const res=await request(app)
            .post(WEBHOOK_PATH)
            .set('x-webhook-secret', 'test-webhook-secret')
            .send({productId:5, matchedUsers: [{id:1, email:'a@example.com'}]})
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    })
});

describe('sendPromoNotificationEmails - Unit', ()=>{
    beforeEach(()=>{
        mockNotificationFindMany.mockReset();
        mockNotificationUpdateMany.mockReset();
        sendEmail.mockClear();
        sendEmail.mockResolvedValue({});
    })

    it('returns 0 And sends nothing when there are no pending notifications', async()=>{
        mockNotificationFindMany.mockResolvedValue([]);

        const count=await sendPromoNotificationEmails();

        expect(count).toBe(0);
        expect(sendEmail).not.toHaveBeenCalled();
    })

    it('groups pending notifications by user, sends one email per user and marks them emailed', async()=>{
        mockNotificationFindMany.mockResolvedValue([
            {id:1, userId:1, userEmail:'a@example.com', productName: 'Product A'},
            {id:2, userId:1, userEmail:'a@example.com', productName: 'Product B'},
            {id:3, userId:2, userEmail:'b@example.com', productName: 'Product C'}
        ]);
        mockNotificationUpdateMany.mockResolvedValue({});

        const count=await sendPromoNotificationEmails();
        expect(count).toBe(2);
        expect(sendEmail).toHaveBeenCalledTimes(2);
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({to: 'a@example.com', subject: expect.stringContaining('2')})
        );
        expect(mockNotificationUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({where: {id: {in: [1,2]}}})
        );
    })

    it('continues emailing remaining users if one send fails', async()=>{
        mockNotificationFindMany.mockResolvedValue([
            {id:1, userId:1, userEmail:'fails@example.com', productName: 'Product A'},
            {id:2, userId:1, userEmail:'ok@example.com', productName: 'Product B'}
        ]);
        mockNotificationUpdateMany.mockResolvedValue([]);
        sendEmail
            .mockRejectedValue(new Error('SMTP down'))
            .mockResolvedValueOnce({});
        const count=await sendPromoNotificationEmails();

        expect(count).toBe(1);
        expect(sendEmail).toHaveBeenCalledTimes(2);
    });
});

describe('sendPromoEmails cron handler - Unit', ()=>{
    const sendPromoEmailsHandler=require('../api/cron.sendPromoEmails');

    let req,res;
    beforeEach(()=>{
        mockNotificationFindMany.mockReset();
        mockNotificationUpdateMany.mockReset();
        sendEmail.mockClear();
        process.env.CRON_SECRET='test-cron-secret';
        req={headers:{authorization: 'Bearer test-cron-secret'}};
        res={status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn()};
    })

    it('returns 401 when the cron secret is wrong', async()=>{
        req.headers.authorization='Bearer wrong-secret';
        await sendPromoEmailsHandler(req,res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.end).toHaveBeenCalled();
    })

    it('returns 200 with emailedCount on success', async()=>{
        mockNotificationFindMany.mockResolvedValue([
            {id:1, userId:1, userEmail:'a@example.com', productName: 'Product A'}
        ]);
        mockNotificationUpdateMany.mockResolvedValue({});
        await sendPromoEmailsHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({emailedCount:1});
    })

    it('returns 500 when the job throws', async()=>{
        mockNotificationFindMany.mockRejectedValue(new Error('Database Connection Lost'));
        await sendPromoEmailsHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: expect.any(String)}));
    })
})