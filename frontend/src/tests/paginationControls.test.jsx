import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaginationControls from '../components/pagination';

it('renders the correct number of page buttons and calls onPageChange', async()=>{
    const onPageChange=jest.fn();
    render(
        <PaginationControls totalItems={25} take={10} skip={0}
        onPageChange={onPageChange} onTakeChange={()=>{}} onSkipChangw={()=>{}}></PaginationControls>
    )
    expect(screen.getAllByRole('button')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', {name:'2'}));
    expect(onPageChange).toHaveBeenCalledWith(10);
})