import React from 'react';
import {useAuth} from '../context/authContext';

export default function LogoutButton({style, children}){
    const {logout}=useAuth();
    const handleLogout=()=>{
        logout();
    }

    const defaultStyle={
        backgroundColor: '#7c3aed',
        border: 'none',
        borderRadius: '4px',
        color: '#884e4e',
        padding: '10px 16px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
    
    return(
        <button onClick={handleLogout} style={style || defaultStyle}>
            {children || 'Logout'}
        </button>
    );

}