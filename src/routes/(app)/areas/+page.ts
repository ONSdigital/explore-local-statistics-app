import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

export const load: PageLoad = async () => {
	const path = resolve('/');
	redirect(301, path);
};
