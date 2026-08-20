<script lang="ts">
	import ComparisonPointrange from '$lib/components/charts/ComparisonPointrange.svelte';
	import ComparisonSparkline from '$lib/components/charts/ComparisonSparkline.svelte';
	import { scaleLinear } from 'd3-scale';
	import { parsePeriod } from '$lib/utils';

	let { data, metadata, comparisonData, formatValue = (d) => d } = $props();
	let width = $state(800);
	let leftMargin = $state(15);

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
		return [parsePeriod(earliest), parsePeriod(latest)];
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
				keys.map((key) => [key, key === 'period' ? parsePeriod(data[key][i]) : data[key][i]])
			);
			areasMap.get(areacd).rows.push(row);
		}

		return Array.from(areasMap.values());
	}

	let areasData = $derived.by(() => {
		if (!data || !latestData) return [];

		const latestValues = new Map(latestData.map((row) => [row.areacd, row.value]));

		return groupByArea(data).sort(
			(a, b) =>
				(latestValues.get(b.areacd) ?? -Infinity) - (latestValues.get(a.areacd) ?? -Infinity)
		);
	});
	let comparisonRows = $derived(comparisonData ? (groupByArea(comparisonData)[0]?.rows ?? []) : []);

	const labelWidth = 180;
	const pointRangeWidth = 320;
	const valueWidth = 70;
	let xScale = $derived(
		xValueRange ? scaleLinear().domain(xValueRange).range([0, pointRangeWidth]) : null
	);
	let comaprisonOffset = $derived(labelWidth + valueWidth + 40 + leftMargin); //20 is the colgap, and is third column so needs to be 2 * 20

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

	let suffix = $derived(metadata?.suffix);
	let prefix = $derived(metadata?.prefix);
	$inspect(areasData);
</script>

<div
	bind:clientWidth={width}
	class="pointrange-individual-list"
	style:padding-left="{leftMargin}px"
	style:padding-bottom="3px"
	style:padding-top="20px"
>
	{#if comparisonBar}
		<div class="comparison-overlay" style:left="{comaprisonOffset}px">
			<div class="comparison-name" style:left="{comparisonBar.valueX}px">
				{latestComparisonData[0].areanm}: {prefix}
				{formatValue(latestComparisonData[0].value)}{suffix}
			</div>
			{#if comparisonBar.left != null}
				<div
					class="comparison-reference-bar"
					style:left="{comparisonBar.left}px"
					style:width="{comparisonBar.width}px"
				></div>
			{/if}
			{#if comparisonBar.valueX != null}
				<div class="comparison-reference-line" style:left="{comparisonBar.valueX}px"></div>
			{/if}
		</div>
	{/if}
	{#each areasData as area, i}
		<div
			class:alternating-row={i % 2 !== 0}
			class="comparison-row-item"
			style:grid-template-columns="{labelWidth}px {valueWidth}px {pointRangeWidth}px auto"
		>
			<div class="area-name">{area.areanm}</div>
			<p class="area-value">
				{prefix}{formatValue(latestData.find((d) => d.areacd === area.areacd).value)}{suffix}
			</p>
			<ComparisonPointrange
				data={latestData.find((d) => d.areacd === area.areacd)}
				xDomain={xValueRange}
				{pointRangeWidth}
			/>
			<ComparisonSparkline
				data={area.rows}
				yDomain={yValueRange}
				comparisonData={comparisonRows}
				xDomain={periodRange}
				{prefix}
				{suffix}
				{formatValue}
			/>
		</div>
	{/each}
</div>

<style>
	.comparison-row-item {
		position: relative;
		display: grid;
		column-gap: 20px;
		align-items: center;
		justify-content: left;
		width: max-content;
	}
	.comparison-overlay {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 1;
	}

	.pointrange-individual-list {
		position: relative;
	}

	.comparison-name {
		position: absolute;
		transform: translateX(-50%);
		text-align: center;
		padding: 5px;
		background-color: var(--ons-color-grey-25);
		top: 0;
		white-space: nowrap;
		z-index: 4;
	}
	.comparison-reference-bar {
		position: absolute;
		top: 50px;
		bottom: 30px;
		background: var(--ons-color-grey-25);
		opacity: 1;
		pointer-events: none;
		z-index: 2;
	}
	.comparison-reference-line {
		position: absolute;
		top: 50px;
		bottom: 30px;
		width: 2.5px;
		background: var(--ons-color-grey-60);
		pointer-events: none;
		z-index: 3;
	}
	.area-value {
		margin: 0;
		font-weight: bold;
		color: var(--ons-color-night-blue);
	}
	.area-name {
		font-weight: 400;
		margin-left: 20px;
	}
	.sparkline-svg,
	.pointrange-svg {
		display: block;
	}
	.alternating-row {
		background-color: var(--ons-color-grey-5);
	}
	.comparison-row-item > .area-name,
	.comparison-row-item > .area-value,
	.comparison-row-item > :global(.pointrange-individual),
	.comparison-row-item > :global(.sparkline-individual) {
		position: relative;
		z-index: 5;
	}
</style>
