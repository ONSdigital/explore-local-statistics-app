import type { Handle, HandleServerError } from '@sveltejs/kit';
import logger from '$lib/logger';

// hook up the logger
// console.log = (...args) => logger.info(...args);
// console.info = (...args) => logger.info(...args);
// console.warn = (...args) => logger.warn(...args);
// console.error = (...args) => logger.error(...args);

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// remove the Link header if it's very long to prevent failure on nginx
	// https://github.com/sveltejs/kit/issues/11084
	const link = response.headers.get('Link');
	if (link && link.length > 3700) {
		response.headers.delete('Link');
	}

	return response;
};

// export const handleError: HandleServerError = async ({ status }) => {
// 	return {
// 		message: status === 404 ? "Page not found" : 'Sorry, there is a problem with the service',
// 		errorId: status || 500
// 	};
// };
