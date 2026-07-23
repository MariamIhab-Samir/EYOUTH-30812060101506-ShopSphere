import React from 'react';

export default function PaginationControls({
    totalItems,take,skip,onPageChange,onTakeChange,onSkipChange}){
        const itemsPerPage= take || totalItems || 10;
        const totalPages=  Math.ceil(totalItems/ itemsPerPage) || 1;
        const currentPage= Math.floor(skip/itemsPerPage)+1;

        const renderPageNumbers=()=>{
            let pages=[];
            for(let i=1; i <= totalPages; i++){
                const isActive=i===currentPage;
                pages.push(
                    <button
                    key={i}
                    onClick={()=>onPageChange((i-1)*itemsPerPage)}
                    style={isActive ? pagStyles.pageSquareActive:pagStyles.pageSquare}>
                        {i}
                    </button>
                );
            }
            return pages;
        };

        return(
            <div style={pagStyles.container}>
                <div style={pagStyles.squareGroup}>
                    {renderPageNumbers()}
                </div>
                <div style={pagStyles.inputPanel}>
                    <label style={pagStyles.label}>
                        Take:
                        <input
                        type='number'
                        placeholder='All'
                        value={take || ''}
                        style={pagStyles.numberInput}
                        onChange={(e)=>{
                            const val=e.target.value;
                            onTakeChange(val ? parseInt(val, 10): undefined);
                        }}></input>
                    </label>
                    <label style={pagStyles.label}>
                        Skip:
                        <input
                        type='number'
                        placeholder='0'
                        value={skip || 0}
                        style={pagStyles.numberInput}
                        onChange={(e)=>onSkipChange(parseInt(e.target.value, 10) || 0)}>
                        </input>
                    </label>
                </div>
            </div>
        )
    };

const pagStyles={
    container:{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        padding:'16px',
        backgroundColor:'#110c26',
        borderRadius:'6px',
        border:'1px solid #2e1a4b',
        marginTop:'20px',
        flexWrap:'wrap',
        gap:'16px'
    },
    squareGroup:{
        display:'flex',
        gap:'6px'
    },
    pageSquare: {
        width:'36px',
        height:'36px',
        borderRadius:'4px',
        cursor:'pointer',
        fontWeight:'bold',
        fontSize:'14px',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        transition:'all 0.2s',
        backgroundColor:'#1e1b4b',
        border: '1px solid #2b0f54',
        color:'#5f2525'
    },
    pageSquareActive:{
        width:'36px',
        height:'36px',
        borderRadius:'4px',
        cursor:'pointer',
        fontWeight:'bold',
        fontSize:'14px',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        transition:'all 0.2s',
        backgroundColor:'#562c7c',
        border: '1px solid #58426d',
        color:'#5f2525'
    },
    inputPanel:{
        display:'flex',
        gap:'16px',
        alignItems:'center'
    },
    label:{
        color:'#574788',
        fontsize:'13px',
        display:'flex',
        alignItems:'center',
        gap:'6px'
    },
    numberInput:{
        backgroundColor: '#0f172a',
        border: '1px solid #472365',
        borderRadius:'4px',
        padding:'6px',
        color:'#5d2929',
        width:'60px',
        textAlign:'center',
        outline:'none'
    }
}
