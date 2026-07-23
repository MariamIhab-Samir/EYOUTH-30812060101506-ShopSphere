import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '../components/filterBar';

it('calls onSortChange with the correct field and value', async()=>{
    const onSortChange=jest.fn();
    render(<FilterBar nameSort='none' priceSort='none' ratingSort='none' onSortChange={onSortChange}></FilterBar>)

    await userEvent.selectOptions(screen.getByLabelText(/title/i), 'asc')
    expect(onSortChange).toHaveBeenCalledWith('name', 'asc')
});
