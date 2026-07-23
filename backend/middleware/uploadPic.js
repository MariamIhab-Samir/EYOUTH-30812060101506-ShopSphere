const multer=require('multer');
const path=require('path');
const fs=require('fs');

const uploadDir=path.join(__dirname, '..', 'uploads', 'products');
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, {recursive:true})
}
const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null, uploadDir);
    },
    filename:(req,file,cb)=>{
        const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`)
    }
});

const fileFilter=(req,file,cb)=>{
    const allowedExtensions=/jpeg|jpg|png|webp/;
    const extname=allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype=allowedExtensions.test(file.mimetype);

    if (extname && mimetype){
        return cb(null, true);
    }
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG and WEBP formats are allowed.'));
};

const upload = multer({
    storage: storage,
    limits:{fileSize: 5*1024*1024},
    fileFilter: fileFilter
});

module.exports={
    upload
};