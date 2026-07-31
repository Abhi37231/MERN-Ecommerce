require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("==================================");
      console.log(`🚀 Server Running`);
      // Triggering restart to load new .env variables
      console.log(`🌍 http://localhost:${PORT}`);
      console.log("==================================");
    });
  } catch (error) {
    console.error(error);
  }
};

startServer();