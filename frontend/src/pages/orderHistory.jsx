import React from 'react';
import PageLayout from '../components/pageLayout';

export default function OrderHistory({orders: dynamicOrders}){
    const orders = dynamicOrders || (() => {
        const localData= localStorage.getItem('order_history');
        return localData ? JSON.parse(localData) : [];
    })();

    if(orders.length ===0){
        return(
            <PageLayout>
            <div style={historyStyles.container}>
                <h2 style={historyStyles.title}>Historical Transaction Logs</h2>
                    <p style={historyStyles.emptyMsg}>
                        No past transactions recorded in this system node profile.
                    </p>
                </div>
                </PageLayout>
            );
        }
            return(
                <PageLayout>
                <div style={historyStyles.container}>
                <h2 style={historyStyles.title}>Historical Transaction Logs</h2>
                <div style={historyStyles.tableWrapper}>
                    <div style={historyStyles.tableHeader}>
                        <div style={historyStyles.hashCol}>Id</div>
                        <div style={historyStyles.timestampCol}>Time</div>
                        <div style={historyStyles.priceCol}>Price</div>
                        <div style={historyStyles.statusCol}>Status</div>
                    </div>
                    {orders.map((order)=>(
                        <div key={order.id || order.orderId || order.timestamp} style={historyStyles.orderCard}>
                        <div key={order.id} style={historyStyles.tableRow}>
                            <div style={historyStyles.hashCol}>
                                #{order.orderHash}
                            </div>
                            <div style={historyStyles.timestampCol}>
                                {order.timestamp}
                            </div>
                            <div style={historyStyles.priceCol}>
                                ${order.total}
                            </div>
                            <div style={historyStyles.statusCol}>
                                <span style={{
                                    ...historyStyles.statusBadge,
                                    backgroundColor:order.status === 'Dispatched' ? '#065f46':'#7d563d',
                                    color:order.status === 'Dispatched' ? '#1e352c':'#534523'
                                }}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        {order.items && order.items.length > 0 && (
                            <div style={historyStyles.itemsBreakdown}>
                                <div style={historyStyles.breakdownTitle}> Item Manifesto Breakdown:</div>
                                {order.items.map((item,idx) =>(
                                    <div key={item.id || idx} style={historyStyles.itemDetailLine}>
                                        <span style={historyStyles.detailName}> 🟢 {item.name}</span>
                                        <span style={historyStyles.detailQtyPrice}>
                                            {item.quantity || 1} x ${item.price}
                                            <span style={{color: '#64748b'}}>(${(item.quantity||1)*item.price})</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
        </div>
    </div>
    </PageLayout>
    )
};

const historyStyles={
    container: {
        maxWidth: '900px',
        margin:'20px auto',
        padding:'0 20px'
    },
    title:{
        color: '#e9d5ff',
        marginTop: 0,
        marginBottom:'20px',
        fontSize: '16px'
    },
    emptyMsg:{
        color: '#a78bfa',
        margin: 0,
        fontSize: '16px'
    },
    tableWrapper:{
        display:'flex',
        flexDirection:'column',
        width:'100%',
        border:'1px solid #4c1d95',
        borderRadius:'6px',
        overflow:'hidden'
    },
    tableHeader:{
        overflow:'hidden',
        fontSize: '14px',
        padding: '14px 16px',
        borderRadius: '4px',
        backgroundColor: '#1d1b50',
        color: '#7865c2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    orderCard:{
        borderBottom: '1px solid #383766',
        backgroundColor: '#1e1b4b'
    },
    tableRow:{
        backgroundColor: '#2c146e',
        alignItems: 'center',
        display: 'flex',
        padding: '14px 16px',
        justifyContent: 'space-between',
        transition: 'transform 0.2s'
    },
    hashCol:{
        flex:2,
        fontFamily:'monospace',
        color:'#978161',
        fontsize:'13px'
    },
    timestampCol:{
        flex:2,
        fontFamily:'monospace',
        color:'#978161',
        fontsize:'13px'
    },
    priceCol:{
        flex:1.5,
        fontFamily:'monospace',
        color:'#978161',
        fontsize:'13px'
    },
    statusCol:{
        flex:1,
        textAlign:'right'
    },
    statusBadge:{
        padding:'4px 10px',
        borderRadius:'12px',
        fontSize:'11px',
        fontWeight:'bold',
        display:'inline-block'
    },
    itemsBreakdown:{
        fontSize: '14px',
        padding: '2px 6px',
        borderTop: '4px',
        backgroundColor: '#3a0d87',
        display: 'flex',
        justifyContent: 'space-between',
        gap:'6px',
        flexDirection: 'column'
    },
    breakdownTitle:{
        fontSize:'12px',
        color:'#4d698f',
        fontWeight:'bold',
        marginBottom:'4px'
    },
    itemDetailLine:{
        display:'flex',
        justifyContent:'space-between',
        fontSize:'14px',
        padding:'2px 0'
    },
    detailName:{
        color:'#6b7f9a'
    },
    detailQtyPrice:{
        color:'#6b7d94',
        fontFamily:'monospace'
    }
}