const {sendEmail}=require('../util/mailer');

async function sendWelcomeEmail(user){
    await sendEmail({
        to: user.email,
        subject: `Welcome to Lionera, ${user.name}`,
        html: ` 
        <h2>Welcome abroad, ${user.name}. </h2>
        <p>Thanks for creating an account with us. This is a confirmation that your account has been successfully created</p>
        <p>Please note the following:</p>
        <ul>
        <li>Keep your login credentials confidential at all times.</li>
        <li>Order and account activity may be reviewed periodically for security purposes.</li>
        <li>If you notice any unauthorized access to your account, please contact our support team immediately.</li>
        </ul>
        
        <p>We look forward to implementing your first order.</p>
        
        <p>If you did not create this account, please disregard this email or contact us to report the issue.</p>
        
        <p>Regards,<br>
        Customer Support Team </p>`,
    })
}

module.exports={sendWelcomeEmail};