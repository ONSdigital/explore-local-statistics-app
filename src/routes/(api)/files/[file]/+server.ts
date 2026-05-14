// NOTE: This endpoint exists to ensure that files in the $lib/data folder are included in the SvelteKit build
// These files are read by server-side functions that are called on the API endpoints
import type { RequestHandler } from './$types';
import { read } from '$app/server';
import { error } from '@sveltejs/kit';
import { files, paths } from '$lib/data';

function parseFilename(file) {
	if (file.endsWith('.csv')) return `${file}.gz`;
	return file;
}

export const GET: RequestHandler = ({ params }) => {
	const file = parseFilename(params.file);
	const path = paths.find((p) => p.endsWith(`/${file}`));
	if (!path) error(404, 'File not found');

	const response = read(files[path]);
	if (file.endsWith('.gz')) response.headers.set('Content-Encoding', 'gzip');
	return response;
};
