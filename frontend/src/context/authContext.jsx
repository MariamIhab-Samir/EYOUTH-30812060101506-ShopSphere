import React, {createContext, useContext, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
const AuthContext= createContext(null);

export function AuthProvider({children}){
    const navigate=useNavigate();
    const queryClient=useQueryClient();
    const [token, setToken] = useState(()=> localStorage.getItem('token'));
    const [role, setRole] = useState(()=> localStorage.getItem('role'));
    const [user, setUser]= useState(()=>{
        const stored=localStorage.getItem('user');
        try{
            return stored? JSON.parse(stored): null;
        }catch{
            return null;
        }
    })

    const login= (newToken, newRole, newUser)=>{
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', newRole);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setRole(newRole);
        setUser(newUser);
    };

    const signup=(newToken, newRole, newUser)=>{
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', newRole);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setRole(newRole);
        setUser(newUser);
    };

    const updateUser=(updatedFields)=>{
        setUser((prev)=>{
            const merged={...prev, ...updatedFields};
            localStorage.setItem('user', JSON.stringify(merged));
            return merged;
        });
    };

    const logout=()=>{
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        setToken(null);
        setRole(null);
        setUser(null)
        navigate('/login');
    };

    return(
        <AuthContext.Provider value={{token, role, user, signup, login, logout, updateUser, isAuthenticated: !!token}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(){
        const context=useContext(AuthContext);
        if(!context){
            throw new Error('useAuth must be used within an AuthProvider');
        }
        return context;
}
