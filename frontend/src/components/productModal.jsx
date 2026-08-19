import React, {useState} from 'react';

export default function ProductModal({product, onClose, onSuccess}) {
    const isEditMode= Boolean(product);

    const[formData, setFormData] = useState({
        name: product?.name || '',
        price: product?.price || '',
        stock: product?.stock || '',
        category: product?.category || '',
        description: product?.description || '',
    });

    const[imageFile, setImageFile]=useState(null);
    const[error, setError]=useState('');
    const[loading, setLoading]=useState(false);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]:value}));
    };

    const handleImageChange=(e)=>{
        setImageFile(e.target.files[0])
    };

    const handleSubmit=async(e)=>{
        e.preventDefault();
        setError('');

        const {name, price, stock} = formData;
        if(!name|| !price || !stock){
            setError('Name, price and stock are required')
            return;
        }
        if(!isEditMode && !imageFile){
            setError('Product image is required')
            return;
        }

        setLoading(true);
        try{
            const token= localStorage.getItem('token');
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('price', formData.price);
            payload.append('stock', formData.stock);
            if (formData.category) payload.append('category', formData.category);
            if (formData.description) payload.append('description', formData.description);
            if(imageFile) payload.append('productImage', imageFile);
            
            const baseUrl=import.meta.env.VITE_API_URL || 'http://localhost:5000'
            const endpoint = isEditMode 
            ? `http://localhost:5000/api/admin/products/${product.id}`
            : `http://localhost:5000/api/admin/products`;

            const response = await fetch(endpoint, {
                method: isEditMode ? 'PUT': 'POST',
                headers: {'Authorization': `Bearer ${token}`},
                body: payload
            });

            const data = await response.json();
            if(!response.ok){
                throw new Error(data.error || 'Failed to save product')
            }

            onSuccess(data.product);
        } catch(err){
            setError(err.message);
        }finally{
            setLoading(false);
        }
    };

    return(
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={modalStyles.title}>{isEditMode ? 'Edit Product': 'Add New Product'}</h2>
                {error && <div style={modalStyles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={modalStyles.form}>
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor='product-name' style={modalStyles.label}>Product Name *</label>
                        <input id='product-name' type='text' name='name' value={formData.name} onChange={handleChange} style={modalStyles.input}></input>
                    </div>
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor='product-price' style={modalStyles.label}>Price *</label>
                        <input id='product-price' type='number' name='price' min='1' value={formData.price} onChange={handleChange} style={modalStyles.input}></input>
                    </div>
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor='product-stock' style={modalStyles.label}>Stock *</label>
                        <input id='product-stock' type='number' name='stock' min='1' value={formData.stock} onChange={handleChange} style={modalStyles.input}></input>
                    </div>
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor='product-category' style={modalStyles.label}>Category *</label>
                        <input id='product-category' type='text' name='category' value={formData.category} onChange={handleChange} style={modalStyles.input}></input>
                    </div>
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor='product-image' style={modalStyles.label}>Product Image {isEditMode? '(leave blank to keep current image)': '*'}</label>
                        <input id='product-image'type='file' accept='image/jpeg,image/jpg,image/png,image/webp' onChange={handleImageChange} style={modalStyles.input}></input>
                    </div>
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor='product-description' style={modalStyles.label}>Description (optional)</label>
                        <input id='product-description' type='text' name='description' value={formData.description} onChange={handleChange} style={modalStyles.input}></input>
                    </div>
                    <div style={modalStyles.buttonRow}>
                        <button type='button' onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
                        <button type='submit' disabled={loading} style={modalStyles.submitBtn}>
                            {loading ? 'Saving ...': (isEditMode ? 'Save Changes': 'Add Product')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const modalStyles={
    overlay:{
        position: 'fixed',
        top:0, left:0, right:0, bottom:0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems:'center',
        justifyContent: 'center',
        zIndex:100
    },
    modal:{
        backgroundColor: '#7c3aed',
        borderRadius:'8px',
        color: '#521f1f',
        padding:'3px',
        width:'100%',
        maxWidth:'460px',
        maxHeight: '90vh',
        overflowY: 'auto'
    },
    title:{
        color: '#781f78',
        margin:'0 0 20px 0'
    },
    error:{
        backgroundColor: '#7c3aed',
        borderRadius:'8px',
        color: '#521f1f',
        padding:'3px',
        fontSize:'14px',
        marginBottom: '16px'
    },
    form:{
        display:'flex',
        flexDirection:'column',
        gap:'14px'
    },
    inputGroup:{
        display:'flex',
        flexDirection:'column',
        gap:'6px'
    },
    label:{
        color: '#781f78',
        fontSize:'14px',
        fontWeight:'500'
    },
    input:{
        backgroundColor: '#544470',
        borderRadius:'4px',
        color: '#521f1f',
        padding:'10px',
        fontSize:'14px',
        border: '1px solid #4c1d95',
        outline: 'none'
    },
    buttonRow:{
        display:'flex',
        justifyContent:'flex-end',
        gap:'10px',
        marginTop:'10px'
    },
    cancelBtn:{
        backgroundColor: '#7c3aed',
        border: 'none',
        borderRadius:'4px',
        color: '#521f1f',
        padding:'8px 16px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    submitBtn:{
        backgroundColor: '#1c5d3b',
        border: 'none',
        borderRadius:'4px',
        color: '#521f1f',
        padding:'8px 16px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
}