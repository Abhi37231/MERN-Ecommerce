require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');

const fix = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const products = await Product.find({});
    for (const product of products) {
      const orders = await Order.find({ 
        'items.product': product._id,
        status: { $nin: ['cancelled'] }
      });
      let count = 0;
      for (const order of orders) {
        for (const item of order.items) {
          if (item.product.toString() === product._id.toString()) {
            count += item.quantity;
          }
        }
      }
      if (product.soldCount !== count) {
        console.log(`Product ${product.name}: updating soldCount from ${product.soldCount} to ${count}`);
        product.soldCount = count;
        await product.save();
      }
    }
    console.log("Done fixing sold counts.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};
fix();
