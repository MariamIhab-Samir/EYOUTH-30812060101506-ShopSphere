function buildOrderConfirmationEmail(order){
    const subtotal=order.items.reduce((sum, item)=> sum + item.product.price*item.quantity, 0)
    const total=Number(order.totalPrice)
    const discount=subtotal-total
    const discountPercent=subtotal>0?Math.round((discount/subtotal)*100):0
    const itemLines=order.items.map(item=>{
        const lineTotal=(item.product.price*item.quantity).toFixed(2);
        return`<li>${item.product.name} x ${item.quantity} [$${item.product.price.toFixed(2)}] each ($${lineTotal} total)</li>`
    }).join('\n');
    const breakdown=`Item Manifesto Breakdown:
    <ul>${itemLines}</ul>
    ________________________
    Subtotal: $${subtotal.toFixed(2)}
    ${discount>0?`Discount: -$${discount.toFixed(2)} (${discountPercent}%)\n`:''}Total: ${total.toFixed(2)}`
    const html=`
    <div>
        <h2>Thanks for your order, ${order.user.name || 'there'}.</h2>
        <p>This confirms your order <strong>#${order.id}</strong> has been recieved.</p>
        <pre style='font-family: monospace; font-size:14px; white-space:pre-wrap;'>${breakdown}</pre>
        <p>We'll send another email when your order ships.</p>
        <p>If you have any questions, just reply to this email.</p>

        <p>Regards,<br/>
        Customer Support Team</p>
    </div>`

    return{html}
}

module.exports={buildOrderConfirmationEmail}