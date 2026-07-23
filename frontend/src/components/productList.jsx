import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {fetchProducts} from '../api/productApi';
import ProductCard from './productCard';

const request_timeout_ms= 3000;

const fetchProductsWithTimeout=()=>{
    return Promise.race([
        fetchProducts(),
        new Promise((_, reject) =>
        setTimeout(()=> reject(new Error('TIMEOUT')), request_timeout_ms)
        )
    ])
};

export default function ProductList(){
    const{data: products, isLoading, isError, error}=useQuery({
        queryKey: ['products'],
        queryFn: fetchProductsWithTimeout
    });

    if(isLoading){
        return <div style={listStyles.status}>Loading catalog...</div>
    }

    if(isError){
        if(error?.message==='TIMEOUT'){
            return(
                <div style={listStyles.status}>
                    Connection timed out. Please check your network connection.
                </div>
            );
        };
        return(
            <div style={listStyles.status}>
                Failed to load product catalog.
            </div>
        );
    };

    if(!products || products.length===0){
        return(
            <div style={listStyles.status}>
                No products available right now.
            </div>
        );
    };

    return(
        <div style={listStyles.grid}>
            {products.map((product)=>(
                <ProductCard
                key={product.id}
                product={product}
                onAddToCart={()=>{}}
                onViewReviews={()=>{}}>
                </ProductCard>
            ))}
        </div>
    )
}

const listStyles={
    status:{
        color:'#864444',
        padding: '24px',
        textAlign: 'center'
    },
    grid:{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '24px'
    },
    card:{
        backgroundColor: '#17122c',
        borderRadius: '6px',
        color:'#864444',
        padding: '16px',
    }
}