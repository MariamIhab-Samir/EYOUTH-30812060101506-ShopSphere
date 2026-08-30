const nodemailer=require('nodemailer');
require('dotenv').config();
const {log}=require('./logger');

const transporter=nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port:(Number(process.env.SMTP_PORT)),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.verify((err)=>{
    if (err) log('error', 'Mailer config error', {errorMessage: err?.message ?? String(err)});
    else log('info', 'Mailer ready')
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
        log('error', 'Email send failed', {errorMessage: err?.message ?? String(err)});
        throw err;
    }
}

module.exports={sendEmail}