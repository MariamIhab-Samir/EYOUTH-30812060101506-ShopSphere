import {useQuery} from '@tanstack/react-query';
import api from '../api/axios';

async function fetchOrders(){
    const{data}=await api.get('/orders');
    return data.orders;
}

export function useOrders(){
   return useQuery({
        queryKey:['orders'],
        queryFn: fetchOrders
    });
}