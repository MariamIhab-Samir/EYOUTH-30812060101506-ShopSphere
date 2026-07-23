import React from 'react';

export default function SearchBar({value, onChange}) {
    return(
        <div style={searchStyles.wrapper}>
            <input
            type='text'
            value={value}
            placeholder='Search global systems grid'
            style={searchStyles.input}
            onChange={(e)=>onChange(e.target.value)}>
            </input>
        </div>
    )
};

const searchStyles={
    wrapper:{
        display: 'flex',
        flex: 1,
        maxWidth: '400px'
    },

    input:{
        width:'100%',
        backgroundColor:'#0f172a',
        border: '1px solid #541e80',
        borderRadius: '6px',
        color: '#6f4343',
        outline:'none',
        fontSize:'14px'
    }
};