import React from 'react';
import{render, screen} from '@testing-library/react';
import ProductComments from '../pages/comment';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import {useComments, useAddComment} from '../hooks/useComments';

jest.mock('../hooks/useComments');
jest.mock('../components/pageLayout', ()=>({children})=> <div>{children}</div>);
jest.mock('../components/starDisplay', ()=>({rating})=> <div>{'★'}.repeat{(rating)}</div>);

const renderComments=(state)=>render(
    <MemoryRouter initialEntries={[{pathname:'/comment/5', state}]}>
        <Routes>
            <Route path='/comment/:productId' element={<ProductComments/>}></Route>
        </Routes>
    </MemoryRouter>
);

describe('ProductComments', ()=>{
    beforeEach(()=>jest.clearAllMocks());

    it('renders existing reviews with user and text', ()=>{
        useComments.mockReturnValue({
            data:[{id:1, user:'Alice', rating:5, text:'Great phone'}],
            isLoading:false, isError:false
        });
        useAddComment.mockReturnValue({mutate:jest.fn(), isPending:false, isError:false});
        renderComments();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Great phone')).toBeInTheDocument();
    });

    it('submits a new review with the selected star rating and comment text', async()=>{
        const mutate=jest.fn();
        useComments.mockReturnValue({data:[], isLoading:false, isError:false});
        useAddComment.mockReturnValue({mutate, isPending:false, isError:false});
        renderComments();

        await userEvent.click(screen.getAllByText('★')[3]);
        await userEvent.type(screen.getByPlaceholderText(/enter your product review data/i), 'Solid upgrade');
        await userEvent.click(screen.getByRole('button', {name:/commit entry/i}));

        expect(mutate).toHaveBeenCalledWith(
            {text:'Solid upgrade', rating:4},
            expect.any(Object)
        );
    })

    it('does not submit when the comment text is blank', async()=>{
        const mutate=jest.fn();
        useComments.mockReturnValue({data:[], isLoading:false, isError:false});
        useAddComment.mockReturnValue({mutate, isPending:false, isError:false});
        renderComments();

        await userEvent.click(screen.getByRole('button', {name:/commit entry/i}));
        expect(mutate).not.toHaveBeenCalled();
    })
})