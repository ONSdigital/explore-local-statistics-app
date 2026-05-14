import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const now = Date();
	return json({
		now,
		status: 'OK',
		version: {
			// build_time: '2025-12-12T12:14:36Z',
			// git_commit: 'eaa6b6fe98d6b0a224b4c1c5b2f2191f3b0d6b8b',
			git_commit: process.env.COMMIT_HASH || process.env.SVELTEKIT_APP_VERSION || 'unknown'
			// language: 'go',
			// language_version: 'go1.24.11',
			// version: 'v1.108.1'
		}
		// uptime: 176335176,
		// start_time: '2026-03-09T15:44:48.140303855Z',
	});
};
