require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

async function testAnalytics() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const statusCounts = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  console.log('Raw statusCounts:', statusCounts);
  
  const formatted = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
  }, {});
  
  console.log('Formatted statusCounts:', formatted);
  
  await mongoose.disconnect();
}

testAnalytics();
