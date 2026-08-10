const mockCouponFindUnique=jest.fn();
jest.mock('@prisma/client', ()=> ({
    PrismaClient: jest.fn().mockImplementation(()=>({
        coupon: {findUnique: mockCouponFindUnique}
    }))
}));

jest.mock('../config/activityLog', ()=>({
    create: jest.fn().mockResolvedValue({})
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));

const {validateCoupon}=require('../api/validateCoupon');
const activityLogModal=require('../config/activityLog');
const mongoose=require('mongoose');

describe('validateCoupon - Unit', ()=>{
    let req, res;
    beforeEach(()=>{
        mockCouponFindUnique.mockReset();
        activityLogModal.create.mockReset().mockResolvedValue({});
        req={method: 'POST', body:{}};
        res={status: jest.fn().mockReturnThis(), json: jest.fn()};
    });

    afterAll(async ()=>{
        await mongoose.connection.close();
    });

    it('returns 400 when code is missing', async ()=>{
        await validateCoupon(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when the coupon does not exist', async()=>{
        req.body={code: 'GHOST10'};
        mockCouponFindUnique.mockResolvedValue(null);
        await validateCoupon(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({valid: false}));
    });

    it('returns 400 and when coupon is out of stock', async()=>{
        req.body={code: 'SALE10'};
        mockCouponFindUnique.mockResolvedValue({code: 'SALE10', stock:0, discountPercent: 10, expiresAt: new Date(null)});
        await validateCoupon(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'Coupon is out of stock'}));
    });

    it('returns 400 when the coupon has expired', async()=>{
        req.body={code: 'OLD10'};
        mockCouponFindUnique.mockResolvedValue({code: 'OLD10', stock:5, discountPercent: 10, expiresAt: new Date('2025-01-01')});
        await validateCoupon(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'Coupon has expired'}));
    });

    it('returns 200 with discount details for a valid coupon', async()=>{
        req.body={code: 'SALE10'};
        mockCouponFindUnique.mockResolvedValue({code: 'SALE10', stock:5, discountPercent: 10, expiresAt: null});
        await validateCoupon(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({valid: true, discount: 10, code: 'SALE10'});
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action: 'COUPON_VALIDATED', status:'SUCCESS', details: expect.objectContaining({httpStatus:200})})
        );
    });

    it('returns 500 when the lookup throws', async()=>{
        req.body={code: 'SALE10'};
        mockCouponFindUnique.mockRejectedValue(new Error('Database Connection Lost'));
        await validateCoupon(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(activityLogModal.create).toHaveBeenCalledWith(
            expect.objectContaining({action: 'COUPON_VALIDATED', status:'FAILURE', details: expect.objectContaining({httpStatus:500})})
        );
    })
})