const nodemailer=require('nodemailer');
require('dotenv').config();

const transporter=nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port:(Number(process.env.SMTP_PORT)),
    secure: process.env.SMTP_SECURE === 'false',
    requireTLS: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.verify((err)=>{
    if (err) console.error('Mailer config error:', err.message);
    else console.log('Mailer ready')
});

async function sendEmail({to, subject, html, text}){
    try{
        const info=await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text,
            html
        });
        return info;
    }catch(err){
        console.error('Email send failed:', err.message);
        throw err;
    }
}

module.exports={sendEmail}