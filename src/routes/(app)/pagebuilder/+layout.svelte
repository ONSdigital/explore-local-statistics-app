<script>
	//@ts-nocheck
	import { get } from '$lib/db.js';
	import { onMount, setContext } from 'svelte';
	import syncedStore from '$lib/synced-store.svelte';

	let { children } = $props();
	let mounted = $state(false);
	let selectedAreas, selectedIndicator, chosenComparisonArea;

	setContext('selectedAreas', () => selectedAreas);
	setContext('selectedIndicator', () => selectedIndicator);
	setContext('chosenComparisonArea', () => chosenComparisonArea);

	async function init() {
		const data = await Promise.all([
			get('selectedAreas'),
			get('selectedIndicator'),
			get('chosenComparisonArea')
		]);

		selectedAreas = syncedStore('selectedAreas', data[0] || []);
		selectedIndicator = syncedStore('selectedIndicator', data[1] || null);
		chosenComparisonArea = syncedStore('chosenComparisonArea', data[2] || null);

		mounted = true;
	}

	onMount(init);
</script>

{#if mounted}
	{@render children()}
{/if}
