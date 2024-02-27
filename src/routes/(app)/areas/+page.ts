import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { LayoutLoad } from '../$types';

export const load: LayoutLoad = async () => {
	redirect(301, `${base}/`);
};
