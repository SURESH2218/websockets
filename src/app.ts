import cors from "cors";
import express from "express";
import config from "./config/config";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes";
import conversationRouter from "./routes/conversation.routes";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();

app.use(
  cors({
    origin: config.FRONTEND_DOMAIN,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("hello from server");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/conversations", conversationRouter);

app.use(globalErrorHandler);

export default app;
