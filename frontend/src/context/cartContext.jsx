import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import api from '../api/axios';
import { useAuth } from './authContext';

const CartContext=createContext(null);

export function CartProvider({children}){
    const {isAuthenticated}=useAuth();
    const [cartItems, setCartItems]= useState([]);
    const [loading, setLoading]= useState(true);

    const fetchCart= useCallback(async()=>{
        if(!isAuthenticated){
            setCartItems([]);
            return;
        }
        try{
            const {data}= await api.get('/cart');
            setCartItems(data.cartItems.map(ci=> ({...ci.product, cartItemId: ci.id, quantity: ci.quantity})));
        } catch (error) {
            console.error('Error fetching cart items:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(()=>{
        fetchCart();

        const interval= setInterval(()=>{
            fetchCart();
        }, 60 * 1000);

        return()=>clearInterval(interval)
    }, [fetchCart]);

    const addToCart = async(product) => {
        try{
            await api.post('/cart', {productId: product.id, quantity: 1});
            await fetchCart();
            return {success:true, message:'Item added to cart'};
        }catch(error){
            return {success:false, message:'Failed to add item to cart'};
        }

    };

    const updateQuantity=async(cartItemId, newQuantity)=>{
        if(newQuantity<1) return{success:false, message:'Quantity must be at least 1 or remove the item from the cart using the 🗑️.'};
        
        try{
            await api.put(`/cart/${cartItemId}`, {quantity:newQuantity});
            await fetchCart();
            return {success:true, message:'Quantity updated'};
        }catch(error){
            return {success:false, message:error.response?.data?.error || 'Failed to update quantity'};
        }
    };

    const removeItem =async(cartItemId)=> {
        try{
            await api.delete(`/cart/${cartItemId}`);
            await fetchCart();
        } catch (error) {
            console.error('Error removing item from cart:', error);
            return {success:false, message: error.response?.data?.error || 'Failed to remove item from cart'};
        }
    };

    const clearCart =async()=> {
        try{
            await api.delete('/cart');
            await fetchCart();
        } catch (error) {
            console.error('Error clearing cart:', error);
        }finally {
            setCartItems([]);
        }
    };
    const totalCost= cartItems.reduce((sum, item)=>  sum + item.price * (item.quantity || 1), 0);
    return(
        <CartContext.Provider value={{cartItems, addToCart, updateQuantity, removeItem, clearCart, totalCost, loading}}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart(){
    const ctx=useContext(CartContext);
    if(!ctx) throw new Error ('useCart must be used within a CartProvider');
    return ctx;
}