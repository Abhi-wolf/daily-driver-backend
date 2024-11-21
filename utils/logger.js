import { createLogger, format, transports } from "winston";
const { combine, timestamp, json, colorize } = format;

// Custom format for console logging with colors
const consoleLogFormat = format.combine(
  format.colorize(),
  format.printf(({ level, message, timestamp, ...metadata }) => {
    // return `${level}: ${message}`;
    return `${timestamp} [${level}] : ${message} ${JSON.stringify(
      metadata,
      null,
      2
    )}`;
  })
);

// Create a Winston logger
const logger = createLogger({
  level: "info",
  format: combine(colorize(), timestamp(), json()),
  transports: [
    new transports.Console({
      format: consoleLogFormat,
    }),
  ],
});

export default logger;
