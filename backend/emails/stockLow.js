function buildStockLowEmail(product){
    const html=`
    <div>
        <h2>Low stock alert</h2>
        <p><strong>${product.name}</strong> has dropped to 
        </stong>${product.stock}</strong> units remaining.</p>
        <p>Category: ${product.category}</p>
        <p>Consider restocking soon to avoid running out</p>
        <p>Regards,<br/>
        Lionera System</p>
    </div>`

    return{html}
}

module.exports={buildStockLowEmail}