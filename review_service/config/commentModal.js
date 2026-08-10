const mongoose=require('mongoose');

const commentSchema=new mongoose.Schema({
    productId:{type: Number, required: true, index: true},
    userId:{type: Number, required: true},
    userName:{type: String, required: true},
    text: {type: String, required: true},
    rating:{type: Number, required: true, min: 1, max: 5},
    createdAt:{type: Date, default: Date.now}
})

module.exports= mongoose.model('Comment', commentSchema);