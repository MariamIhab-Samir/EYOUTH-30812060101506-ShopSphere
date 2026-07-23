import React from 'react';

export default function Alert({message, style}) {
    if (!message) return null;

    return(
        <div style={style}>
            {message}
        </div>
    )
}