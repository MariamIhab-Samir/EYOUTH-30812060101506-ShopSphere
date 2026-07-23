import React from 'react';

export default function Button({type= 'button', disabled, onClick, children, style}) {
    return(
        <button type={type} onClick={onClick} disabled={disabled} style={style || localStyle.authBtn}>
            {children}
        </button>
    )
}
const localStyle={
    authBtn:{
        backgroundColor: '#7c3aed',
        border: 'none',
        borderRadius: '4px',
        color: '#4c2121',
        padding: '6px 12px',
        cursor: 'pointer',
        fontWeight: '20px',
    }
}