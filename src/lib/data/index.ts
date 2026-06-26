// Check if environment is Vite
const vite = !!import.meta.env;

// Set file reader function depending on environment
const readJSON = vite
	? await (async () => {
			const { read } = await import('$app/server');
			return async (path) => {
				const file = read(path);
				return await file.json();
			};
		})()
	: await (async () => {
			const { readFileSync } = await import('node:fs');
			return async (path) => {
				const file = readFileSync(files[path]);
				return JSON.parse(file);
			};
		})();

// Import directory reader if environment is not Vite
const readdirSync = vite ? await (async () => {
    const { readdirSync } = await import('node:fs');
    return readdirSync;
})() : () => [];

// Find all the data files in this directory (will be bundled into build)
export const files = vite
	? import.meta.glob(['./*.json', './*.xlsx', './*.gz'], {
			query: '?url',
			import: 'default',
			eager: true
		})
	: Object.fromEntries(
			readdirSync('./src/lib/data')
				.filter((file) => file.endsWith('.json'))
				.map((file) => [file, `./src/lib/data/${file}`])
		);
export const paths = Object.keys(files);

// Read a JSON data file from disk or return cached version
const cache = {};
export default async function (key) {
	const path = paths.find((p) => p.endsWith(`/${key}.json`));
	if (!path) return { error: 404, message: 'File not found.' };

	if (cache[key]) return cache[key];
	const data = await readJSON(files[path]);
	cache[key] = data;

	return data;
}
