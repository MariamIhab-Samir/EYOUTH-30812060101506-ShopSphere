import React from 'react';
import{render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Signup from '../pages/signup';
import {MemoryRouter} from 'react-router-dom';
import{AuthProvider} from '../context/authContext';
import {server} from '../mocks/server';
import {handlers} from '../mocks/handlers';
import{http, HttpResponse} from 'msw';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
server.use(
    http.post('http://localhost:5000/api/signup', ()=>{
        return HttpResponse.json({success:true, message:'User registered successfully'}, {status:200});
    })
);

async function fillCommonFields({password= 'securePassword123', age='17', email='newuser@example.com'}={}){
    await userEvent.type(screen.getByLabelText(/name/i), 'Mariam Fahim');
    await userEvent.type(screen.getByLabelText(/email/i), email);
    await userEvent.type(screen.getByLabelText('Password'), password);
    await userEvent.type(screen.getByLabelText(/confirm password/i), password);
    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'Female')
    await userEvent.type(screen.getByLabelText(/age/i), age);
}

describe('Frontend Signup Component Verification', ()=>{
    beforeEach(()=>{
        global.fetch =jest.fn();
        render(<QueryClientProvider client={queryClient}><MemoryRouter><AuthProvider><Signup/></AuthProvider></MemoryRouter></QueryClientProvider>)
    });
    afterEach(()=>{
        jest.resetAllMocks();
    });
    it('completes a valid registration and flash a success message', async()=>{
        global.fetch.mockResolvedValueOnce({
            ok:true,
            json: async()=>({success:true, message: 'User registered successfully', token:'mock-jwt-token-xyz',
                user:{id:1, email:'newuser@example.com', role:'USER'}
            })
        })
        await fillCommonFields({email:'newuser@example.com'});
        await userEvent.click(screen.getByRole('button', {name:/sign up/i}));
        
        expect(await screen.findByText(/user registered successfully|account created successfully/i)).toBeInTheDocument();
        
    });

    it('surfaces a validation warning for a short password', async()=>{
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async()=>({error: 'Password must be at least 6 characters long'})
        })
        await fillCommonFields({password: '123'});
        await userEvent.click(screen.getByRole('button', {name: /sign up/i}));

        expect(await screen.findByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
        
    });

    it('blocks registration when the email already exists', async()=>{
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async()=>({error: 'An account with this email already exists'})
        })
        await fillCommonFields({email:'existing@example.com'});
        await userEvent.click(screen.getByRole('button', {name: /sign up/i}));


        expect(await screen.findByText(/an account with this email already exists/i)).toBeInTheDocument();
    });

    it('blocks user registration when age is under 16', async()=>{
        await fillCommonFields({email:'younguser@example.com', age:'15'});
        await userEvent.click(screen.getByRole('button', {name: /sign up/i}));

        expect(await screen.findByText(/you must be at least 16 years old/i)).toBeInTheDocument();
    });

    it('rejects an invalid email format', async()=>{
        await fillCommonFields({email:'not-an-email-format'});
        await userEvent.click(screen.getByRole('button', {name: /sign up/i}))

        expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
    });
});