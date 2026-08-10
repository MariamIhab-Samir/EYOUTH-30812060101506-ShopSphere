import {useQuery} from '@tanstack/react-query';
import axios from '../api/axios';

async function fetchProducts(){
    const{data}=await axios.get('/products');
    return data;
}

export function useProducts(){
    return useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
        refetchInterval: 2000,
        refetchIntervalInBackground: false
    });
}