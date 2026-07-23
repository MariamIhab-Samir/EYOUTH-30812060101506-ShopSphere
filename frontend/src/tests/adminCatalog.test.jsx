import React from 'react';
import{render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import{http, HttpResponse} from 'msw';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider} from '../context/authContext';
import{server} from '../mocks/server';
import Home from '../pages/home';
import{MemoryRouter} from 'react-router-dom';
import {CartProvider} from '../context/cartContext'

const renderAdminHome=()=>{
    const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
     return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/adminTab']}>
                <AuthProvider>
                    <CartProvider>
                        <Home></Home>
                    </CartProvider>
                </AuthProvider>
            </MemoryRouter>
        </QueryClientProvider>
        );
    };
describe('Admin Management Operations & Authorization Matrix', ()=>{

    const initialProducts= [
        {id: '101', name: 'Green Iphone 17', price: 800, category:'Iphones', stock:5}
    ];

        beforeEach(()=>{
        server.use(
            http.get('http://localhost:5000/api/products', () => {
                return HttpResponse.json(initialProducts, {status:200});
            })
        )
    });

    it('Should block product creation and render an explicit error message if user recieves a 403 Forbidden', async()=>{
        server.use(
            http.post('http://localhost:5000/api/admin/products', ()=>{
                return HttpResponse.json(
                    {error: 'Access Denied: Administration priveleges required'},
                    {status: 403}
                );
            })
        );

        renderAdminHome();

        await userEvent.click(await screen.findByRole('button', {name: /^\+ add product$/i}));
        await userEvent.type(screen.getByLabelText(/product name/i), 'New Product');
        await userEvent.type(screen.getByLabelText(/^price \*$/i), '800');
        await userEvent.type(screen.getByLabelText(/^stock \*$/i), '10');
        const file=new File(['dummy'], 'spec_sheet.png', {type:'image/png'});
        await userEvent.upload(screen.getByLabelText(/product image/i), file);
        await userEvent.click(await screen.findByRole('button', {name: 'Add Product'}));

        await waitFor(()=>{
            expect(screen.getByText(/access denied: administration priveleges required/i)).toBeInTheDocument();
        });
    });

    it('Should reject modification attempts and preserve view boundaries on a 403 Fobidden response', async()=>{
        server.use(
            http.put('http://localhost:5000/api/admin/products/101', ()=>{
                return HttpResponse.json(
                    {error: 'Action Forbidden: Unauthorized modification attempt'},
                    {status:403}
                );
            })
        );
        renderAdminHome();
        
        await screen.findByText('Green Iphone 17');

        await userEvent.click(screen.getByTitle('Edit product parameters'));

        const nameInput=screen.getByLabelText(/product name/i);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Malicious Mutation');
        await userEvent.click(screen.getByRole('button', {name: /save changes/i}));

        await waitFor(()=>{
            expect(screen.getByText(/action forbidden: unauthorized modification attempt/i)).toBeInTheDocument();
        });
    });
    
    it('Should execute product update with a multi-part file binary payload', async ()=>{
        server.use(
            http.put('http://localhost:5000/api/admin/products/101', async({request})=>{
                const formData=await request.formData();
                const image=formData.get('productImage');

                if(!image || image.name!=='spec_sheet.png'){
                    return HttpResponse.json({error:'You need to upload a pic for your to-be uploaded product'}, {status: 400});
                }

                return HttpResponse.json({
                    success:true, product:{id:'101', name:'Green Iphone 17', price:900}},
                    {status: 200}
                )
            })
        );

        renderAdminHome();
        await screen.findByText('Green Iphone 17');
        await userEvent.click(screen.getByTitle('Edit product parameters'))

        const nameInput=screen.getByLabelText(/product name/i);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Modified Product');

        await userEvent.click(screen.getByRole('button', {name: /save changes/i}));

        await waitFor(()=>{
            expect(screen.getByText(/You need to upload a pic for your to-be uploaded product/i)).toBeInTheDocument();
        });
    });

    it('Should process deletion commands and remove items from the view tier', async()=>{
        let products=[...initialProducts]
        server.use(
            http.get('http://localhost:5000/api/products',()=>{
                return HttpResponse.json(products, {status: 200});
            }),
            http.delete('http://localhost:5000/api/admin/products/101', ()=>{
                products=products.filter(p=>p.id!=='101');
                return HttpResponse.json({success:true}, {status: 200});
            })
        );

        window.confirm = jest.fn(()=> true);
        renderAdminHome();

        await screen.findByText('Green Iphone 17');

        await userEvent.click(screen.getByTitle('Remove product entry from catalog'));

        await waitFor(()=>{
            expect(screen.queryByText('Green Iphone 17')).not.toBeInTheDocument();
            
        });
    });
});