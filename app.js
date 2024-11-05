import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "morgan";
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
import { limiter } from "./middlewares/rateLimit.middleware.js";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from this origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Allow cookies to be sent with requests
  })
);

app.use(express.json({ limit: "30mb" }));

app.use(express.urlencoded({ extended: true, limit: "30mb" }));

app.use(cookieParser());
app.use(logger("dev"));

app.use(limiter);

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

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app };
