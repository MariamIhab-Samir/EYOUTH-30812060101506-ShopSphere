import React from 'react';
import{useNavigate} from 'react-router-dom';

export default function BottomNavbar () {
    const navigate=useNavigate();
    return (
        <div style={bottomNavStyle}>
            <span style={navItemStyle} onClick={()=> navigate('/cart')}>Cart</span>
            <span style={navItemStyle} onClick={()=> navigate('/orderHistory')}>Order History</span>
            <span style={navItemStyle} onClick={()=> navigate('/coupons')}>Coupons</span>
            <span style={navItemStyle} onClick={()=> navigate('/profile')}>Profile</span>
        </div>
    )
}

const bottomNavStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '12px 0',
    backgroundColor: '#0a0730',
    borderTop: '2px solid #3e1975',
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    zIndex: 100
}

const navItemStyle = {
    color: '#7e2db7',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center'
}