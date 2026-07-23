import {useMutation, useMutationState} from '@tanstack/react-query';
import api from '../api/axios';

export function useSignup(){
    return useMutation({
        mutationFn: async (payload)=> {
            const {data}=await api.post('/signup', payload);
        return data;
        }
    });
}

export function useLogin(){
    return useMutation({
        mutationFn: async({email, password, isAdminTab})=>{
            const endpoint = isAdminTab ? '/admin/login' : '/login';
            const {data}=await api.post(endpoint, {email, password, isAdminTab});
            return data;
        }
    });
}