import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Coupons from '../components/couponToggle';
import {useQuery} from '@tanstack/react-query';

jest.mock('@tanstack/react-query');
jest.mock('../components/pageLayout', ()=>({children})=> <div>{children}</div>);

describe('Coupons - tab toggle', ()=>{
    beforeEach(()=>jest.clearAllMocks());

    it('shows coupon by default', async()=>{
        useQuery.mockImplementation(({queryKey})=>
        queryKey[0]==='couponCodes'
            ? {data:[{code:'SALE10', discountPercent:10, stock:3}], isLoading:false}
            : {data:[], isLoading:false}
        );
        render(<Coupons/>);
        expect(await screen.findByText(/SALE10/)).toBeInTheDocument();
    });

    it('switches to inventory and shows stock counts', async()=>{
        useQuery.mockImplementation(({queryKey})=>
            queryKey[0]==='couponInventory'
            ? {data:[{code:'SALE10', discountPercent:10, stock:3}], isLoading:false}
            : {data:[], isLoading:false}
        );
        render(<Coupons/>);
        await userEvent.click(screen.getByRole('button', {name:/inventory/i}));
        expect(await screen.findByText(/3 left/i)).toBeInTheDocument();
    });

    it('hides a coupon that has no stock left', async()=>{
        useQuery.mockImplementation(({queryKey})=>
            queryKey[0]==='couponInventory'
            ? {data:[{code:'SALE10', discountPercent:10, stock:0}], isLoading:false}
            : {data:[], isLoading:false}
        );
        render(<Coupons/>);
        await userEvent.click(screen.getByRole('button', {name:/inventory/i}));
        expect(await screen.findByText(/SALE10/i)).not.toBeInTheDocument();
    })
})