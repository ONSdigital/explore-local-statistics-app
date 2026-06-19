<script lang="ts">
	import Spinner from '../visuals/Spinner.svelte';
	import { extremeAreas } from '$lib/config';
	import { filterExtremeAreas } from '$lib/utils';

	let {
		chart,
		dataUrl,
		id = dataUrl,
		visible = true,
		noDataMessage = null,
		filterExtremes = true,
		onUpdate = (data) => null
	} = $props();

	let loadedDataUrl: string | null = null;
	let data: jsonDataCols | errorObject | null = $state.raw(null);

	async function fetchData(dataUrl: string, visible: boolean) {
		if (!visible) return;
		if (dataUrl !== loadedDataUrl) {
			loadedDataUrl = dataUrl;
			if (!dataUrl) {
				console.log(`No data for ${id}`);
				data = { message: 'Data not available' };
				onUpdate(data);
				return;
			}

			const indicator = id?.split?.(' ')?.[0];

			try {
				let fetchedData = await (await fetch(dataUrl)).json();

				if (filterExtremes && !fetchedData.message && extremeAreas[indicator]) {
					data = filterExtremeAreas(fetchedData, extremeAreas[indicator]);
				} else data = fetchedData;

				console.log(`Loaded data for ${id}`);
				onUpdate(data);
				return;
			} catch {
				console.log(`Failed to load data for ${id}`);
				data = { message: 'Failed to load chart data' };
				onUpdate(data);
				return;
			}
		}
	}

	$effect(async () => await fetchData(dataUrl, visible));
</script>

{#if data?.message}
	<div class="no-data-message ons-u-fs-s">{noDataMessage || data.message}</div>
{:else if data}
	{@render chart(data)}
{:else}
	<Spinner message="Loading chart data" />
{/if}

<style>
	.no-data-message {
		display: flex;
		align-items: flex-end;
		height: 100%;
		padding-bottom: 24px;
	}
</style>
