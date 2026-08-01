const mongoose = require("mongoose");
require("dotenv").config();

console.log("Starting connection test...");
console.log("MongoDB URI exists:", !!process.env.MONGODB_URI);

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB Connected Successfully");
        console.log("Host:", mongoose.connection.host);
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Connection Error:");
        console.error(err);
        process.exit(1);
    });