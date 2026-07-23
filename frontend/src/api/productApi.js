import api from './axios';

export const fetchProducts=async()=>{
    const{data}=await api.get('/products');
    return data;
}