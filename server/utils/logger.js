const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({ level: 'info', timestamp: formatTimestamp(), message, ...meta }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({ level: 'warn', timestamp: formatTimestamp(), message, ...meta }));
  },
  error: (message, meta = {}) => {
    console.error(JSON.stringify({ level: 'error', timestamp: formatTimestamp(), message, ...meta }));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({ level: 'debug', timestamp: formatTimestamp(), message, ...meta }));
    }
  },
};
