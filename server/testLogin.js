const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/craftora');
    console.log('Connected to DB');
    const user = await User.findOne({ email: 'test@example.com' });
    console.log('User found:', user ? user.email : 'None');
    process.exit(0);
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
    process.exit(1);
  }
}
testLogin();
