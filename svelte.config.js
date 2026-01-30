import vercelAdapter from '@sveltejs/adapter-vercel';
import nodeAdapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// custom var to specify the adapter from CI/CD
const adapter = !!process.env.VERCEL ? vercelAdapter() : nodeAdapter();
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
		// only set the app version if we are given one
		...(appVersion && { version: { name: appVersion } })
	},

	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
