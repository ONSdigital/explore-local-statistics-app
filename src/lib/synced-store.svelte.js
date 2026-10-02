import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { set } from './db.js';

function syncState(key, val) {
	console.log(`Syncing state: ${key}`, val);
	set(key, val);
}

export default function syncedStore(key, initialValue = null) {
	const { set, update, subscribe } = writable(initialValue);
	syncState(key, $state.snapshot(initialValue));

	return {
		subscribe,
		set: (val) => {
			set(val);
			syncState(key, $state.snapshot(val));
		},
		update
	};
}
