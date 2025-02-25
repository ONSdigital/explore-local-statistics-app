import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	esbuild: {
		// remove console.log and debugger statements from production builds
		drop: ['debugger'],
		pure: ['console.log', 'console.error', 'console.warn', 'console.debug', 'console.trace']
	}
});
