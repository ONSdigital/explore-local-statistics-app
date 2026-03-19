// NOTE: This endpoint exists to ensure that files in the $lib/data folder are included in the SvelteKit build
// These files are read by server-side functions that are called on the API endpoints
import type { RequestHandler } from './$types';
import { read } from '$app/server';
import { json, error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { join } from 'path';
import { files, paths } from '$lib/data';

export const GET: RequestHandler = ({ params }) => {
	const file = params.file;
	const path = paths.find((p) => p.endsWith(`/${file}`));
	if (!path) error(404, 'File not found');

	if (process.env.IS_NETLIFY) {
		const asset = readFileSync(join(process.cwd(), `src/lib/data/${file}`));
		const data = JSON.parse(asset);
		return json(data);
	}
	return read(files[path]);
};
