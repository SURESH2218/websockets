import cors from "cors";
import express from "express";
import config from "./config/config";
import userRouter from "./routes/user.routes";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();

app.use(
  cors({
    origin: config.FRONTEND_DOMAIN
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello from server");
});

app.use("/api/v1/users", userRouter);

app.use(globalErrorHandler);

export default app;
