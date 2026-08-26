import { writable } from 'svelte/store';
import { get, set } from './db.js';

function syncState(key, val) {
	console.log(`Syncing state: ${key}`, val);
	set(key, val);
}

export default function syncedStore(key, initialValue = null) {
	const { set, update, subscribe } = writable(initialValue);

	return {
		subscribe,
		set: (val) => {
			set(val);
			syncState(key, $state.snapshot(val));
		},
		update
	};
}
