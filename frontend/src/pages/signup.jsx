import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import Button from '../components/button'
import Alert from '../components/alert';
import {useSignup} from '../hooks/authMutations';
import {useAuth} from '../context/authContext';

export default function Signup() {
    const navigate= useNavigate();
    const {signup}= useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
        age: ''
    });

    const[error, setError] = useState('');
    const[success, setSuccess] = useState('');

    const signupMutation=useSignup();

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const { name, email, password, confirmPassword, gender, age} = formData;

        if (!name || !email || !password || !confirmPassword || !gender || !age) {
            setError('All fields are strictly required')
            return;
        }

        if (password !== confirmPassword) {
            setError('Passords do not match');
            return;
        }

        const numericalAge = parseInt(age, 10);
        if (isNaN(numericalAge) || numericalAge < 16) {
            setError('Registration rejected. You must be at least 16 years old');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)){
            setError('Invalid email format');
            return;
        }

        signupMutation.mutate(
            {name, email, password, gender, age: numericalAge},
            {onSuccess: (data)=>{
                signup(data.token, data.user?.role, data.user??null);
                setSuccess(data.message ||'Account created successfully. Redirecting you to home page')
                setTimeout(()=>{
                navigate('/home');
            }, 2000);
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    gender: '',
                    age: ''
                });
            },
            onError:(err)=>{
                setError(err.response?.data?.error ||'Registration failed. Try again later')
                }
            }
        )
    }; 

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create Account</h2>

                {error && <Alert type='error' message={error}></Alert>}
                {success && <Alert type='success' message={success}></Alert>}

                <form onSubmit={handleFormSubmit} style={styles.format} noValidate>
                    <div style={styles.inputGroup}>
                        <label htmlFor='signup-name' style={styles.label}>Full Name</label>
                        <input 
                        id= 'signup-name'
                        type='text'
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        style={styles.input}></input>
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor='signup-email' style={styles.label}>Email Address</label>
                        <input
                        id= 'signup-email'
                        type= 'email'
                        name= 'email'
                        value={formData.email}
                        onChange={handleChange}
                        style={styles.input}></input>
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor='signup-age' style={styles.label}>Age</label>
                        <input
                        id= 'signup-age'
                        type= 'number'
                        name= 'age'
                        min='0'
                        value={formData.age}
                        onChange={handleChange}
                        style={styles.input}></input>
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor='signup-gender' style={styles.label}>Gender</label>
                        <select
                        id='signup-gender'
                        name= 'gender'
                        value={formData.gender}
                        onChange={handleChange}
                        style={styles.input}>

                            <option value=''>Select Gender</option>
                            <option value='Female'>Female</option>
                            <option value='Male'>Male</option>
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor='signup-password' style={styles.label}>Password</label>
                        <input
                        id= 'signup-password'
                        type= 'password'
                        name= 'password'
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}></input>
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor='signup-confirmPassword' style={styles.label}>Confirm Password</label>
                        <input
                        id= 'signup-confirmPassword'
                        type= 'password'
                        name= 'confirmPassword'
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        style={styles.input}></input>
                    </div>

                    <Button type='submit' disabled={signupMutation.isPending} styles={styles.authBtn}>
                        Sign up
                    </Button>
                    <div style={signupLinkStyles.linkContainer}>
                        <span style={signupLinkStyles.text}>Already have an account?</span>
                        <a href='/login' style={signupLinkStyles.link}>Log in here</a>
                    </div>
                </form>
            </div>
        </div>
    );
}

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
}
const signupLinkStyles={
    linkContainer: {
        marginTop:'20px',
        textAlign:'center',
        fontSize:'14px'
    }, 
    text:{
        color: '#94a3b8'
    },
    link:{
        color:'#382c44',
        textDecoration:'none',
        fontWeight:'bold',
        marginLeft:'5px',
        cursor:'pointer'
    }
};