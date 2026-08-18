<script lang="ts">
	import ComparisonPointrange from '$lib/components/charts/ComparisonPointrange.svelte';
	import ComparisonSparkline from '$lib/components/charts/ComparisonSparkline.svelte';
	import { scaleLinear } from 'd3-scale';

	let { data, comparisonData } = $props();
	let width = $state(800);
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
	function mergeDataAndComparisonData(a, b) {
		if (!a) return b;
		if (!b) return a;

		const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

		return Object.fromEntries(
			Array.from(keys).map((key) => [key, [...(a[key] ?? []), ...(b[key] ?? [])]])
		);
	}

	// need to generate ranges based on data including the comparison area!
	let combinedData = $derived(mergeDataAndComparisonData(data, comparisonData));

	let latestData = $derived(data ? getLatestData(data) : null);
	let latestComparisonData = $derived(comparisonData ? getLatestData(comparisonData) : null);
	let latestCombinedData = $derived(combinedData ? getLatestData(combinedData) : null);

	let xValueRange = $derived.by(() => {
		if (!latestCombinedData?.length) return null;

		const allValues = latestCombinedData.flatMap((d) =>
			[d.value, d.lci_95, d.uci_95].filter((v) => v != null)
		);

		if (!allValues.length) return null;

		return [Math.min(...allValues), Math.max(...allValues)];
	});

	// this assumes we want a fixed y axis across all sparklines, rather than free y axes
	let yValueRange = $derived.by(() => {
		if (!combinedData) return null;

		const allValues = [
			...(combinedData.value ?? []),
			...(combinedData.lci_95 ?? []),
			...(combinedData.uci_95 ?? [])
		].filter((v) => v != null);

		if (!allValues.length) return null;

		return [Math.min(...allValues), Math.max(...allValues)];
	});

	let periodRange = $derived.by(() => {
		if (!combinedData?.period?.length) return null;
		let earliest = combinedData.period[0];
		let latest = combinedData.period[0];
		for (const period of combinedData.period) {
			if (period < earliest) earliest = period;
			if (period > latest) latest = period;
		}
		return [new Date(earliest), new Date(latest)];
	});

	function groupByArea(data) {
		const keys = Object.keys(data);
		const rowCount = data.areacd.length;
		const areasMap = new Map();

		for (let i = 0; i < rowCount; i++) {
			const areacd = data.areacd[i];
			if (!areasMap.has(areacd)) {
				areasMap.set(areacd, { areacd, areanm: data.areanm[i], rows: [] });
			}
			const row = Object.fromEntries(
				keys.map((key) => [key, key === 'period' ? new Date(data[key][i]) : data[key][i]])
			);
			areasMap.get(areacd).rows.push(row);
		}

		return Array.from(areasMap.values());
	}

	let areasData = $derived(data ? groupByArea(data) : []);
	let comparisonRows = $derived(comparisonData ? (groupByArea(comparisonData)[0]?.rows ?? []) : []);

	const labelWidth = 200;
	const chartWidth = 300;
	let xScale = $derived(
		xValueRange ? scaleLinear().domain(xValueRange).range([0, chartWidth]) : null
	);

	let comparisonBar = $derived.by(() => {
		const cd = latestComparisonData?.[0];
		if (!xScale || !cd) return null;

		const hasInterval = cd.lci_95 != null && cd.uci_95 != null;

		return {
			left: hasInterval ? xScale(cd.lci_95) : null,
			width: hasInterval ? xScale(cd.uci_95) - xScale(cd.lci_95) : null,
			valueX: cd.value != null ? xScale(cd.value) : null
		};
	});
	$inspect(latestComparisonData);
</script>

<div
	bind:clientWidth={width}
	class="pointrange-individual-list"
	style:padding-left="{leftMargin}px"
	style:padding-bottom="3px"
	style:padding-top="20px"
>
	{#if comparisonBar}
		<div class="comparison-name" style:left="{labelWidth + comparisonBar.valueX}px">
			<span>{latestComparisonData[0].areanm}: {latestComparisonData[0].value}</span>
		</div>
		{#if comparisonBar.left != null}
			<div
				class="comparison-reference-bar"
				style:left="{labelWidth + comparisonBar.left}px"
				style:width="{comparisonBar.width}px"
			></div>
		{/if}
		{#if comparisonBar.valueX != null}
			<div
				class="comparison-reference-line"
				style:left="{labelWidth + comparisonBar.valueX}px"
			></div>
		{/if}
	{/if}
	{#each areasData as area}
		<div
			class="comparison-row-item"
			style:grid-template-columns="{labelWidth}px {chartWidth}px auto"
		>
			<span class="area-name">{area.areanm}</span>
			<ComparisonPointrange
				data={latestData.find((d) => d.areacd === area.areacd)}
				xDomain={xValueRange}
				{chartWidth}
			/>
			<ComparisonSparkline
				data={area.rows}
				yDomain={yValueRange}
				comparisonData={comparisonRows}
				xDomain={periodRange}
			/>
		</div>
	{/each}
</div>

<style>
	.comparison-row-item {
		position: relative;
		z-index: 2;
		display: grid;
		column-gap: 20px;
		align-items: center;
	}

	.pointrange-individual-list {
		position: relative;
	}
	.comparison-name {
		position: absolute;
		transform: translateX(-50%);
		text-align: center;
	}
	.comparison-reference-bar {
		position: absolute;
		top: 50px;
		bottom: 50px;
		background: var(--ons-color-grey-40);
		opacity: 0.6;
		pointer-events: none;
		z-index: 0 !important;
	}
	.comparison-reference-line {
		position: absolute;
		top: 50px;
		bottom: 50px;
		width: 2.5px;
		background: var(--ons-color-grey-60);
		pointer-events: none;
		z-index: 1;
	}
</style>
