import logger from '$lib/logger';

console.log = (...args) => logger.info(...args);
console.info = (...args) => logger.info(...args);
console.warn = (...args) => logger.warn(...args);
console.error = (...args) => logger.error(...args);
