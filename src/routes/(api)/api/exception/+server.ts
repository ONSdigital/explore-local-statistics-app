import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	throw 'This is an error';
};
