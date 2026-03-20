// NOTE: This endpoint exists to ensure that files in the $lib/data folder are included in the SvelteKit build
// These files are read by server-side functions that are called on the API endpoints
import type { RequestHandler } from './$types';
import { read } from '$app/server';
import { error } from '@sveltejs/kit';
import { files, paths } from '$lib/data';

export const GET: RequestHandler = ({ params }) => {
	const file = params.file === 'all-datasets.json' ? 'json-stat.json' : params.file;
	const path = paths.find((p) => p.endsWith(`/${file}`));
	if (!path) error(404, 'File not found');

	return read(files[path]);
};
