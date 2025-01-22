import autoAdapter from '@sveltejs/adapter-auto';
import nodeAdapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// we made a SVELTEKIT_BASE_PATH var so we can specify the app base path in production
const basePath = process.env.SVELTEKIT_BASE_PATH || '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.

		// we made a SVELTEKIT_ADAPTER var so we can specify the adapter from CI/CD
		adapter: process.env.SVELTEKIT_ADAPTER === 'node' ? nodeAdapter() : autoAdapter(),
		paths: {
			base: basePath
		}
	}
};

export default config;
