import React from 'react';
import {useNavigate} from 'react-router-dom';
import {useCart} from '../context/cartContext';
import PageLayout from '../components/pageLayout';

export default function Cart({}){
    const navigate=useNavigate();
    const{cartItems, updateQuantity, removeItem, totalCost, clearCart}=useCart();
    const handleCheckout=()=>{
        if(cartItems.length===0) return;

        const rawHistory=localStorage.getItem('order_history');
        const existingHistory=rawHistory?JSON.parse(rawHistory): [];

        const totalItemsCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const newOrder ={
            orderHash:`ORD-${Date.now().toString().slice(-6)}`,
            orderId: `ORD-${Date.now()}`,
            timestamp: new Date().toISOString(),
            itemCount: totalItemsCount,
            items: cartItems,
            total: totalCost,
            status: 'Success'
        };

        const updatedHistory=[newOrder, ...existingHistory];

        localStorage.setItem('order_history', JSON.stringify([...existingHistory, newOrder]));
        clearCart();

        navigate('/orderHistory')
    }
    return(
        <PageLayout>
        <div style={cartStyles.container}>
            <h2 style={cartStyles.title}>🛒 Active Session Cart</h2>
            <button
            onClick={()=> navigate('/home')}
            style={cartStyles.continueBtn}>
                + Add More Items
            </button>

            {cartItems.length === 0 ? (
                <p style={cartStyles.emptyMsg}>Your cart is currently empty. Allocate items from the catalog</p>
            ):(
                <div>
                    <div style={cartStyles.tableWrapper}>
                        {cartItems.map((item)=>(
                            <div key={item.id} style={cartStyles.row}>
                                <div style={cartStyles.infoCol}>
                                    <span style={cartStyles.itemName}>{item.name}</span>
                                    <span style={cartStyles.itemPrice}>${item.price}</span>
                                </div>
                            <div style={cartStyles.controlCol}>
                                <div style={cartStyles.qtyStepper}>
                                    <button
                                        onClick={()=> updateQuantity(item.id, (item.quantity || 1) -1)}
                                        disabled={(item.quantity || 1)<=1}
                                        style={cartStyles.qtyBtn}>
                                            -
                                    </button>
                                    <span style={cartStyles.qtyDisplay}>{item.quantity || 1}</span>
                                    <button
                                    onClick={()=> updateQuantity(item.id, (item.quantity || 1) + 1)}
                                    style={cartStyles.qtyBtn}>
                                        +
                                    </button>
                                </div>
                            <button
                                onClick={()=> removeItem(item.id)}
                                style={cartStyles.binBtn}
                                title='Purge item from session'
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
        </div>

        <div style={cartStyles.summaryPanel}>
            <div style={cartStyles.totalRow}>
                <span>System Subtotal:</span>
                <span style={cartStyles.totalPrice}>${totalCost}</span>
            </div>
            <button
                onClick={handleCheckout} style={cartStyles.checkoutBtn}>
                    Confirm order and Log History
                </button>
            </div>
        </div>
            )}
        </div>
        </PageLayout>
    );
};

const cartStyles ={
    container:{
        backgroundColor:'#110c26',
        paddding:'24px',
        borderRadius:'8px',
        border:'1px solid #3a2855',
        color:'#415166'
    },
    title:{
        color:'#4a375e',
        marginTop: 0,
        marginBottom:'20px',
        fontSize:'18px'
    },
    emptyMsg:{
        color:'#94a3b8',
        fontSize: '14px',
        margin: 0
    },
    tableWrapper:{
        display:'flex',
        flexDirection:'column',
        gap:'12px'
    },
    row:{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        backgroundColor:'#1e1b4b',
        padding:'14px',
        borderRadius:'6px',
        borderLeft:'4px solid #3e246a'
    },
    infoCol:{
        display:'flex',
        flexDirection:'column',
        gap:'4px'
    },
    itemName:{
        fontWeight:'bold',
        fontSize:'15px',
        color: '#661313'
    },
    itemPrice:{
        fontSize:'13px',
        color:'#3d2e6a'
    },
    controlCol:{
        display:'flex',
        alignItems:'center',
        gap:'16px'
    },
    qtyStepper:{
        display:'flex',
        alignItems:'center',
        gap:'8px',
        backgroundColor:'#0f172a',
        padding:'4px',
        borderRadius:'4px',
        border:'1px solid #383043'
    },
    qtyBtn:{
        backgroundColor: '#50048a',
        color:'#552323',
        border:'none',
        padding:'4px 10px',
        borderRadius:'4px',
        cursor:'pointer',
        fontWeight:'bold'
    },
    qtyDisplay:{
        width:'24px',
        textAlign:'center',
        fontSize:'14px',
        color:'#602323'
    },
    binBtn:{
        backgroundColor:'transparent',
        color:'#3d0f0f',
        border:'none',
        padding:'8px',
        borderRadius:'4px',
        cursor:'pointer',
        fontSize:'16px',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        transition:'transform 0.1s ease, background-color 0.2s',
        ':hover':{
            backgroundColor:'#ffffff10'
        }
    },
    summaryPanel:{
        marginTop: '24px',
        borderTop:'1px solid #34244b',
        padding:'20px',
        display:'flex',
        flexDirection:'column',
        alignItems:'flex-end',
        gap:'12px'
    },
    totalRow:{
        display:'flex',
        gap:'24px',
        fontSize:'16px',
        fontWeight:'bold'
    },
    totalPrice:{
        color:'#49375a'
    },
    checkoutBtn:{
        backgroundColor:'#1a3a30',
        color:'#5a3434',
        border:'none',
        padding:'12px 24px',
        borderRadius:'4px',
        fontWeight:'bold',
        cursor:'pointer',
        transition:'all 0.2s'
    },
    continueBtn:{
        backgroundColor:'#25044e',
        color:'#051a6b',
        border:'none',
        padding:'12px 24px',
        borderRadius:'4px',
        fontWeight:'bold',
        cursor:'pointer',
        transition:'all 0.2s'
    }
};