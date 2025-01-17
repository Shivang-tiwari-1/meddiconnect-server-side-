const { createLogger, format, transports } = require("winston");
const { combine, timestamp, json, colorize, printf } = format;

const consoleLogFormat = combine(
  colorize(),
  printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

const logger = createLogger({
  level: "info",
  format: combine(timestamp(), json()),
  transports: [
    new transports.Console({
      format: consoleLogFormat,
    }),
    new transports.File({ filename: "app.log" }),
  ],
});

module.exports = logger; 
 