<script lang="ts">
	import ComparisonPointrange from '$lib/components/charts/ComparisonPointrange.svelte';
	import ComparisonSparkline from '$lib/components/charts/ComparisonSparkline.svelte';

	let { data } = $props();
	let width = $state(500);
	let leftMargin = $state(30);
	let height = $derived(100);

	function getLatestData(data) {
		const keys = Object.keys(data);
		const rowCount = data.period.length;

		const latestIndex = {};
		for (let i = 0; i < rowCount; i++) {
			const areacd = data.areacd[i];
			const period = data.period[i];

			if (!(areacd in latestIndex) || period > data.period[latestIndex[areacd]]) {
				latestIndex[areacd] = i;
			}
		}

		return Object.values(latestIndex).map((i) =>
			Object.fromEntries(keys.map((key) => [key, data[key][i]]))
		);
	}

	let latestData = $derived(data ? getLatestData(data) : null);
	let xValueRange = $derived.by(() => {
		if (!latestData?.length) return null;

		const allValues = latestData.flatMap((d) =>
			[d.value, d.lci_95, d.uci_95].filter((v) => v != null)
		);

		if (!allValues.length) return null;

		return [Math.min(...allValues), Math.max(...allValues)];
	});
	$inspect(data);
</script>

<div
	bind:clientWidth={width}
	class="pointrange-individual-list"
	style:padding-left="{leftMargin}px"
	style:padding-bottom="3px"
	style:padding-top="20px"
>
	{#each latestData as d, i}
		<span>{d.areanm}</span>
		<ComparisonPointrange data={d} xDomain={xValueRange} />
	{/each}
	<ComparisonSparkline data={data[0]}></ComparisonSparkline>
</div>
