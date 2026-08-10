import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import api from '../api/axios';
import PageLayout from '../components/pageLayout';

export default function Coupons(){
    const [activeTab, setActiveTab] = useState('codes');

    const{data: codes=[], isLoading: loadingCodes}=useQuery({
        queryKey: ['couponCodes'],
        queryFn: async()=>(await api.get('/coupons/codes')).data.coupons,
        enabled: activeTab === 'codes'
    });

    const {data: inventory=[], isLoading: loadingInventory} = useQuery({
        queryKey: ['couponInventory'],
        queryFn: async()=> (await api.get('/coupons/inventory')).data.coupons,
        enabled: activeTab === 'inventory'
    });

    return(
        <PageLayout>
            <div style={couponStyles.container}>
                <h2 style={couponStyles.title}>🎟️ Coupons</h2>
                <div style={couponStyles.card}>
                    <div style={couponStyles.toggleWrapper}>
                        <button
                            onClick={()=> setActiveTab('codes')}
                            style={{
                                ...couponStyles.toggleBtn,
                                ...(activeTab==='codes' ? couponStyles.toggleBtnActive: couponStyles.toggleBtnInactive)
                            }}>
                                Codes
                        </button>
                    </div>
                    <div style={couponStyles.toggleWrapper}>
                        <button
                            onClick={()=> setActiveTab('inventory')}
                            style={{
                                ...couponStyles.toggleBtn,
                                ...(activeTab==='inventory' ? couponStyles.toggleBtnActive: couponStyles.toggleBtnInactive)
                            }}>
                                Inventory
                        </button>
                    </div>
                    <div style={couponStyles.tableWrapper}>
                        {activeTab === 'codes' && (
                            loadingCodes ? (
                                <p style={couponStyles.emptyMsg}>Loading coupon codes...</p>
                            ):(
                                <span>
                                    {codes.map((coupon)=>(
                                        <div key={coupon.code} style={couponStyles.row}>
                                            <span style={couponStyles.code}>{coupon.code}({coupon.discountPercent}%)</span>
                                            <span style={couponStyles.discount}>{coupon.discountPercent}% Off</span>
                                        </div>
                                    ))}
                                    <p style={couponStyles.note}>Each coupon can be used once per account.</p>
                                </span>
                            )
                        )}

                        {activeTab === 'inventory' && (
                            loadingInventory ? (
                                <p style={couponStyles.emptyMsg}>Loading inventory...</p>
                            ):(
                                <div>
                                    {inventory.map((coupon)=>(
                                        <div key={coupon.code} style={couponStyles.row}>
                                            <span style={couponStyles.code}>{coupon.code}({coupon.discountPercent}%)</span>
                                            <span style={{
                                                ...couponStyles.stock,
                                                color: coupon.stock>0?'#426d52': '#763131'
                                            }}>
                                                {coupon.stock>0? `${coupon.stock} left`: 'Out of stock'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}

const couponStyles={
    container:{
        maxWidth:'600px',
        margin: '20px auto',
        padding: '0 20px 80px'
    },
    title:{
        color: '#5c298b',
        marginBottom: '16px',
        fontSize: '18px'
    },
    card:{
        backgroundColor: '#51366d',
        padding: '40px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 4px 15px rgba(112, 43, 109, 0.3)'
    },
    toggleWrapper:{
        display: 'grid',
        backgroundColor:'#3b2554',
        borderRadius:'8px',
        padding:'4px',
        marginBottom: '20px',
        gap: '4px'
    },
    toggleBtn:{
        flex: 1,
        backgroundColor: '#7c3aed',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 0',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'all 0.2s'
    },
    toggleBtnActive:{
        flex:1,
        padding:'10px',
        backgroundColor:'#7c3aed',
        color:'#653e3e',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor:'pointer',
        transition:'all 0.2s ease'
    },
    toggleBtnInactive:{
        flex: 1,
        padding: '10px',
        backgroundColor: 'transparent',
        color: '#a78bfa',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition:'all 0.2 ease'
    },
    tableWrapper:{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    emptyMsg:{
        color: '#89189f',
        fontSize: '16px'
    },
    row:{
        display: 'flex',
        padding: '14px',
        borderRadius: '6px',
        borderLeft: '4px solid #7d3f87',
        backgroundColor: '#4b2052',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    code:{
        fontFamily:'monospace',
        fontSize:'15px',
        color:'#746b99',
        fontWeight: 'bold'
    },
    discount:{
        color:'#497359',
        fontWeight:'bold'
    },
    stock:{
        fontWeight:'bold',
        fontSize:'14px'
    },
    note:{
        color:'#94a3b8',
        fontSize: '13px',
        marginTop: '6px'
    }
}