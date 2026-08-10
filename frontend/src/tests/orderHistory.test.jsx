import React from 'react';
import{render, screen} from '@testing-library/react';
import OrderHistory from '../pages/orderHistory';
import { MemoryRouter } from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useOrders} from '../hooks/useOrders';

jest.mock('../hooks/useOrders');
jest.mock('../components/pageLayout', ()=>({children})=> <div>{children}</div>);

const renderWithClient=(ui)=>{
    const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
    return render(<QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

beforeEach(()=>jest.clearAllMocks());
describe('OrderHistory', ()=>{
    it('renders orders passed directly as a prop, including their item breakdown', ()=>{
        useOrders.mockReturnValue({    
            data:[{
                id:'order-1', createdAt:'2026-07-05 14:30',
                totalPrice:900, status:'SUCCESS',
                items:[{id:'1', quantity:1,product:{name:'Green Iphone 17', price:900}}]
            }],
            isLoading:false, isError:false
        });
        renderWithClient(<OrderHistory/>);
        //expect(screen.getByText('$900')).toBeInTheDocument();
        const totals= screen.getAllByText((content, element)=>
            element.textContent.replace(/\s/g, '')==='$900.00'
        );
        expect(totals.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('SUCCESS')).toBeInTheDocument();
        expect(screen.getByText(/Green Iphone 17/)).toBeInTheDocument();
        expect(screen.getByText(/1 x \$900/)).toBeInTheDocument();
    });

    it('shows an empty state message when there are no orders', ()=>{
        useOrders.mockReturnValue({data:[], isLoading:false, isError:false});
        renderWithClient(<OrderHistory/>);
        expect(screen.getByText(/No past transactions/i)).toBeInTheDocument();
    });

    it('shows an error message when the order request fails', ()=>{
        useOrders.mockReturnValue({data:null, isLoading:false, isError:true});
        renderWithClient(<OrderHistory/>);
        expect(screen.getByText(/Unable to load order history/i)).toBeInTheDocument();
    })
});