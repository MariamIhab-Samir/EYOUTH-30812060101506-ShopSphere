import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../pages/login';
import {MemoryRouter} from 'react-router-dom';
import{AuthProvider} from '../context/authContext';
import {http, HttpResponse} from 'msw';
import {server} from '../mocks/server';
import {QueryClient, QueryClientProvider } from '@tanstack/react-query';


describe('Frontend Login Workflow Lifecycle', () =>{
    const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
    it('processes valid entries, saves tokens, and updates auth status', async()=>{
        const mockPayload={
            token: 'mock-jwt-token-xyz',
            user:{id:1, email:'admin@genius.com', role:'USER'}
        }

        server.use(
            http.post('http://localhost:5000/api/login', ()=>{
                return HttpResponse.json({
                    token:'mock-jwt-token-xyz',
                    user:{id:1, email:'admin@genius.com', role: 'USER'}
                }, {status:200})
            })
        )

        render(<QueryClientProvider client={queryClient}><MemoryRouter><AuthProvider><Login/></AuthProvider></MemoryRouter></QueryClientProvider>);

        await userEvent.type(screen.getByLabelText(/email address/i), 'admin@genius.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'securePassword123');
        await userEvent.click(screen.getByRole('button', {name:'Login'}));

        await waitFor(()=>{

            expect(localStorage.getItem('token')).toBe('mock-jwt-token-xyz');
            expect(screen.getByText(/authentication successful/i)).toBeInTheDocument();
        });
    });

    it('catches invalid credentials and renders a clear error alert banner', async()=>{
        
        server.use(
            http.post('http://localhost:5000/api/login', ()=>{
                return HttpResponse.json({
                    token:'mock-jwt-token-xyz',
                    user:{id:1, email:'wrong@user.com', role: 'USER'}
                }, {status:401})
            })
        );

        render(<QueryClientProvider client={queryClient}><MemoryRouter><AuthProvider><Login /></AuthProvider></MemoryRouter></QueryClientProvider>);

        await userEvent.type(screen.getByLabelText(/email address/i), 'wrong@user.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
        await userEvent.click(screen.getByRole('button', {name:'Login'}));

        await waitFor(()=>{
            expect(screen.getByText(/invalid email or password combination/i)).toBeInTheDocument();
        });
    });
});