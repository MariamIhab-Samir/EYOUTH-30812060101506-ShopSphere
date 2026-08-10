function buildPromoEmail(products){
    const productCards=products.map(p=>`
        <table role='presentation' width='100%' style='margin-bottom:20px; border:1px solid #ac4a4a;
            border-radius: 10px; overflow: hidden'>
                <tr>
                    <td style='padding: 0;'>
                    <img src='${p.productImage}'
                        alt='${p.productName}' style='width: 100%; max-width:220px; border-radius: 6px;
                        display: block; object-fit: contain;'/>
                    </td>
                </tr>
                <tr>
                    <td style='padding:16px 20px;'>
                        <h3 style='margin: 0 0 4px; font-size: 16px;'>${p.productName}</h3>
                        <p style='margin: 0 0 8px; font-size: 13px; color: #888;'>${p.productCategory}</p>
                        <p style='margin: 0; font-size: 14px; color: #444;'>${p.productDescription || ''}</p>
                    </td>
                </tr>
            </table>
    `).join('');
    const html= `
    <div style='font-family: sans-serif; max-width: 480px; margin: 0 auto;'>
        <h2 style='margin-bottom: 8px;'>New arrival you might like</h2>
        <p style='color: #666; margin-bottom: 24px;'>
        Based on things you've bought before, we thought you'd want a heads up- this just landed in stock.</p>
        ${productCards}
        <p style='color: #999; font-size:12px; margin-top:24px;'>
        You're getting this because you've purchased similar items with us before
        </p>
    </div>`;

    return{html};
}

module.exports={buildPromoEmail}
