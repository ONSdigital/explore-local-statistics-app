import autoAdapter from '@sveltejs/adapter-auto';
import nodeAdapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// custom var to specify the adapter from CI/CD
const adapter = process.env.SVELTEKIT_ADAPTER === 'node' ? nodeAdapter() : autoAdapter();
// custom var to specify the app base path in production
const basePath = process.env.SVELTEKIT_BASE_PATH || '';
// custom var to specify the app assets path in production
const assetsPath = process.env.SVELTEKIT_ASSETS_PATH || '';
// custom var to specify the app version in production
const appVersion = process.env.SVELTEKIT_APP_VERSION || '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter,
		paths: {
			assets: assetsPath,
			base: basePath
		},
		version: { name: appVersion }
	}
};

export default config;
