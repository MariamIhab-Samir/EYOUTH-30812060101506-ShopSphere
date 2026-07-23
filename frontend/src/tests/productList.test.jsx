import React from 'react';
import{render,screen,waitFor} from '@testing-library/react';
import {QueryClientProvider, QueryClient} from '@tanstack/react-query';
import{http, HttpResponse} from 'msw';
import{server} from '../mocks/server';
import{MemoryRouter} from 'react-router-dom';
import ProductList from '../components/productList';

const renderProductList=()=>{
    const queryClient=new QueryClient({
        defaultOptions: {queries:{retry:false}}
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
            <ProductList></ProductList>
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe('Frontend Product Catalog Lifecycle', ()=>{
    it('Should map product collection arrays directly into the interface layout', async()=>{
        server.use(
            http.get('http://localhost:5000/api/products', ()=>{
                return HttpResponse.json([{id:1, name:'Product Alpha', price:100}], {status:200});
            })
        )
        renderProductList();
        await screen.findByText(/product alpha/i);
        expect(screen.queryByText(/no products available right now/i)).not.toBeInTheDocument();
    });

    it('Should render a fallback empty container state if the catalog array is empty', async()=>{
        server.use(
            http.get('http://localhost:5000/api/products', ()=>{
                return HttpResponse.json([], {status:200});
            })
        );

        renderProductList();

        await waitFor(()=>{
            expect(screen.getByText(/no products available right now/i)).toBeInTheDocument();
        });
    });

    it('Should render a graceful error notification during backend service failure', async()=>{
        server.use(
            http.get('http://localhost:5000/api/products', ()=>{
                return new HttpResponse(null,{status:500});
            })
        );
        renderProductList();

        await waitFor(()=>{
            expect(screen.getByText(/failed to load product catalog/i)).toBeInTheDocument();
        })
    })
})