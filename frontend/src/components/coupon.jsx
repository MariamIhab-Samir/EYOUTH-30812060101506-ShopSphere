import {useState} from 'react';
import api from '../api/axios';

export default function Coupon({onApply}){
    const [code, setCode]=useState('');
    const [status, setStatus]=useState(null);
    const [message, setMessage]=useState('');

    const handleApply=async()=>{
        if(!code.trim()) return;
        setStatus('checking');
        setMessage('');
        try{
            const res=await api.post('/coupons/validate', {code: code.trim()});
            setStatus('valid');
            setMessage(`Coupon applied: ${res.data.discount}% off `);
            onApply({code: res.data.code, discount:res.data.discount});
            setTimeout(()=>setMessage(''), 3000)
        }catch(err){
            setStatus('invalid');
            setMessage(err.response?.data?.error || 'Invalid coupon');
            onApply(null);
            setTimeout(()=>setMessage(''), 3000)
        }
    }
    return(
        <div style={couponStyles.container}>
            <div style={couponStyles.inputRow}>
            <input
            type='text' placeholder='Coupon code' value={code}
            onChange={(e)=>setCode(e.target.value)}>
            </input>
            <button onClick={handleApply} disabled={status==='checking'}
                style={{...couponStyles.applyBtn, opacity: status==='checking'? 0.6:1}}>
            {status === 'checking' ? 'Checking...':'Apply'}</button>
            </div>
            {message && (<p style={status === 'valid'? couponStyles.successMsg:couponStyles.errorMsg }>
                {message}
            </p>)}
        </div>
    )
}

const couponStyles={
    container:{
        display:'flex',
        flexDirection:'column',
        gap:'8px',
        backgroundColor:'#1e1b4b',
        padding:'14px',
        borderRadius:'6px',
        borderLeft:'4px solid #3e246a',
        marginTop:'12px'
    },
    inputRow:{
        display:'flex',
        gap:'8px'
    },
    input:{
        backgroundColor: '#544470',
        borderRadius:'4px',
        color: '#521f1f',
        padding:'8px 10px',
        fontSize:'14px',
        border: '1px solid #4c1d95',
        outline: 'none', 
    },
    applyBtn:{
        backgroundColor: '#7c3aed',
        border: 'none',
        borderRadius: '4px',
        color: '#4c2121',
        padding: '8px 10px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    successMsg:{
        color:'#206641',
        fontSize:'13px',
        margin:0
    },
    errorMsg:{
        color:'#633128',
        fontSize:'13px',
        margin:0
    }
}