import React from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import {useCart} from '../context/cartContext';
import {useProducts} from '../hooks/useProducts';
import {useComments, useAddComment} from '../hooks/useComments';
import StarDisplay from '../components/starDisplay';
import PageLayout from '../components/pageLayout';

export default function ProductDetails({onAddToCart, onViewReviews}){
    const{productId}=useParams();
    const navigate=useNavigate();
    const{data:products}=useProducts();
    const {addToCart}=useCart();
    const product=products?.find(p=>p.id===parseInt(productId,10));
    if(!product) {
        return(
            <PageLayout>
                <div style={detailsStyles.errorWrapper}>
                    <p style={detailsStyles.errorText}>Product not found</p>
                </div>
            </PageLayout>
        );
    }
    
    const handleAddToCart=async()=>{
        const result=await addToCart(product);
        if(!result.success){
            alert(result.message);
            return;
        }
        navigate('/cart');
    }

    const handleViewReviews=(productId)=>{
        navigate(`/comment/${productId}`, {state:{productName: product?.name}})
    }

    const getImageUrl=(image)=>{
        if(!image) return null;
        if(image.startsWith('/uploads')){
            const baseUrl=API_URL;
            return `${baseUrl}${image}`
        }
        return image;
    }

    const location=useLocation();
    const isAdmin=location.pathname==='/adminTab'
    return(
        <PageLayout>
        <div style={detailsStyles.container}>
            <div style={detailsStyles.pageGrid}>
                <div>
                    <button onClick={()=> navigate(isAdmin ? '/adminTab': '/home')} 
                    style={detailsStyles.backBtn}>
                        ⬅️ Return to Catalog
                    </button>
                </div>
                <div style={detailsStyles.mainCard}>
                    <div style={detailsStyles.mediaGallery}>
                        <div style={detailsStyles.mainImageWrapper}>
                            <img
                            src={getImageUrl(product.image)}
                            alt={`${product.name} active look`}
                            style={detailsStyles.mainDisplayImg}></img>
                        </div>
                    </div>
                    <div style={detailsStyles.specSleeve}>
                        <h2 style={detailsStyles.title}>{product.name}</h2>
                        <span style={detailsStyles.categoryBadge}>{product.category}</span>
                        <p style={detailsStyles.description}>{product.description || 'No description available'}</p>
                        <div style={detailsStyles.metaGrid}>
                            <div style={detailsStyles.metaNode}>
                                <span style={detailsStyles.metaLabel}>Rating Index:</span>
                                <StarDisplay rating={product.rating}></StarDisplay>
                                <span style={detailsStyles.metaValue}>({product.rating || 0})</span>
                            </div>
                            <div style={detailsStyles.metaNode}>
                                <span style={detailsStyles.metaLabel}>Price</span>
                                <span style={detailsStyles.priceValue}>${product.price}</span>
                            </div>
                            <div style={detailsStyles.metaNode}>
                                <span style={detailsStyles.metaLabel}>Available Stock</span>
                                <span style={detailsStyles.metaValue}>
                                    {product.stock>0? `${product.stock} in stock`: 'Out of stock'}
                                </span>
                            </div>
                            <div style={detailsStyles.metaRow}>
                                <p style={detailsStyles.commentText}>Add and view reviews</p>
                                <span
                                    style={detailsStyles.commentLink}
                                    onClick={()=>handleViewReviews(productId)}
                                    title='View product audit logs and reviews'>
                                        💬 ({product.reviewContent || 0})
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={()=> handleAddToCart(product.id)}
                            disabled={product.stock===0}
                            style={{...detailsStyles.cartBtn, opacity: product.stock===0? 0.5:1}}>
                            {product.stock===0? 'Out of Stock' : 'Allocate Unit to Session Cart'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </PageLayout>
    )
}

const detailsStyles = {
    container: {
        maxWidth:'900px',
        margin:'20px auto',
        padding: '0 20px'
    },
    backBtn:{
        alignSelf: 'flex-start',
        backgroundColor:'#453363',
        border:'none',
        padding:'10px',
        color:'#7c3434',
        cursor:'pointer',
        borderRadius:'4px',
        fontWeight:'bold'
    },
    mainCard:{
        backgroundColor: '#1e1b4b',
        border:'1px solid #4c1d95',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s',
        flexWrap: 'wrap',
        gap:'32px',
        borderRadius: '8px',
        padding: '24px'
    },
    mediaGallery:{
        backgroundColor: '#433e85',
        border:'1px solid #30105f',
        borderRadius:'6px',
        padding:'20px',
        display:'flex',
        justifyContent:'center',
        alignItems:'center'
    },
    mainDisplayImg:{
        maxHeight:'300px',
        width:'auto',
        objectFit:'contain'
    },
    specSleeve:{
        flex:'1.2',
        minWidth:'300px',
        display:'flex',
        flexDirection:'column',
        gap:'14px'
    },
    title:{
        color: '#6d5050',
        margin: 0,
        fontSize: '22px'
    },
    categoryBadge:{
        alignSelf:'flex-start',
        backgroundColor:'#3b0764',
        color: '#706d4c',
        padding:'4px 10px',
        margin: 0,
        fontSize: '12px',
        fontWeight:'bold'
    },
    description:{
        color:'#94a3b8',
        fontSize:'14px',
        lineHeight:'1.6',
        margin:0
    },
    metaGrid:{
        display:'flex',
        flexDirection:'column',
        gap:'12px',
        padding:'16px 0',
        borderTop:'1px solid #1e1b4b'
    },
    metaNode:{
        display:'flex',
        justifyContent:'space-between'
    },
    metaLabel:{
        color: '#715ea8',
        fontSize:'13px'
    },
    metaValue:{
        color:'#804f4f',
        fontSize:'18px'
    },
    priceValue:{
        color:'#6c35b985',
        fontWeight:'bold',
        fontSize:'20px'
    },
    cartBtn: {
        height:'6vh',
        borderRadius:'4px',
        cursor:'pointer',
        fontWeight:'bold',
        backgroundColor:'#504d7e',
        border: '1px solid #2b0f54',
        color:'#5f2525'
    },
    errorWrapper:{
        maxWidth: '600px',
        margin:'40p auto',
        textAlign:'center'
    },
    errorText:{
        color:'#ef4444',
        fontSize:'16px',
        marginBottom:'16px'
    },
    metaRow:{
        display:'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
    },
    commentLink:{
        cursor: 'pointer',
        fontSize: '14px',
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: '#312e81',
        color: '#4a6077',
        display: 'inline-flex',
        alignItems: 'center'
    },
    title:{
        color: '#6d5050',
        margin: 0,
        fontSize: '16px'
    },
    commentText:{
        color: '#706d4c',
        margin: 0,
        fontSize: '14px',

    },
    pageGrid:{
        alignItems:'center',
        backgroundColor: '#1e1b4b',
        border:'1px solid #4c1d95',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'transform 0.2s',
        flexWrap: 'wrap',
        gap:'32px',
        borderRadius: '8px',
        padding: '24px'
    }
}