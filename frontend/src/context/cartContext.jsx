import React, {createContext, useContext, useState, useEffect} from 'react';

const CartContext=createContext(null);

export function CartProvider({children, initialItems}){
    const [cartItems, setCartItems]= useState(()=>{
        if(initialItems) return initialItems;
        const saved = localStorage.getItem('user_cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(()=>{
        localStorage.setItem('user_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        let result={success:true};
        setCartItems(prev=>{
            const existing=prev.find(i=> i.id === product.id);
            const currentQty = existing? (existing.quantity || 1): 0
            const requestedQty=currentQty + 1;

            if(requestedQty>product.stock){
                result={success:false, message:`Insufficient stock. Only ${product.stock} available`};
                return prev;
            }
            if (existing){
                return prev.map(i=> i.id === product.id ?{...i, quantity:requestedQty}:i);
            }
            return[...prev, {...product, quantity:1}];
        });
        return result;
    };

    const updateQuantity=(itemId, newQuantity)=>{
        if(newQuantity<1) return;
        setCartItems(prev=>prev.map(i=>i.id===itemId ? {...i, quantity:newQuantity}:i));
    };

    const removeItem =(itemId)=> setCartItems(prev =>prev.filter(i=> i.id !== itemId));
    const clearCart =()=> setCartItems([]);
    const totalCost= cartItems.reduce((sum, item)=>  sum + item.price * (item.quantity || 1), 0);
    return(
        <CartContext.Provider value={{cartItems, addToCart, updateQuantity, removeItem, clearCart, totalCost}}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart(){
    const ctx=useContext(CartContext);
    if(!ctx) throw new Error ('useCart must be used within a CartProvider');
    return ctx;
}