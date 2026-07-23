import React from 'react';
import {useNavigate} from 'react-router-dom';

export default function TopNavbar({onNavigate, onSearch, onFilter}) {
    const categories = ['All', 'Iphones', 'Samsung', 'Laptops'];
    const navigate=useNavigate();
    const isAdmin= localStorage.getItem('role')==='ADMIN';

    const handleLogoClick=()=>{
        navigate(isAdmin? '/adminTab':'/home');
    }
    return (
        <nav style={styles.topNav}>
            <div
                style={styles.logo}
                onClick={handleLogoClick}
                title='Return to Home'>
                Lionera
            </div>

            <div style={styles.categoriesContainer}>
                {categories.map((category)=>(
                    <span
                        key={category}
                        style={styles.categoryTab}
                        onClick={() => onFilter(category)}>
                            {category}
                    </span>
                ))}
            </div>

            <div style={styles.searchContainer}>
                <input
                type='text'
                placeholder='Search systems'
                style={styles.searchInput}
                onChange={(e) => onSearch(e.target.value)}></input>
                <button style={styles.filterBtn}>
                    ⚙️
                </button>
            </div>
        </nav>
    );
}

const styles ={
    topNav: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '70px',
        backgroundColor: '#1e1b4b',
        borderBottom: '2px solid #4c1d95',
        position: 'sticky',
        top: 0,
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
    searchContainer: {
        display: 'flex',
        alighItems: 'center',
        gap: '12px'
    },
    searchInput: {
        backgroundColor: '#541293',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 14px',
        color: '#4b3939',
        cursor: 'pointer'
    },
    categoriesContainer:{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        justifyContent: 'flex-start',
        padding: '10px 16px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    },
    categoryTab:{
        padding:'8px 16px',
        borderRadius: '20px',
        backgroundColor: '#2c146e',
        color: '#386555',
        border: '1px solid #383766',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
    }
};