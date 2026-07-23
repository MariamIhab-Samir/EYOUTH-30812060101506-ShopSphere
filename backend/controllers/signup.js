const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt= require('jsonwebtoken')
const activityLogModal = require('../config/activityLog');
const {sendWelcomeEmail}=require('../emails/welcome');

const prisma = new PrismaClient();
const JWT_SECRET= process.env.JWT_SECRET || 'fallback_server_key';

const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const register = async (req, res) => {
  try {
    const { name, email, password, age, gender } = req.body;

    if (!name || !email || !password || !age || !gender) {
      return res.status(400).json({ error: 'Missing required registration parameters.' });
    }

    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address structure.' });
    }

    if (age < 16) {
      activityLogModal.create({
        action:'USER_REGISTER_BLOCKED',
        status:'FAILURE',
        details:{httpStatus:403, email, reason: 'Underage'}
      }).catch(err=>console.error('Log bypass', err))
      return res.status(403).json({ error: 'Registration denied. You must be at least 16 years old to create an account.' });
    }

    const formattedGender= String(gender).toUpperCase();
    if (formattedGender !== 'MALE' && formattedGender !== 'FEMALE') {
      return res.status(400).json({ error: 'Gender must be specified as either Male or Female.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      activityLogModal.create({
        action:'USER_REGISTER_BLOCKED',
        status:'FAILURE',
        details:{httpStatus:409, email, reason: 'Duplicate email'}
      }).catch(err=>console.error('Log bypass', err))
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        age: parseInt(age, 10),
        password: hashedPassword,
        gender: formattedGender,
        role: 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        age:true,
        gender:true,
        role: true
      }
    });

    const token=jwt.sign(
      {userId:newUser.id, email:newUser.email, role:newUser.role},
      JWT_SECRET,
      {expiresIn: '2h'}
    );

    try{
      await sendWelcomeEmail(newUser);
    }catch(mailErr){
      console.error('Welcome email failed to send:', mailErr)
    }
    
    try{
      if (activityLogModal && typeof activityLogModal.create === 'function' && newUser){
        activityLogModal.create({
          action: 'USER_REGISTER_SUCCESS',
          status: 'SUCCESS',
          details:{userId: String(newUser.id || ''), email: newUser.email || ''}
        });
      }
    }catch (logErr){
      console.error('Registration logging failed silently:', logErr);
    }
    activityLogModal.create({
        action:'USER_REGISTER',
        status:'SUCCESS',
        details:{httpStatus:201, email}
      }).catch(err=>console.error('Log bypass', err))
    return res.status(201).json({success: true, message:'Account created successfully.', user: newUser});
    
  } catch (error) {
    console.error('Registration error:', error);
    activityLogModal.create({
        action:'USER_REGISTER',
        status:'FAILURE',
        details:{httpStatus:500}
      }).catch(err=>console.error('Log bypass', err))
    return res.status(500).json({ error: 'Internal server error during registration.'});
  }
};

module.exports={register};