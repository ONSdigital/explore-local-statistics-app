<script lang="ts">
	import Spinner from '../visuals/Spinner.svelte';

	let { chart, dataUrl, id = dataUrl, visible = true, noDataMessage = null } = $props();

	let loadedDataUrl: string | null = null;
	let loadedData: jsonDataCols | errorObject | null = null;

	async function fetchData(dataUrl: string, visible: boolean) {
		if (!visible && loadedData) return loadedData;
		else if (!visible) return null;
		if (dataUrl !== loadedDataUrl) {
			console.log(`Loading data for ${id}`);
			loadedDataUrl = dataUrl;
			try {
				loadedData = await (await fetch(dataUrl)).json();
				console.log(`Loaded data for ${id}`);
				return loadedData;
			} catch {
				console.log(`Failed to load data for ${id}`);
				return { message: 'Failed to load chart data' };
			}
		} else return loadedData;
	}
	// svelte-ignore await_waterfall
	let data = $derived(await fetchData(dataUrl, visible));
</script>

{#if data?.message}
	<p class="ons-u-fs-s">{noDataMessage || data.message}</p>
{:else if data}
	{@render chart(data)}
{:else}
	<Spinner message="Loading chart data" />
{/if}
