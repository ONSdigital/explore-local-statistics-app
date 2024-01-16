// TODO: delete this on release!

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event);
	response.headers.set('X-Robots-Tag', 'noindex');
	return response;
}
