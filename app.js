import "./config/instrument.js";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import userRouter from "./routes/user.routes.js";
import eventRouter from "./routes/event.routes.js";
import projectRouter from "./routes/project.routes.js";
import labelRouter from "./routes/label.routes.js";
import songRouter from "./routes/song.routes.js";
import todoRouter from "./routes/todo.routes.js";
import folderRouter from "./routes/folder.routes.js";
import fileRouter from "./routes/file.routes.js";
import expenseRouter from "./routes/expense.routes.js";
import budgetRouter from "./routes/budget.routes.js";
import bookMarkRouter from "./routes/bookmark.routes.js";
import { limiter } from "./middlewares/rateLimit.middleware.js";
import logger from "./utils/logger.js";
import delayMiddleware from "./middlewares/delay.middleware.js";
import * as Sentry from "@sentry/node";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://daily-driver-frontend.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(helmet());
app.use(cookieParser());

// rate limit middleware
app.use(limiter);

app.use(delayMiddleware);

app.use("/api/v1/user", userRouter);
app.use("/api/v1/event", eventRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/label", labelRouter);
app.use("/api/v1/songs", songRouter);
app.use("/api/v1/todos", todoRouter);
app.use("/api/v1/folders", folderRouter);
app.use("/api/v1/files", fileRouter);
app.use("/api/v1/expense", expenseRouter);
app.use("/api/v1/budget", budgetRouter);
app.use("/api/v1/bookmarks", bookMarkRouter);
// app.get("/debug-sentry", function mainHandler(req, res) {
//   console.error("sentry error");
//   throw new Error("My first Sentry error!");
// });

Sentry.setupExpressErrorHandler(app);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error(err.stack);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app };
