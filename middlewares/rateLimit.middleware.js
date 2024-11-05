import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 300, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 10 minutes",
});
