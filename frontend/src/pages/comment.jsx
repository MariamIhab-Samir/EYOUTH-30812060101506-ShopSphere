import React, {useState} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom'
import Alert from '../components/alert';
import {useComments, useAddComment} from '../hooks/useComments';
import PageLayout from '../components/pageLayout';
import StarDisplay from '../components/starDisplay';

function StarPicker({rating, onChange}){
    return(
        <div style={{display:'flex', gap:'4px', fontSize:'28px', cursor:'pointer'}}>
            {[1,2,3,4,5].map(num=>(
                <span
                key={num}
                onClick={()=> onChange(num)}
                style={{
                    color:num<=rating ? '#fbbf24':'#4b5563',
                    userSelect:'none',
                    outline:'none'
                }}>
                    ★
                </span>
            ))}
        </div>
    );
};

export default function ProductComments(){
    const{productId: productIdParam}=useParams();
    const productId=parseInt(productIdParam, 10);
    const navigate=useNavigate();
    const location=useLocation();
    const{data: comments, isLoading, isError}=useComments(productId);
    const addComment=useAddComment(productId);
    const productName= location.state?.productName || `Product #$(productId)`
    const [newComment, setNewComment]= useState('');
    const [newRating, setNewRating]= useState(0);

    const handleSubmit=(e)=>{
        e.preventDefault();
        if (!newComment.trim()) return;

        addComment.mutate(
            {text:newComment, rating:newRating},
            {onSuccess:()=>{
                setNewComment('');
                setNewRating(5);
                }
            }
        )
    }   

return (
    <PageLayout>
    <div style={commStyles.container}>
        <button style={commStyles.backBtn} onClick={()=>navigate('/home')}>⬅️ Return to Catolog</button>
        <h2 style={{color: '#6f4141'}}>User Audit Reviews (name: {productName})</h2>

        {addComment.isError && (
            <Alert type='error' message={addComment.error?.response?.data?.error || 'Failed to post comment'}></Alert>
        )}
        <div style={commStyles.list}>
            {isLoading?(
                <p style={commStyles.emptyText}>Loadung reviews...</p>
            ):isError?(
                <p style={commStyles.emptyText}>Unable to load reviews</p>
            ): comments.length===0?(
                <p style={commStyles.emptyText}>No reviews yet. Be the first to leave one</p>
            ):(
                comments.map(c=>(
                    <div key={c.id} style={commStyles.commentCard}>
                        <div style={commStyles.header}>
                            <span style={commStyles.user}>{c.user}</span>
                            <StarDisplay rating={c.rating}></StarDisplay>
                        </div>
                        <p style={commStyles.text}>{c.text}</p>
                    </div>
                ))
            )}
        </div>
        <form onSubmit={handleSubmit} style={commStyles.form}>
            <h3 style={{color: '#44295e', margin: '0 0 10px 0'}}>Write a review</h3>
            <StarPicker rating={newRating} onChange={setNewRating}></StarPicker>
            <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder='Enter your product review data'
            rows='3'>
            </textarea>
            <button type='submit' disabled={addComment.isPending} style={commStyles.submitBtn}>
            {addComment.isPending? 'Posting...': 'Commit Entry'}
            </button>
        </form>
        </div>
    </PageLayout>
    );
};
const commStyles={
    container:{
        backgroundColor: '#261c4b',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #36136b'
    },
    backBtn:{
        backgroundColor: '#3b0724',
        border: 'none',
        padding: '8px 14px',
        color: '#8b3a3a',
        cursor: 'pointer',
        marginBottom: '16px',
        borderRadius: '4px'
    },
    commentCard:{
        backgroundColor: '#1e1b4b',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '10px',
        borderLeft: '4px solid #391f50'
    },
    header:{
        display:'flex',
        justifyContent:'space-between',
        marginBottom:'6px'
    },
    user:{
        color:'#5d4079',
        margin:0,
        fontSize:'14px'
    },
    text:{
        color:'#35475d',
        margin:0,
        fontSize:'13px'
    },
    form:{
        marginTop:'24px',
        display:'flex',
        flexDirection:'column',
        gap:'10px'
    },
    select:{
        backgroundColor:'#0f172a',
        color:'#724c4c',
        padding:'6px',
        borderRadius:'4px',
        border:'1px solid #493757',
        resize:'none'
    },
    submitBtn:{
        backgroundColor:'#513680',
        border:'none',
        padding:'10px',
        color:'#623e3e',
        cursor:'pointer',
        borderRadius:'4px',
        fontWeight:'bold'
    }
}