import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import axios from '../api/axios';

async function fetchProfile(){
    const {data}=await axios.get('/profile');
    return data;
}

export function useProfile(){
    return useQuery({
        queryKey: ['profile'],
        queryFn: fetchProfile,
    })
}

export function useUpdateProfile(){
    const queryClient=useQueryClient();

    return useMutation({
        mutationFn: async (payload)=>{
            const {data}=await axios.put('/profile', payload);
            return data;
        },
        onSuccess: ()=>{
            queryClient.invalidateQueries({queryKey: ['profile']});
        }
    })
}