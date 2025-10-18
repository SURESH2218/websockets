import app from "./app";
import config from "./config/config";
import { connectDB } from "./db";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.PORT, () => {
      console.log("🚀 Server is running on port " + `${config.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();
