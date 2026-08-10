import React, {useState} from 'react';
import{useNavigate, useLocation} from 'react-router-dom';
import ProductCard from '../components/productCard';
import TopNavbar from '../components/topNavbar';
import BottomNavbar from '../components/bottomNavbar';
import SearchBar from '../components/searchBar';
import FilterBar from '../components/filterBar';
import PaginationControls from '../components/pagination';
import ProductModal from '../components/productModal';
import OrderHistory from './orderHistory';
import{useCart} from '../context/cartContext';
import Cart from './cart';
import Profile from './profile';
import ProductComments from './comment';
import {useProducts} from '../hooks/useProducts';
import {useQueryClient} from '@tanstack/react-query';

export default function Home({setGlobalScreen}) {
    const navigate=useNavigate();
    const location=useLocation();
    const isAdmin= location.pathname==='/adminTab' || localStorage.getItem('role')==='ADMIN';
    const [currentView, setCurrentView] = useState('home');
    const [searchQuery, setSearchQuery]=useState('');
    const [selectedCategory, setSelectedCategory]=useState('All');

    const[nameSort, setNameSort]=useState('none');
    const[priceSort, setPriceSort]=useState('none');
    const[ratingSort, setRatingSort]=useState('none');

    const[take, setTake]=useState(undefined);
    const[skip, setSkip]=useState(0);

    const[activeProductId, setActiveProductId]=useState(null);

    const [showModal, setShowModal]= useState(false);
    const [editingProduct, setEditingProduct]= useState(null);

    const [successMsg, setSuccessMsg]= useState('');

    const{data: Products=[], isLoading:productsLoading, isError: productsError}=useProducts();
    const queryClient=useQueryClient();
    const handleNavigation = (targetView) => {
        setCurrentView(targetView);
    };

    const {addToCart}=useCart();
    const handleAddToCart = async (productId) => {
        const targetedProduct=Products.find(p=> p.id === productId);
        if (!targetedProduct) return;
        const result= await addToCart(targetedProduct);
        if(!result.success){
            alert(result.message);
            return;
        }
        queryClient.invalidateQueries({queryKey:['products']});
        navigate('/cart');
    }

    const handleSortChange=(fieldType, value)=>{
        if(fieldType==='name')setNameSort(value);
        if(fieldType==='price')setPriceSort(value);
        if(fieldType==='rating')setRatingSort(value);
    }

    const handleViewReviews=(productId)=>{
        const product= Products.find(p=> p.id === productId);
        navigate(`/comment/${productId}`, {state:{productName: product?.name}})
    }

    const handleEditProduct=(product)=>{
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleAddProductClick = ()=>{
        setEditingProduct(null);
        setShowModal(true);
    };


    const handleDeleteProduct = async (productId) =>{
        const confirmed = window.confirm('Are you sure you want to delete this product?')
        if (!confirmed) return;

        try{
            const token= localStorage.getItem('token');
            const response = await fetch (`http://localhost:5000/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${token}`}
            });
            const data= await response.json();
            if(!response.ok) throw new Error('Failed to delete product');
                queryClient.invalidateQueries({queryKey:['products']});
        }catch(err){
            alert(err.message);
        }
    };

    const handleModalSuccess = (savedProduct) => {
        queryClient.invalidateQueries({queryKey:['products']});
        setSuccessMsg(editingProduct ? 'Product updated successfully': 'Product added successfully')
        setShowModal(false);
        setEditingProduct(null);

        setTimeout(()=> setSuccessMsg(''), 3000);
    };

    const filteredProducts = Products.filter(product => {
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const inStock=product.stock>0;
        return matchesCategory && matchesSearch && inStock;
    });

    const sortedProducts=[...filteredProducts].sort((a, b)=>{
        if(ratingSort!=='none'){
            const scoreA = a.rating || 0;
            const scoreB = b.rating || 0;
            if(scoreA !== scoreB){
                return ratingSort === 'asc' ? scoreA -scoreB:scoreB- scoreA;
            }
        }
        if(priceSort !== 'none'){
            if(a.price !== b.price){
                return priceSort === 'asc' ? a.price-b.price:b.price-a.price;
            }
        }
        if(nameSort!=='none'){
            const nameComparison=a.name.localeCompare(b.name);
            if(nameComparison!==0){
                return nameSort === 'asc' ? nameComparison: -nameComparison
            }
        }
        return 0;
    });

    const paginatedProducts = take
        ? sortedProducts.slice(skip, skip + take)
        : sortedProducts.slice(skip);

    return(
        <div style={homeLayoutStyles.container}>
            <TopNavbar
            onNavigate={handleNavigation}
            onSearch={setSearchQuery}
            onFilter={setSelectedCategory}>
            </TopNavbar>

            <main style={homeLayoutStyles.mainViewport}>
                {successMsg && (
                    <div style={homeLayoutStyles.successBanner}>
                        {successMsg}
                    </div>
                )}
                {currentView === 'home' && (
                    <div>
                        <FilterBar
                        nameSort={nameSort}
                        priceSort={priceSort}
                        ratingSort={ratingSort}
                        onSortChange={handleSortChange}>
                        </FilterBar>
                        <div style={homeLayoutStyles.headerRow}>
                        <h2 style={homeLayoutStyles.sectionTitle}>
                            Available Catalog ({selectedCategory})
                        </h2>
                        {isAdmin && (
                            <button style={homeLayoutStyles.addProductBtn} onClick={handleAddProductClick}>
                                + Add Product
                            </button>
                        )}
                        </div>
                        {productsLoading ? (
                            <p style={homeLayoutStyles.statusText}>Loading catalog...</p>
                        ): productsError? (
                            <p style={homeLayoutStyles.statusTextError}>Unable to load products. Please try again later</p>
                        ):(
                            <>
                            <div style={homeLayoutStyles.gridGrid}>
                                {paginatedProducts.map(product => (
                                    <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    onViewReviews={handleViewReviews}
                                    onEditProduct={handleEditProduct}
                                    onDeleteProduct={handleDeleteProduct}>
                                    </ProductCard>
                                ))}
                            </div>
                            <PaginationControls
                            totalItems={sortedProducts.length}
                            take={take}
                            skip={skip}
                            onPageChange={(newSkip)=>setSkip(newSkip)}
                            onTakeChange={(newTake)=>{setTake(newTake); setSkip(0);}}
                            onSkipChange={(newSkip)=>setSkip(newSkip)}
                            >
                            </PaginationControls>
                        </>
                        )}
                    </div>
                )}
                {currentView === 'profile' && <Profile onNaviagte={handleNavigation}></Profile>}

                {currentView === 'reviews' && (
                    <ProductComments
                        productId={activeProductId}
                        productName={Products.find(p=> p.id===activeProductId)?.name}
                        onBack={()=> setCurrentView('home')}>
                    </ProductComments>
                )}
                {currentView === 'cart' && (
                    <Cart onNavigate={handleNavigation}></Cart>
                )}
                {currentView === 'history' && (
                    <OrderHistory onNavigate={handleNavigation}></OrderHistory>
                )}
            </main>
            {showModal && (
                <ProductModal
                product={editingProduct}
                onClose={()=> {setShowModal(false); setEditingProduct(null);}}
                onSuccess={handleModalSuccess}></ProductModal>
            )}
            <BottomNavbar
                currentView={currentView}
                onNavigate={handleNavigation}> 
            </BottomNavbar>
        </div>
    )
};

const homeLayoutStyles = {
    container: {
        backgroundColor: '#090514',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
    },
    mainViewport: {
        flex: 1,
        padding: '30px 24px 100px 24px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
    },
    headerRow:{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    sectionTitle: {
        color: '#864444',
        fontSize: '20px',
        marginBottom:'20px',
        fontWeight: '500'
    },
    addProductBtn:{
        backgroundColor: '#7c3aed',
        border: 'none',
        borderRadius:'4px',
        color: '#521f1f',
        padding:'8px 16px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    gridGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '24px'
    },
    backBtn:{
        backgroundColor:'#453363',
        border:'none',
        padding:'10px',
        color:'#662828',
        cursor:'pointer',
        borderRadius:'4px',
        fontWeight:'bold'
    },
    successBanner:{
        backgroundColor: '#073b21',
        color:'#a5ebad',
        padding:'10px 16px',
        borderRadius:'4px',
        marginBottom:'16px',
        fontWeight:'500'
    },
    statusText:{
        color: '#a095cc',
        textAlign:'center',
        padding:'40px 0'
    },
    statusTextError:{
        color: '#942323',
        textAlign:'center',
        padding:'40px 0'
    },
}