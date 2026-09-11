// `$lib/data`'s Vite-mode reader (`src/lib/data/index.ts`) calls `read()` from
// `$app/server` to load the JSON/XLSX/gzip files bundled from `src/lib/data/`. That
// function only works inside SvelteKit's own dev/build runtime - under plain Vitest it
// throws `__SVELTEKIT_TRACK__ is not defined`, since the tracking hook SvelteKit's Vite
// plugin normally injects isn't present.
//
// This mocks it well enough for tests/benchmarks: it reads the same files directly off
// disk by filename instead of resolving them through Vite's dev/build asset pipeline.
// That's a reasonable stand-in pre-build (the dev-mode URL is just the file path plus a
// query string), but won't match a *built* app, where asset URLs are content-hashed -
// this mock is only valid for `npm run test:unit` / `npm run test:bench`, not for
// exercising the production asset pipeline.
import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('$app/server', () => ({
	read: (url: string) => ({
		async json() {
			const filename = url.split('/').pop()?.split('?')[0];
			return JSON.parse(readFileSync(resolve('src/lib/data', filename as string), 'utf-8'));
		}
	})
}));
