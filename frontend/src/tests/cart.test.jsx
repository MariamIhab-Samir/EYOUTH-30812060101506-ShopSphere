import React from 'react';
import{render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Cart from '../pages/cart'
import {useCart} from '../context/cartContext';

jest.mock('../context/cartContext');
jest.mock('../components/pageLayout', ()=>({children})=> <div>{children}</div>);
jest.mock('../api/axios', ()=> ({
    post: jest.fn().mockResolvedValue({data:{success:true}})
}));

const mockNavigate=jest.fn();
jest.mock('react-router-dom', ()=>({
    ...jest.requireActual('react-router-dom'),
    useNavigate:()=> mockNavigate
}));

const renderWithClient=(ui)=>{
    const queryClient=new QueryClient({
        defaultOptions:{queries:{retry:false}}
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{ui}</MemoryRouter>
        </QueryClientProvider>
    )
}

describe('Cart', ()=>{
    beforeEach(()=> jest.clearAllMocks());

    it('shows the empty cart message when there are no items', ()=>{
        useCart.mockReturnValue({
            cartItems:[], updateQuantity:jest.fn(), removeItem: jest.fn(),
            totalCost: 0
        });
        renderWithClient(<Cart/>);
        expect(screen.getByText(/currently empty/i)).toBeInTheDocument();
    });

    it('renders cart items with name, price and quantity', ()=>{
        useCart.mockReturnValue({
            cartItems:[{
                id: 5, cartItemId:1, name:'Black Iphone 17', 
                price:800, quantity: 2, stock:15
            }],
            updateQuantity:jest.fn(), removeItem: jest.fn(),
            totalCost:1600
        });

        renderWithClient(<Cart/>);
        expect(screen.getByText('Black Iphone 17')).toBeInTheDocument();
        expect(screen.getByText('$800')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('$1600')).toBeInTheDocument();
    })

    it('calls updateQuantity with cartItemId when the + button is clicked', async()=>{
        const updateQuantity=jest.fn().mockResolvedValue({success:true});
        useCart.mockReturnValue({
            cartItems:[{
                id:5, cartItemId:1, name:'Black Iphone 17',
                price:800, quantity:2, stock:15
            }],
            updateQuantity, removeItem: jest.fn(),
            totalCost:1600
        });

        renderWithClient(<Cart/>);
        await userEvent.click(screen.getByText('+'))
        expect(updateQuantity).toHaveBeenCalledWith(1,3);
    })

    it('calls updateQuantity with cartItemId when the - button is clicked', async()=>{
        const updateQuantity=jest.fn().mockResolvedValue({success:true});
        useCart.mockReturnValue({
            cartItems:[{
                id:5, cartItemId:1, name:'Black Iphone 17',
                price:800, quantity:2, stock:15
            }],
            updateQuantity, removeItem: jest.fn(),
            totalCost:1600
        });

        renderWithClient(<Cart/>);
        await userEvent.click(screen.getByText('-'))
        expect(updateQuantity).toHaveBeenCalledWith(1,1);
    });

    it('calls removeItem with cartItemId when the bin button is clicked', async()=>{
        const removeItem=jest.fn().mockResolvedValue({success:true});
        useCart.mockReturnValue({
            cartItems:[{
                id:5, cartItemId:1, name:'Black Iphone 17',
                price:800, quantity:2, stock:15
            }],
            updateQuantity:jest.fn(), removeItem,
            totalCost:1600
        });
        renderWithClient(<Cart/>);
        await userEvent.click(screen.getByTitle(/purge item/i))
        expect(removeItem).toHaveBeenCalledWith(1);
    })

    it('calls checkout, clears the cart and navigates to order history on success', async()=>{
        const clearCart=jest.fn();
        useCart.mockReturnValue({
            cartItems:[{
                id:5, cartItemId:1, name:'Black Iphone 17',
                price:800, quantity:2, stock:15
            }],
           updateQuantity:jest.fn(), removeItem:jest.fn(),
            totalCost:1600, clearCart
        });
        renderWithClient(<Cart/>);
        await userEvent.click(screen.getByText(/Confirm Order/i))
        expect(clearCart).toHaveBeenCalledWith();
        expect(mockNavigate).toHaveBeenCalledWith('/orderHistory')
    })
})