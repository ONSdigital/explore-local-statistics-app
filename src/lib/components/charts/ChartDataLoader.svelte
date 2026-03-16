<script lang="ts">
	import Spinner from '../visuals/Spinner.svelte';
	import { extremeAreas } from '$lib/config';
	import { filterExtremeAreas, parseData } from '$lib/utils';

	let {
		chart,
		dataUrl,
		id = dataUrl,
		visible = true,
		noDataMessage = null,
		indicator = null,
		onUpdate = (data) => null
	} = $props();

	let loadedDataUrl: string | null = null;
	let loadedData: jsonDataCols | errorObject | null = null;

	async function fetchData(dataUrl: string, visible: boolean) {
		if (!visible) return loadedData;
		if (!dataUrl) {
			loadedData = { message: 'Data not available' };
			return loadedData;
		}
		if (dataUrl !== loadedDataUrl) {
			loadedDataUrl = dataUrl;
			try {
				let fetchedData = await (await fetch(dataUrl)).json();

				if (indicator && extremeAreas[indicator] && !fetchedData.message) {
					const rows = parseData(fetchedData);
					const filtered = filterExtremeAreas(rows, extremeAreas[indicator]);

					const cols = Object.keys(fetchedData);
					fetchedData = {};
					for (const col of cols) {
						fetchedData[col] = filtered.map((row) => row[col]);
					}
				}

				loadedData = fetchedData;
				console.log(`Loaded data for ${id}`);
				return loadedData;
			} catch {
				console.log(`Failed to load data for ${id}`);
				loadedData = { message: 'Failed to load chart data' };
				return loadedData;
			}
		} else return loadedData;
	}
	// svelte-ignore await_waterfall
	let data = $derived(await fetchData(dataUrl, visible));
	$effect(() => onUpdate(data));
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
