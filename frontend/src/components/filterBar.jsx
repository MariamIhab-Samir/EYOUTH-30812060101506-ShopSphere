import React from 'react';

export default function FilterBar({
    nameSort,
    priceSort,
    ratingSort,
    onSortChange
}) {
    return(
        <div style={filterStyles.barWrapper}>
            <div style={filterStyles.controlGroup}>
                <label style={filterStyles.label} htmlFor='alpha-sort'>
                    🔤Title:
                </label>
                <select
                id='alpha-sort'
                value={nameSort}
                onChange={(e)=> onSortChange('name', e.target.value)}
                style={filterStyles.dropdown}>
                    <option value='none'>Disabled</option>
                    <option value='asc'>A to Z(Ascending)</option>
                    <option value='desc'>Z to A(Descending)</option>
                </select>
            </div>
            <div style={filterStyles.controlGroup}>
                <label style={filterStyles.label} htmlFor='price-sort'>
                    💵Price:
                </label>
                <select
                id='price-sort'
                value={priceSort}
                onChange={(e)=> onSortChange('price', e.target.value)}
                style={filterStyles.dropdown}>
                    <option value='none'>Disabled</option>
                    <option value='asc'>Least to Most(Ascending)</option>
                    <option value='desc'>Most to Least(Descending)</option>
                </select>
            </div>
            <div style={filterStyles.controlGroup}>
                <label style={filterStyles.label} htmlFor='rating-sort'>
                    ⭐Rating:
                </label>
                <select
                id='rating-sort'
                value={ratingSort}
                onChange={(e)=> onSortChange('rating', e.target.value)}
                style={filterStyles.dropdown}>
                    <option value='none'>Disabled</option>
                    <option value='asc'>Lowest to Highest(Ascending)</option>
                    <option value='desc'>Highest to Lowest(Descending)</option>
                </select>
            </div>
        </div>
    )
}

const filterStyles={
    barWrapper:{
        display:'flex',
        alignItems:'center',
        padding:'10px 16px',
        backgroundColor:'#110c26',
        borderRadius:'6px',
        border:'1px solid #3a2060',
        marginBottom:'16px'
    },
    controlGroup:{
        display:'flex',
        alignItems:'center',
        gap:'10px'
    },
    label:{
        color:'#443769',
        fontsize:'13px',
        fontWeight:'500'
    },
    dropdown:{
        backgroundColor:'#0f172a',
        color:'#5f2121',
        border:'1px solid #472c5d',
        borderRadius:'4px',
        padding:'6px 12px',
        fontSize:'13px',
        outline:'none',
        cursor:'pointer'
    }
};