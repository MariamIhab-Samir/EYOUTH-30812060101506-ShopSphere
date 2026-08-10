import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

import Signup from './pages/signup';
import Login from './pages/login';
import Home from './pages/home';
import Cart from './pages/cart';
import ProductComments from './pages/comment';
import OrderHistory from './pages/orderHistory';
import ProductDetails from './pages/productDetails';
import {CartProvider} from './context/cartContext';
import Profile from './pages/profile';
import {AuthProvider} from './context/authContext';
import Coupons from './components/couponToggle';

const queryClient=new QueryClient();

export default function App(){
    return(
        <QueryClientProvider client={queryClient}>
            <Router>
                <AuthProvider>
                    <CartProvider>
                        <div style={globalResetStyle}> 
                            <Routes>
                                <Route path='/' element={<Navigate to='/login' replace/>}></Route>
                                <Route path='/login' element={<Login />}></Route>
                                <Route path='/signup' element={<Signup />}></Route>
                                <Route path='/home' element={<Home />}></Route>
                                <Route path='/cart' element={<Cart />}></Route>
                                <Route path='/adminTab' element={<Home/>}></Route>
                                <Route path='/comment/:productId' element={<ProductComments />}></Route>
                                <Route path='/orderHistory' element={<OrderHistory />}></Route>
                                <Route path='/productDetails/:productId' element={<ProductDetails />}></Route>
                                <Route path='/profile' element={<Profile />}></Route>
                                <Route path='/coupons' element={<Coupons />}></Route>
                            </Routes>
                        </div>
                    </CartProvider>
                </AuthProvider>
            </Router>
        </QueryClientProvider>
    );
}

const globalResetStyle ={
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    backgroundColor: '#654e8a',
    minHeight:'100vh'
}