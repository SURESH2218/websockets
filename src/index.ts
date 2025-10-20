import app from "./app";
import { connectDB } from "./db";
import { createServer } from "http";
import config from "./config/config";
import { initializeSocket } from "./config/socket";

const httpServer = createServer(app);
const io = initializeSocket(httpServer);

app.set("io", io);

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(config.PORT, () => {
      console.log("🚀 Server is running on port " + `${config.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();
