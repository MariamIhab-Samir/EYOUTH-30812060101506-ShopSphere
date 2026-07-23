import React from 'react';
import{render, screen} from '@testing-library/react';
import{userEvent} from '@testing-library/user-event'
import{MemoryRouter} from 'react-router-dom';
import { AuthProvider } from '../context/authContext';
import LogoutButton from '../components/logoutButton';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('LogoutButton', ()=>{
    beforeEach(()=>{
        localStorage.setItem('token', 'fake-token');
        localStorage.setItem('role', 'USER' || 'ADMIN');
        localStorage.setItem('user', JSON.stringify({name:'Test'}))
    });

    it('clears auth storage and redirects to /login on click', async()=>{
        const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/profile']}>
                    <AuthProvider>
                        <LogoutButton/>
                    </AuthProvider>
                </MemoryRouter>
            </QueryClientProvider>
        );

        await userEvent.click(screen.getByRole('button', {name: /logout/i}));

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('role')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    })
})