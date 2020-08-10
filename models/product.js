const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    //had to change type to string, Ikea decided some of their skus needed letters
    sku: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);