const {PrismaClient}=require('@prisma/client');
const bcrypt= require('bcrypt');
const activityLogModal=require('../config/activityLog')

const prisma= new PrismaClient();

const isValidEmail=(email)=>{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const getProfile=async(req,res)=>{
    try{
        const user=await prisma.user.findUnique({
            where:{id:req.user.userId},
            select:{
                name: true,
                email: true,
                age: true,
                gender: true,
                role: true,
            }
        });

        if(!user){
            return res.status(404).json({error:'User not found'})
        }
        activityLogModal.create({
            action: 'PROFILE_RETRIEVED',
            status: 'SUCCESS',
            details:{httpStatus:200, userId: req.user?.userId??null}
        }).catch(err=>console.error('Log bypass', err))
        return res.status(200).json(user);
    }catch(error){
        console.error('Profile fetch error:', error);
        activityLogModal.create({
            action: 'PROFILE_RETRIEVED',
            status: 'FAILURE',
            details:{httpStatus:500, userId:req.user?.userId??null}
        }).catch(err=>console.error('Log bypass', err));
        return res.status(500).json({error:'An error occurred while fetching profile data'});
    }
};

const updateProfile= async(req, res)=>{
    try{
        const {name, email, age, gender, currentPassword, newPassword}=req.body;

        const updateData={};

        if(name) updateData.name=name;

        if(email){
            if(!isValidEmail(email)){
                return res.status(400).json({error: 'Invalid email format'})
            }
            const existing=await prisma.user.findUnique({where: {email}});
            if (existing && existing.id !== req.user.userId){
                return res.status(400).json({error: 'An account with this email already exists'})
            }
            updateData.email=email;
        }

        if(age){
            const numericAge= parseInt(age,10);
            if(isNaN(numericAge) || numericAge<16){
                return res.status(400).json({error: 'You must be at least 16 years old.'})
            }
            updateData.age=numericAge;
        }

        if(gender) updateData.gender= String(gender).toUpperCase();

        if(newPassword){
            if(!currentPassword){
                return res.status(400).json({error: 'Current password is required to set a new password'})
            }

            const user= await prisma.user.findUnique({where: {id: req.user.userId}});
            const isCurrentValid= await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentValid){
                activityLogModal.create({
                    action: 'PROFILE_UPDATED',
                    status: 'FAILURE',
                    details:{httpStatus:401, userId:req.user?.userId??null}
                }).catch(err=>console.error('Log bypass', err));
                return res.status(401).json({error:'Current password is incorrect'});
            }

            if(newPassword.length<6){
                return res.status(400).json({error:'Password must be at least 6 characters long'});
            }

            updateData.password=await bcrypt.hash(newPassword, 10);
        }

        if(Object.keys(updateData).length ===0){
        return res.status(400).json({error:'No changes provided'});
        }
        
        const updatedUser=await prisma.user.update({
            where:{id: req.user.userId},
            data:updateData,
            select:{name:true, email:true, age:true, gender:true, role:true}
        });
        activityLogModal.create({
            action: 'PROFILE_UPDATED',
            status: 'SUCCESS',
            details:{httpStatus:200, userId: req.user?.userId??null, fieldsChanged: Object.keys(updateData)}
        }).catch(err=>console.error('Log bypass', err));
        return res.status(200).json({success:true, message:'Profile updated successfully', user: updatedUser})
    }catch(error){
        console.error('Profile update error:', error);
        activityLogModal.create({
            action: 'PROFILE_UPDATED',
            status: 'FAILURE',
            details:{httpStatus:500, userId: req.user?.userId??null, error:error.message}
        }).catch(err=>console.error('Log bypass', err));
        return res.status(500).json({error:'An error occurred while updating profile data'});
    }
};

module.exports={getProfile, updateProfile};