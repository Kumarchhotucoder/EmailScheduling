export const logger = {
  info: (msg, ...meta) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, ...meta);
  },
  warn: (msg, ...meta) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, ...meta);
  },
  error: (msg, ...meta) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, ...meta);
  },
  debug: (msg, ...meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${msg}`, ...meta);
    }
  },
};
