import React, {useState} from 'react';
import LogoutButton from '../components/logoutButton';
import Alert from '../components/alert';
import {useAuth} from '../context/authContext';
import {useProfile, useUpdateProfile} from '../hooks/useProfile';
import PageLayout from '../components/pageLayout';

export default function Profile(){
    const {user, updateUser}=useAuth();
    const updateProfile=useUpdateProfile();

    const[isEditing, setIsEditting]=useState(false);
    const[formData, setFormData]=useState({
        name: user?.name || '', email: user?.email || '', age: user?.age || '',
        gender: user?.gender || '', currentPassword:'', newPassword:''
    });

    const handleChange=(e)=>{
        const{name, value}=e.target;
        setFormData((prev)=>({...prev, [name]: value}));
    };

    const handleEditClick=()=>{
        setFormData({
            name: user?.name || '', email: user?.email || '', age: user?.age || '',
            gender: user?.gender || '', currentPassword:'', newPassword:''
        });
        setIsEditting(true);
    };

    const handleSubmit=(e)=>{
        e.preventDefault();
        const payload={
            name: formData.name,
            email: formData.email,
            age: formData.age,
            gender: formData.gender,
        }

        if(formData.newPassword){
            payload.currentPassword=formData.currentPassword;
            payload.newPassword=formData.newPassword;
        }
        
        updateProfile.mutate(payload, {
            onSuccess:(data)=>{
                updateUser(data.user);
                setIsEditting(false);
                setFormData((prev)=>({...prev, currentPassword:'', newPassword:''}));
            }
        });
    };
    return(
        <PageLayout>
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>My Profile</h2>

                {updateProfile.isError && <Alert type='error' message={updateProfile.error?.response?.data?.error || 'Unable to load profile'}></Alert>}

                {isEditing?(
                    <form onSubmit={handleSubmit} noValidate style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label htmlFor='edit-name' style={styles.label}>Name </label>
                            <input id='edit-name' name='name' value={formData.name} onChange={handleChange} style={styles.input}></input>
                        </div>
                        <div style={styles.inputGroup}>
                            <label htmlFor='edit-email' style={styles.label}>Email </label>
                            <input id='edit-email' name='email' type='email' value={formData.email} onChange={handleChange} style={styles.input}></input>
                        </div>
                        <div style={styles.inputGroup}>
                            <label htmlFor='edit-age' style={styles.label}>Age </label>
                            <input id='edit-age' name='age' type='number' min='0' value={formData.age} onChange={handleChange} style={styles.input}></input>
                        </div>
                        <div style={styles.inputGroup}>
                            <label htmlFor='edit-gender' style={styles.label}>Gender </label>
                            <select id='edit-gender' name='gender' value={formData.gender} onChange={handleChange} style={styles.input}>
                                <option value=''>Unchanged</option>
                                <option value='FEMALE'>Female</option>
                                <option value='MALE'>Male</option>
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label htmlFor='edit-current-password' style={styles.label}>Current Password(Only if changing password) </label>
                            <input id='edit-current-password' name='currentPassword' type='password' value={formData.currentPassword} onChange={handleChange} style={styles.input}></input>
                        </div>
                        <div style={styles.inputGroup}>
                            <label htmlFor='edit-new-password' style={styles.label}>New Password </label>
                            <input id='edit-new-password' name='newPassword' type='password' value={formData.newPassword} onChange={handleChange} style={styles.input}></input>
                        </div>
                        <button type='submit' disabled={updateProfile.isPending} style={styles.saveBtn}>
                            {updateProfile.isPending? 'Saving...':'Save Changes'}
                        </button>
                        <button type='button' onClick={()=> setIsEditting(false)}
                            style={styles.cancelBtn}>
                                Cancel
                        </button>
                    </form>
                ): user?(
                    <div style={styles.infoList}>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Name </span>
                            <span style={styles.infoValue}>{user.name}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Email </span>
                            <span style={styles.infoValue}>{user.email}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Age </span>
                            <span style={styles.infoValue}>{user.age}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Gender </span>
                            <span style={styles.infoValue}>{user.gender.charAt(0).toUpperCase()+user.gender.slice(1).toLowerCase()}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Password </span>
                            <span style={styles.infoValue}>*******</span>
                        </div>
                        <button onClick={()=> setIsEditting(true)} style={styles.editBtn}>
                            Edit Profile
                        </button>
                    </div>
                ):null}
                <div style={styles.logoutWrapper}>
                    <LogoutButton style={styles.logoutBtn}></LogoutButton>
                </div>
            </div>
        </div>
        </PageLayout>
    )
}

const styles={
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
        color: '#6d5050',
        margin: '0 0 24px 0',
        fontWeight: '600',
        textAlign: 'center'
    },
    loadingText:{
        color: '#3b3066',
        testAlign: 'center'
    },
    infoList:{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '28px'
    },
    infoRow:{
        display: '#352e54',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: '#524e87',
        borderRadius: '4px',
        border:'1px solid #4c1d95',
    },
    infoLabel:{
        color:'#3e3a4d',
        fontWeight:'500'
    },
    infoValue:{
        color: '#5a2e2e'
    },
    logoutWrapper:{
        display: 'flex',
        justifyContent: 'center'
    },
    logoutBtn:{
        padding: '12px',
        backgroundColor: '#524e87',
        borderRadius: '4px',
        border:'1px solid #4c1d95',
        color: '#5a2e2e',
        cursor: 'pointer',
        fontWeight:'bold',
        width: '100%'
    },
    form:{
        display: 'flex',
        flexDirection: 'column',
        gap:'6px'
    },
    label:{
        color: '#c4b5fd',
        fontSize: '14px',
        fontWeight: '500'
    },
    input:{
        padding:'12px',
        borderRadius:'4px',
        border:'1px solid #76668e',
        backgroundColor: '#5b55b4',
        color: '#8a81ae',
    },
    editBtn:{
        backgroundColor:'#4b2052',
        color:'#6a4a4a',
        borderRadius:'4px',
        border:'1px solid #6a5786',
        padding:'10px',
        cursor:'pointer',
        width:'100%',
        marginBottom:'20px'
    },
    saveBtn:{
        backgroundColor:'#17372b',
        color:'#316954',
        borderRadius:'4px',
        border:'1px solid #6a5786',
        padding:'10px',
        cursor:'pointer',
        width:'100%',
        marginBottom:'20px'
    },
    cancelBtn:{
        backgroundColor:'#421212',
        color:'#853838',
        borderRadius:'4px',
        border:'1px solid #6a5786',
        padding:'10px',
        cursor:'pointer',
        width:'100%',
        marginBottom:'20px'
    }
}