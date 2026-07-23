import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import axios from '../api/axios';

async function fetchComments(productId){
    const{data}=await axios.get(`/products/${productId}/comments`);
    return data;
}

export function useComments(productId){
    return useQuery({
        queryKey:['comments', productId],
        queryFn:()=> fetchComments(productId),
        enabled: !!productId
    });
}

export function useAddComment(productId){
    const queryClient=useQueryClient();

    return useMutation({
        mutationFn: async (payload)=>{
            const{data}=await axios.post(`/products/${productId}/comments`, payload);
            return data;
        },
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:['comments', productId]});
            queryClient.invalidateQueries({queryKey:['products']});
        }
    });
};