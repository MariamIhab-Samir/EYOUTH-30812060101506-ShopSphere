const mockProductFindUnique=jest.fn();
jest.mock('@prisma/client', ()=>({
    PrismaClient: jest.fn().mockImplementation(()=>({
        product: {findUnique: mockProductFindUnique}
    }))
}));

jest.mock('../util/mailer', ()=>({
    sendEmail: jest.fn().mockResolvedValue({})
}));

const{checkAvailability}=require('../api/checkAvaliability');

describe('checkAvailability - Unit', ()=>{
    let req, res;
    beforeEach(()=>{
        mockProductFindUnique.mockReset();
        req = {method: 'GET', query: {}};
        res= {status: jest.fn().mockReturnThis(), json: jest.fn()};
    });

    it('returns 400 when productId or quantity is missing', async()=>{
        req.query={};
        mockProductFindUnique.mockResolvedValue(null);
        await checkAvailability(req, res);
        expect(res.status).toHaveBeenCalledWith(400)
    });

    it('returns 404 when the product does not exist', async()=>{
        req.query={productId: 5, quantity: 2};
        mockProductFindUnique.mockResolvedValue(null);
        await checkAvailability(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({available: false}))
    });

    it('returns available:true when stock covers the requested quantity', async()=>{
        req.query={productId: 5, quantity: 2};
        mockProductFindUnique.mockResolvedValue({id:5, stock:10});
        await checkAvailability(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({available: true, inStock:10, requested:2}));
    });

    it('returns available:false when stock is insufficient', async()=>{
        req.query={productId: 5, quantity: 20};
        mockProductFindUnique.mockResolvedValue({id:5, stock:10});
        await checkAvailability(req, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({available: false, inStock:10, requested:20}));
    });

    it('returns 500 when the lookup throws', async()=>{
        req.query={productId: 5, quantity: 20};
        mockProductFindUnique.mockRejectedValue(new Error('Databse Connection Lost'));
        await checkAvailability(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    })
})