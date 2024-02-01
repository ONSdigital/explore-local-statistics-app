/** @type {import('tailwindcss').Config} */
export default {
	// the standard tailwind "preflight" reset conflicts with the ONS Design System reset
	corePlugins: {
		preflight: false
	},
	// hopefully we don't need to make tailwind classes !important - but here's how:
	// important: true,
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: []
};
