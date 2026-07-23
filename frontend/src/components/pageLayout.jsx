import React from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import BottomNavbar from './bottomNavbar';

export default function PageLayout({children, currentView, onNavigate}){
    const navigate=useNavigate();
    const location=useLocation();

    const hideTopNav=location.pathname==='/home'|| location.pathname==='adminTab';
    
    const isAdmin= localStorage.getItem('role')==='ADMIN';
    
    const handleLogoClick=()=>{
        navigate(isAdmin? '/adminTab':'/home');
    }
    return(
        <div style={layoutStyles.container}>
            {!hideTopNav && (
                <>
                <nav
                    style={layoutStyles.nav}
                    onClick={handleLogoClick}
                    title='Return to Home'>
                    <nav style={layoutStyles.logo}>
                        Lionera
                    </nav>
                </nav>

                <main style={layoutStyles.main}>
                    {children}
                </main>

                <BottomNavbar currentView={currentView} onNavigate={onNavigate}></BottomNavbar>
                </>
            )}
        </div>
    );
}

const layoutStyles={
    container: {
        background: '#090514',
        minHeight: '100vh',
        display: 'flex',
        flexDirection:'column'
    },
    nav:{
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: '70px',
        backgroundColor: '#1e1b4b',
        borderBottom:'2px solid #4c1d95',
        position:'sticky',
        top:0,
        zIndex: 50
    },
    logo: {
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#60378a',
        transition: 'color 0.2s',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor:'pointer'
    },
    main:{
        flex:1,
        paddingBottom:'100px'
    }
}