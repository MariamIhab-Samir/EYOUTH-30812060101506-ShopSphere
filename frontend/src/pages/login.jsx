import React, {useState} from 'react';
import{useNavigate} from 'react-router-dom';
import Button from '../components/button'
import Alert from '../components/alert';
import {useLogin} from '../hooks/authMutations';
import {useAuth} from '../context/authContext';

export default function Login(){
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('user');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const[success, setSuccess]= useState('');
    const {login}=useAuth();
    const loginMutation=useLogin();

    const handleChange= (e)=>{
        const {name, value}=e.target;
        setFormData((prev)=>({
            ...prev,
            [name]:value
        }));
    };

    const handleFormSubmit = async(e)=>{
        e.preventDefault();
        setError('');
        setSuccess('');

        const {email, password}= formData;

        if (!email || !password) {
            setError('Please provide both your email adress and password')
            return;
        }

        loginMutation.mutate(
            {email, password, isAdminTab: activeTab === 'admin'},
            {
                onSuccess:(data)=>{
                    if(data.token && data.user){
                        login(data.token, data.user.role, data.user)

                    setSuccess('Authentication successful! Redirecting to home page');

                setTimeout(()=> {
                if (localStorage.getItem('role')==='ADMIN'){
                    navigate('/adminTab')
                } else{
                    navigate('/home')
                }
            }, 1500);
            } else{
                throw new Error('Invalid response format from server');
            }
        },
        onError:(err)=>{
            if(err.response?.data?.redirectToAdminTab){
                setActiveTab('admin');
                setError(err.response.data.error);
                return;
                }
            setError(err.response?.data?.error || 'Invalid email or password combination')
                }
            }
        )
    };

    return(
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Account Login</h2>

                <div style={styles.tabsContainer}>
                    <button
                    type='button'
                    onClick={()=> setActiveTab('user')}
                    style={activeTab === 'user'? styles.tabActive: styles.tabInactive}
                    >
                        User Login
                    </button>
                    <button
                    type='button'
                    onClick={()=> setActiveTab('admin')}
                    style={activeTab === 'admin'? styles.tabActive: styles.tabInactive}
                    >
                        Admin Login
                    </button>
                </div>
                {error && <Alert type='error' message={error}></Alert>}
                {success && <Alert type='success' message={success}></Alert>}

                <form onSubmit={handleFormSubmit} style={styles.format}>
                        <div style={styles.inputGroup}>
                            <label htmlFor='login-email' style={styles.label}>Email Address</label>
                            <input
                            id='login-email'
                                type= 'email'
                                name= 'email'
                                value={formData.email}
                                onChange={handleChange}
                                style={styles.input}></input>
                        </div>
                
                        <div style={styles.inputGroup}>
                            <label htmlFor='login-password' style={styles.label}>Password</label>
                            <input
                            id='login-password'
                            type= 'password'
                            name= 'password'
                            value={formData.password}
                            onChange={handleChange}
                            style={styles.input}></input>
                        </div>
    
                        <Button type='submit' value='login' disabled={loginMutation.isPending} style={styles.authBtn}>
                            Login
                        </Button>
                    </form>
                    <div style={styles.footer}>
                        <p style={styles.footerText}>
                            Don't have an account? <a href='./signup' style={styles.link}>Sign up here</a>
                        </p>
                    </div>
            </div>
        </div>
    )
};

const styles = {
    container:{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHieght: '100vh',
        backgroundColor: '#332a40',
        fontFamily: 'sans-serif',
        padding: '20px'
    },
    card:{
        backgroundColor: '#51366d',
        padding: '40px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 4px 15px rgba(112, 43, 109, 0.3)'
    },
    title:{
        color: '#5c298b',
        margin: '0 0 24px 0',
        textAlign: 'center',
        fontweight: '600px'
    },
    tabsContainer:{
        display: 'flex',
        width: '100%',
        backgroundColor:'#3b2554',
        borderRadius:'6px',
        padding:'4px',
        marginBottom: '24px'
    },
    tabActive:{
        flex:1,
        padding:'10px',
        backgroundColor:'#7c3aed',
        color:'#653e3e',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor:'pointer',
        transition:'all 0.2s ease'
    },
    tabInactive:{
        flex: 1,
        padding: '10px',
        backgroundColor: 'transparent',
        color: '#a78bfa',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition:'all 0.2 ease'
    },
    form:{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    inputGroup:{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label:{
        color: '#89189f',
        fontSize: '14px',
        fontWeight: '500'
    },
    input:{
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid #7d3f87',
        backgroundColor: '#4b2052',
        color: '#64236e',
        fontSize: '16px',
        outline: 'none'
    },
    authBtn:{
        backgroundColor: '#7c3aed',
        border: 'none',
        borderRadius: '4px',
        color: '#4c2121',
        padding: '6px 12px',
        cursor: 'pointer',
        fontWeight: '20px',
    }
};
