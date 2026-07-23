import React from 'react';
import{render, screen} from '@testing-library/react';
import{MemoryRouter} from 'react-router-dom';
import userEvent from '@testing-library/user-event'
import ProductCard from '../components/productCard';

const mockProduct={
    id:1, name:'Green Iphone 17', category:'Iphones', price: 800, rating:4, reviewCount:2
};

describe('ProductCard', ()=>{
    it('renders product info and triggers onAddToCart without navigating', async()=>{
        const onAddToCart=jest.fn();
        render(
            <MemoryRouter initialEntries={['/home']}>
                <ProductCard product={mockProduct} onAddToCart={onAddToCart} onViewReviews={()=>{}}></ProductCard>
            </MemoryRouter>
        );

        expect(screen.getByText('Green Iphone 17')).toBeInTheDocument();
        expect(screen.getByText('$800')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', {name:/add/i}))
        expect(onAddToCart).toHaveBeenCalledWith(1);
    });

    it('shows admin edit/delete controls only on the admin route', ()=>{
        const{unmount}=render(
            <MemoryRouter initialEntries={['/home']}>
                <ProductCard product={mockProduct} onAddToCart={()=>{}} onViewReviews={()=>{}}></ProductCard>
            </MemoryRouter>
        );
        expect(screen.queryByTitle('Edit product parameters')).not.toBeInTheDocument();
        unmount();
        render(
            <MemoryRouter initialEntries={['/adminTab']}>
                <ProductCard product={mockProduct} onAddToCart={()=>{}}
                onViewReviews={()=>{}} onEditProduct={()=>{}} onDeleteProduct={()=>{}}></ProductCard>
            </MemoryRouter>
        );
        expect(screen.getByTitle('Edit product parameters')).toBeInTheDocument();
    })
})