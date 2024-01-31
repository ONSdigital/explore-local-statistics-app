/** @type {import('tailwindcss').Config} */
export default {
	// the standard tailwind "preflight" reset conflicts with the ONS Design System reset
	corePlugins: {
		preflight: false
	},
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: []
};
