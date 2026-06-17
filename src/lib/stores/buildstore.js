import { writable } from 'svelte/store';

export const pageBuilderData = writable({
	primaryGeographies: [],
	secondaryGeographies: [],
	indicators: []
});
