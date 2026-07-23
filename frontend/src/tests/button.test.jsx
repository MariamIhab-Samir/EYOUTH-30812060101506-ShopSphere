import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../components/button';

describe('Button', ()=>{
    it('renders children and responds to click', async()=>{
        const onClick=jest.fn();
        render(<Button onClick={onClick}>Save</Button>);
        await userEvent.click(screen.getByRole('button', {name:'Save'}));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled and unclickable when disabled prop is true', async()=>{
        const onClick=jest.fn();
        render(<Button disabled onClick={onClick}>Save</Button>);
        await userEvent.click(screen.getByRole('button',{name:'Save'}));
        expect(onClick).not.toHaveBeenCalled();
    })
})