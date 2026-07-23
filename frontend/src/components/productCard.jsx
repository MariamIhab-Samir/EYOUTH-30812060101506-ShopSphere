import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

export default function ProductCard({ product, onAddToCart, onEditProduct, onDeleteProduct, onViewReviews}) {
        const location = useLocation();
        const navigate= useNavigate();
        const isAdmin = location.pathname === '/adminTab'

        const renderStars = (rating= 0) => {
        const stars = [];
        const roundedRating = Math.round(rating);
        for (let i = 1; i <= 5; i++){
            stars.push(
                <span key={i} style={{color: i <= roundedRating? '#fbbf24':'#4b5563', marginRight: '2px'}}>
                    ★
                </span>
            )
        }
        return stars;
    };

    const handleCardClick=()=>{
        navigate(`/productDetails/${product.id}`);
    }

    const getImageUrl=(image)=>{
        if(!image) return null;
        if(image.startsWith('/uploads')){
            return `http://localhost:5000${image}`
        }
        return image;
    }

    return(
        <div style={cardStyles.card} onClick={handleCardClick}>
            {isAdmin && (
                <div style={cardStyles.adminToolbar}>
                    <button style={cardStyles.editBtn}
                    onClick={(e)=>{
                        e.stopPropagation();
                        onEditProduct(product);
                    }}
                    title='Edit product parameters'>
                        ✏️
                    </button>
                    <button style={cardStyles.deleteBtn}
                    onClick={(e)=>{
                        e.stopPropagation();
                        onDeleteProduct(product.id);
                    }}
                    title='Remove product entry from catalog'
                    >
                        ❌
                    </button>
                </div>
            )}

            <div style={cardStyles.imagePlaceholder}>
                {product.image ? (
                    <img 
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    style={{width:'100%', height: '100%', objectFit: 'contain'}}
                    >
                    </img>
                ):(<span style={{color:'#6b21a8'}}>System Image</span>
            )}
            </div>

            <div style={cardStyles.infoBlock}>
                <div style={cardStyles.metaRow}>
                    <p style={cardStyles.category}>{product.category}</p>
                    <span
                        style={cardStyles.commentLink}
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewReviews(product.id);
                        }}
                        title='View product audit logs and reviews'>
                            💬 ({product.reviewContent || 0})
                        </span>
                </div>

                <h3 style={cardStyles.title}>{product.name}</h3>
                
                <div style={cardStyles.ratingContainer}>
                    {renderStars(product.rating)}
                    <span style={cardStyles.ratingText}>({product.rating || 0})</span>
                </div>

                <div style={cardStyles.footerRow}>
                    <span style={cardStyles.price}>${product.price}</span>
                    <span style={cardStyles.stock}>
                        {product.stock>0? `${product.stock} in stock`: 'Out of stock'}</span>
                    <button style={cardStyles.addBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product.id);
                    }}>
                        + Add
                    </button>
                </div>
            </div>
        </div>
    )
};

const cardStyles = {
    card:{
        position: 'relative',
        backgroundColor: '#1e1b4b',
        border:'1px solid #4c1d95',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s'
    },
    adminToolbar:{
        position:'absolute',
        top:'8px',
        left:'8px',
        display:'flex',
        gap:'6px',
        zIndex: 10
    },
    editBtn:{
        backgroundColor: '#7e6d42',
        border:'none',
        borderRadius:'4px',
        cursor:'pointer',
        padding:'6px 8px',
        fontSize:'12px',
        boxShadow:'0 2px 4px rgba(0, 0, 0, 0.3)'
    },
    deleteBtn:{
        backgroundColor: '#6d2a2a',
        border:'none',
        borderRadius:'4px',
        cursor:'pointer',
        padding:'6px 8px',
        fontSize:'12px',
        boxShadow:'0 2px 4px rgba(0, 0, 0, 0.3)'
    },
    imagePlaceholder:{
        height: '180px',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #3b0764'
    },
    infoBlock:{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
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
    category:{
        color: '#706d4c',
        margin: 0,
        fontSize: '12px',
        textTransform: 'uppercase'
    },
    ratingContainer:{
        display:'flex',
        alignItems:'center',
        margin: '2px 0 6px 0'
    },
    ratingText:{
        color: '#424d5d',
        fontSize: '12px',
        marginLeft: '6px'
    },
    stock:{
        color:'#453e61',
        fontSize:'16px'
    },
    footerRow:{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '12px'
    },
    price:{
        color: '#5e3f7c',
        fontWeight: 'bold',
        fontSize: '18px'
    },
    addBtn:{
        backgroundColor: '#7c3aed',
        border: 'none',
        borderRadius: '4px',
        color: '#491d1d',
        padding: '6px 12px',
        cursor: 'pointer',
        fontWeight: '600'
    }
};