import React from 'react';
import{render, screen, useQuery} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Coupon from '../components/coupon';
import api from '../api/axios';

jest.mock('../api/axios');

describe('Coupon', ()=>{
    beforeEach(()=>jest.clearAllMocks());

    it('applis a vaid coupon and shows the discount message', async()=>{
        api.post.mockResolvedValue({data: {code: 'SALE10', discount:10}});
        const onApply=jest.fn();
        render(<Coupon onApply={onApply}></Coupon>);

        await userEvent.type(screen.getByPlaceholderText(/coupon code/i), 'SALE10');
        await userEvent.click(screen.getByRole('button', {name:/apply/i}));

        expect(await screen.findByText(/coupon applied: 10% off/i)).toBeInTheDocument();
        expect(onApply).toHaveBeenCalledWith({code:'SALE10', discount:10})
    });

    it('shows an error message when the coupon is invalid', async()=>{
        api.post.mockResolvedValue({response: {data: {error: 'Invalid coupon'}}});
        const onApply=jest.fn();
        render(<Coupon onApply={onApply}></Coupon>);

        await userEvent.type(screen.getByPlaceholderText(/coupon code/i), 'BAD10');
        await userEvent.click(screen.getByRole('button', {name:/apply/i}));

        expect(await screen.findByText(/invalid coupon/i)).toBeInTheDocument();
        expect(onApply).toHaveBeenCalledWith(null);
    });

    it('does not call the API when the code is blank', async()=>{
        render(<Coupon onApply={jest.fn()}></Coupon>);
        await userEvent.click(screen.getByRole('button', {name:/apply/i}));
        expect(api.post).not.toHaveBeenCalled();
    });
})