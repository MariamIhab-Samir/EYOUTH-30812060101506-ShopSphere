import React from 'react';

export default function StarDisplay({rating}){
    const rounded=Math.round(rating);
    return(
        <div style={{display:'flex', gap:'4px', fontSize:'20px'}}>
            {[1,2,3,4,5].map(num=>(
                <span
                key={num}
                style={{
                    color:num<=rating ? '#fbbf24':'#4b5563',
                    userSelect:'none',
                    outline:'none'
                }}>
                    ★
                </span>
            ))}
        </div>
    );
};