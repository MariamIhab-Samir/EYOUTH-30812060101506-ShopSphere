const {createClient}=require('@supabase/supabase-js');
const path=require('path');

const supabase=createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadProductImage(file){
    const filename=`${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const {error}=await supabase.storage
        .from('product-images')
        .upload(filename, file.buffer, {contentType: file.mimetype});
    if(error) throw error;
    const{data}=supabase.storage.from('product-images').getPublicUrl(filename);
    return data.publicUrl;
}

module.exports={uploadProductImage}