import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { get, set } from './db.js';

function syncState(key, val) {
	if (!browser) return;
	console.log(`Syncing state: ${key}`, val);
	set(key, val);
}

export default function syncedStore(key, initialValue = null) {
	const { set, update, subscribe } = writable(initialValue);

	const ready = browser
		? get(key)
				.then((storedValue) => {
					if (storedValue !== undefined) set(storedValue);
				})
				.catch(() => {})
		: Promise.resolve(initialValue);

	return {
		subscribe,
		set: (val) => {
			set(val);
			syncState(key, $state.snapshot(val));
		},
		update,
		ready
	};
}
