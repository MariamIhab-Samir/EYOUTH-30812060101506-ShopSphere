function buildStockLowEmail(product){
    const html=`
    <div>
        <h2>Low stock alert</h2>
        <p><strong>${product.name}</strong> has dropped to 
        </strong>${product.stock}</strong> units remaining.</p>
        <p>Category: ${product.category}</p>
        <p style='color:#888; font-size:13px;'>
        Note: This count reflecrts the remaining no. of items according to the number of items currently reserved in active carts, not confirmed checkouts.
        Customers may add or remove quantities before completing their order, so, the final number may differ slightly once checkout is complete.</p>
        <p>Consider restocking soon to avoid running out</p>
        <p>Regards,<br/>
        Lionera System</p>
    </div>`

    return{html}
}

module.exports={buildStockLowEmail}