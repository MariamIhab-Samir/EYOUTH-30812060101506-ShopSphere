import React from 'react';
import{render, screen, waitFor} from '@testing-library/react';
import {QueryClientProvider, QueryClient} from '@tanstack/react-query';
import{http, HttpResponse} from 'msw';
import{server} from '../mocks/server';
import ProductList from '../components/productList';
import { MemoryRouter } from 'react-router-dom';

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

describe('Network Latency and Timeout Resiliency', ()=>{
    it('Should display a connection timeout fallback notice when the API hangs', async()=>{
        server.use(
            http.get('http://localhost:5000/api/products', async()=>{
                await new Promise((resolve)=> setTimeout(resolve, 3000));
                return HttpResponse.json([]);
            })
        );

        renderProductList();

        await waitFor(()=>{
            expect(screen.getByText(/Connection timed out. Please check your network connection/i)).toBeInTheDocument();
        }, {timeout:4000})
    });
});