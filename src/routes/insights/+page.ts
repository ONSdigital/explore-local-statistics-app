import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	// example "universal" load function...
	// this doesn't actually make an HTTP request when it runs on the server!
	const response = await fetch('/api/alive');
	return await response.json();
};
