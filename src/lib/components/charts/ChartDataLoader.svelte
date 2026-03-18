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
	let data: jsonDataCols | errorObject | null = $state.raw(null);

	async function fetchData(dataUrl: string, visible: boolean) {
		if (!visible) return;
		if (!dataUrl) {
			data = { message: 'Data not available' };
			onUpdate(data);
			return;
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

				data = fetchedData;
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
