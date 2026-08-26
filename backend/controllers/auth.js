const { PrismaClient } = require('@prisma/client');
const activityLogModal = require('../config/activityLog');
const {uploadProductImage} = require('../util/uploadToSupabase')
const prisma = new PrismaClient();
const {log}= require('../util/logger');

const verifyAdminRole = (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      activityLogModal.create({
        action: 'ADMIN_ACTION_FORBIDDEN',
        status: 'FAILURE',
        details: {httpStatus:403, adminId: req.user?.userId?? null}
      }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
      res.status(403).json({ error: 'Forbidden. Administrative authorization required.' });
      return false;}
  return true;
};

const adminAddProduct = async (req, res) => {
  if (!verifyAdminRole(req, res)) return;
  let newProduct;
  try {
    const { name, description, price, stock, category, discount} = req.body;
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: name, price, and stock.' });
    }
    if(!req.file){
      return res.status(400).json({error: 'Product image is required.'})
    }

    const imageUrl=process.env.NODE_ENV === 'production'
      ? await uploadProductImage(req.file)
      : `/uploads/products/${req.file.filename}`;

    newProduct = await prisma.product.create({
      data: { name,
        description: description || null, 
        price: parseFloat(price), 
        stock: parseInt(stock, 10),
        category: category || undefined,
        discount: discount !== undefined ? parseInt(discount, 10): undefined,
        image: imageUrl
      }
    });

    fetch(`${process.env.APP_URL}/api/webhooks/product-created`, {
      method: 'POST',
      headers:{
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.WEBHOOK_SECRET
        }, 
          body: JSON.stringify({productId: newProduct.id})
    }).then(async(res)=>{
        if(!res.ok){
          const body=await res.text();
          log('warn', 'product-created webhook responded with non-2xx status',{status: res.status, productId: newProduct.id, responseBody: body});
        }else{
          log('info', 'product-created webhook succeeded', {productId: newProduct.id});
        }
    }).catch(err=> log('error', 'product-created webhook failed',{productId: newProduct.id, errorMessage: err?.message?? String(err)}))
    activityLogModal.create({
      action: 'ADMIN_PRODUCT_CREATED',
      status: 'SUCCESS',
      details: {httpStatus:201, adminId: req.user?.userId?? null, productId: newProduct.id }
    }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))

    return res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    log ('error','Admin add product failed', {errorMessage: err?.message?? String(err), adminId: req.user?.userId?? null})
    if(error.code==='P2002'){
      activityLogModal.create({
      action: 'ADMIN_PRODUCT_CREATED',
      status: 'FAILURE',
      details: {httpStatus:409, adminId: req.user?.userId?? null, productId: newProduct?.id??null}
    }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
    return res.status(409).json({ error: 'A product with this name already exists' });
    }
    activityLogModal.create({
      action: 'ADMIN_PRODUCT_CREATED',
      status: 'FAILURE',
      details: {httpStatus:500, adminId: req.user?.userId?? null, productId: newProduct?.id??null }
    }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
    return res.status(500).json({ error: 'Internal server error while creating product.' });
  }
};

const adminEditProduct = async (req, res) => {
  const id=parseInt(req.params.id, 10);
  try {

    if (!verifyAdminRole(req, res)) return;
    const targetProduct = await prisma.product.findUnique({
      where:{id}
    });

    const { name, description, price, stock, category, discount } = req.body;
    if (!targetProduct) {
      return res.status(404).json({ error: 'Target product not found.' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        stock: stock !== undefined ? parseInt(stock, 10) : undefined,
        category: category || undefined,
        discount: discount !== undefined ? parseInt(discount, 10): undefined,
        image: req.file ? (process.env.NODE_ENV === 'production' ? await uploadProductImage(req.file): `/uploads/products/${req.file.filename}`) : undefined
      }
    });

    activityLogModal.create({
      action: 'ADMIN_PRODUCT_UPDATED',
      status: 'SUCCESS',
      details: {httpStatus:200, adminId: req.user?.userId?? null, productId: id }
    }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))

    return res.status(200).json({ success: true, product: updatedProduct });
  } catch (err) {
    log ('error','Admin edit product failed', {errorMessage: err?.message?? String(err), adminId: req.user?.userId?? null})
    activityLogModal.create({
      action: 'ADMIN_PRODUCT_UPDATED',
      status: 'FAILURE',
      details: {httpStatus:500, adminId: req.user?.userId?? null, productId: id }
    }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
    return res.status(500).json({ error: 'Internal server error while modifying product.' });
  }
};

const adminDeleteProduct = async (req, res) => {
  const id=parseInt(req.params.id, 10);
  try {

    if (!verifyAdminRole(req, res)) return;

    const targetProduct = await prisma.product.findUnique({ where: { id } });
    if (!targetProduct) {
      return res.status(404).json({ error: 'Target product not found.' });
    }

    await prisma.product.delete({ where: { id } });

    activityLogModal.create({
      action: 'ADMIN_PRODUCT_DELETED',
      status: 'SUCCESS',
      details: {httpStatus:200, adminId: req.user?.userId?? null, productId: id }
    }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))

    return res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    log ('error','Admin delete product failed', {errorMessage: err?.message?? String(err), adminId: req.user?.userId?? null})
    activityLogModal.create({
      action: 'ADMIN_PRODUCT_DELETED',
      status: 'FAILURE',
      details:{httpStatus:500, adminId: req.user?.userId?? null, productId: id }
    }).catch(err=>log ('error','Log bypass', {errorMessage: err?.message?? String(err)}))
    return res.status(500).json({ error: 'Internal server error while deleting product.' });
  }
};

module.exports={
  adminAddProduct,
  adminEditProduct,
  adminDeleteProduct
}