import React from 'react';
import{render, screen} from '@testing-library/react';
import OrderHistory from '../pages/orderHistory';
import { MemoryRouter } from 'react-router-dom';

beforeEach(()=> localStorage.clear());

describe('OrderHistory', ()=>{
    it('renders orders passed directly as a prop, including their item breakdown', ()=>{
        const orders=[{
            id:'order-1', orderHash:'A1B2C3', timestamp:'2026-07-05 14:30',
            total:900, status:'Dispatched',
            items:[{id:'1', name:'Green Iphone 17', quantity:1, price:900}]
        }];
        render(<MemoryRouter><OrderHistory orders={orders}></OrderHistory></MemoryRouter>);
        expect(screen.getByText('2026-07-05 14:30')).toBeInTheDocument();
        expect(screen.getByText('$900')).toBeInTheDocument();
        expect(screen.getByText('Dispatched')).toBeInTheDocument();
        expect(screen.getByText(/Green Iphone 17/)).toBeInTheDocument();
        expect(screen.getByText(/1 x \$900/)).toBeInTheDocument();
    });

    it('falls back to reading order history from localStorage when no prop is provided', ()=>{
        const stored=[{id:'order-3', orderHash:'Z9Y8', timestamp:'2026-07-04', total:300, status:'Pending', items:[]}];
        localStorage.setItem('order_history', JSON.stringify(stored));
        render(<MemoryRouter><OrderHistory/></MemoryRouter>);
        expect(screen.getByText('#Z9Y8')).toBeInTheDocument();
    });
})