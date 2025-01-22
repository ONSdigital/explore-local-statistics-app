import autoAdapter from '@sveltejs/adapter-auto';
import nodeAdapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// we made a SVELTEKIT_ADAPTER var so we can specify the adapter from CI/CD
const adapter = process.env.SVELTEKIT_ADAPTER === 'node' ? nodeAdapter() : autoAdapter();

// we made a SVELTEKIT_BASE_PATH var so we can specify the app base path in production
const basePath = process.env.SVELTEKIT_BASE_PATH || '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter,
		paths: {
			base: basePath
		}
	}
};

export default config;
