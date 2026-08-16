import React from 'react';
import{render, screen} from '@testing-library/react';
import ProductComments from '../pages/comment';
import { MemoryRouter} from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import {useProfile, useUpdateProfile} from '../hooks/useProfile';
import{useAuth} from '../context/authContext';
import Profile from '../pages/profile'

jest.mock('../context/authContext');
jest.mock('../hooks/useProfile');
jest.mock('../components/logoutButton', ()=> ()=> <button>Logout</button>);
jest.mock('../components/pageLayout', ()=> ({children})=> <div>{children}</div>);

const mockUser={name:'Mariam Fahim', email:'mariam@example.com', age:22, gender:'FEMALE'};
const renderProfile=()=> render(<MemoryRouter><Profile/></MemoryRouter>);

describe('Profile', ()=>{
    beforeEach(()=>{
        jest.clearAllMocks();
        useAuth.mockReturnValue({user:mockUser, updateUser:jest.fn()});
    });

    it('displays the current user info in read-only view', ()=>{
        useUpdateProfile.mockReturnValue({mutate:jest.fn(), isPending:false, isError:false});

        renderProfile();
        expect(screen.getByText('Mariam Fahim')).toBeInTheDocument();
        expect(screen.getByText('mariam@example.com')).toBeInTheDocument();
        expect(screen.getByText('Female')).toBeInTheDocument();
    });

    it('submits updated profile fields without password data when not changing password', async()=>{
        const mutate=jest.fn();
        useUpdateProfile.mockReturnValue({mutate, isPending:false, isError:false});
        renderProfile();
        await userEvent.click(screen.getByRole('button', {name:/edit profile/i}));
        
        const nameInput=screen.getByLabelText(/^name/i)
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Mariam Fahim');
        await userEvent.click(screen.getByRole('button', {name:/save changes/i}));

        expect(mutate).toHaveBeenCalledWith(
            expect.objectContaining({name:'Mariam Fahim', email:'mariam@example.com'}),
            expect.any(Object)
        );
    })

    it('includes currentPassword and newPassword only when changing password', async()=>{
        const mutate=jest.fn();
        useUpdateProfile.mockReturnValue({mutate, isPending:false, isError:false});
        renderProfile();
        await userEvent.click(screen.getByRole('button', {name:/edit profile/i}));
        
        const nameInput=screen.getByLabelText(/^name/i)
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Mariam Fahim');
        await userEvent.click(screen.getByRole('button', {name:/save changes/i}));

        expect(mutate).toHaveBeenCalledWith(
            expect.objectContaining({name:'Mariam Fahim', email:'mariam@example.com'}),
            expect.any(Object)
        );
    });
});