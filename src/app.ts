import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import config from "./config/config";

const app = express();

app.use(
  cors({
    origin: config.FRONTEND_DOMAIN,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello from server");
});

app.use(globalErrorHandler);

export default app;
