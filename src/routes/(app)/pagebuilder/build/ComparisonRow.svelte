<script lang="ts">
	import ComparisonPointrange from '$lib/components/charts/ComparisonPointrange.svelte';
	import ComparisonSparkline from '$lib/components/charts/ComparisonSparkline.svelte';
	import { scaleLinear } from 'd3-scale';
	import { parsePeriod } from '$lib/utils';
	import { Icon, Divider } from '@onsvisual/svelte-components';

	let { data, metadata, comparisonData, formatValue = (d) => d, formatPeriod } = $props();
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

		for (const area of areasMap.values()) {
			area.diff = getDiff(area.rows);
		}

		return Array.from(areasMap.values());
	}

	function getDiff(rows) {
		if (!rows.length) return null;
		const earliest = rows.reduce((a, b) => (a.period < b.period ? a : b));
		const latest = rows.reduce((a, b) => (a.period > b.period ? a : b));
		if (earliest.value == null || latest.value == null) return null;
		return latest.value - earliest.value;
	}

	let areasDataUnsorted = $derived.by(() => {
		if (!data || !latestData) return [];

		const latestValues = new Map(latestData.map((row) => [row.areacd, row.value]));

		return groupByArea(data).sort(
			(a, b) =>
				(latestValues.get(b.areacd) ?? -Infinity) - (latestValues.get(a.areacd) ?? -Infinity)
		);
	});

	let sortColumn = $state('value');
	let sortDirection = $state('descending');

	function toggleSort(column) {
		if (sortColumn !== column) {
			sortColumn = column;
			sortDirection = 'ascending';
		} else {
			sortDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';
		}
	}

	function compareValues(a, b) {
		if (a == null) return -1;
		if (b == null) return 1;
		if (typeof a === 'number' && typeof b === 'number') return a - b;
		return String(a).localeCompare(String(b));
	}

	let areasData = $derived.by(() => {
		const sorted = [...areasDataUnsorted].sort((a, b) =>
			compareValues(a[sortColumn], b[sortColumn])
		);
		return sortDirection === 'descending' ? sorted.reverse() : sorted;
	});

	let comparisonRows = $derived(comparisonData ? (groupByArea(comparisonData)[0]?.rows ?? []) : []);

	const sparklineWidth = 300;
	const colGap = 20;
	const labelMargin = colGap;
	const nColsPreceedingPointrange = 2;

	let valueWidths = $state({});
	let valueWidth = $derived.by(() => {
		const widths = Object.values(valueWidths);
		if (!widths.length) return 70;
		return Math.max(...widths);
	});
	function updateValueWidth(el, index) {
		const update = () => {
			valueWidths[index] = el.getBoundingClientRect().width;
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	let labelWidths = $state({});
	let labelWidth = $derived.by(() => {
		const widthsL = Object.values(labelWidths);
		if (!widthsL.length) return 250;
		return Math.max(...widthsL);
	});
	function updateLabelWidths(el, areacd) {
		const update = () => {
			labelWidths[areacd] = el.getBoundingClientRect().width + labelMargin;
		};

		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	let pointRangeWidth = $derived.by(() => {
		const fixed = leftMargin + labelWidth + valueWidth + sparklineWidth + colGap * 3;
		return Math.max(120, width - fixed);
	});

	let xScale = $derived(
		xValueRange ? scaleLinear().domain(xValueRange).range([0, pointRangeWidth]) : null
	);
	let comparisonOffset = $derived(labelWidth + valueWidth + colGap * nColsPreceedingPointrange);

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
	$inspect(comparisonData);
</script>

<div
	bind:clientWidth={width}
	class="pointrange-individual-list"
	style:padding-left="{leftMargin}px"
	style:padding-bottom="3px"
>
	<div
		class="comparison-row-item comparison-header-row"
		style:grid-template-columns="{labelWidth}px {valueWidth}px {pointRangeWidth}px {sparklineWidth}px"
		style:margin-bottom="10px"
	>
		<div class="header-cell" style:margin-left="{labelMargin}px">
			<button class="table-sort-button" on:click={() => toggleSort('areanm')}>
				Area <Icon type="carret" size="s"></Icon>
			</button>
		</div>
		<div class="header-cell">
			<button class="table-sort-button" on:click={() => toggleSort('value')}>
				{formatPeriod(latestData[0].period)} value <Icon type="carret" size="s"></Icon>
			</button>
		</div>
		<div class="header-cell"></div>
		<div class="header-cell">
			<button class="table-sort-button" on:click={() => toggleSort('diff')}>
				Trend since {formatPeriod(periodRange[0])}
				<Icon type="carret" size="s"></Icon>
			</button>
		</div>
	</div>

	<Divider marginTop={false} marginBottom={false} mode="dark"></Divider>
	<div class="rows-wrapper" style:margin-top="10px" style:padding-top="10px">
		{#if comparisonBar}
			<div class="comparison-overlay" style:left="{comparisonOffset}px">
				<div class="comparison-name" style:left="{comparisonBar.valueX}px">
					{latestComparisonData[0].areanm}: {prefix}{formatValue(
						latestComparisonData[0].value
					)}{suffix}
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
		{#key areasData}
			{#each areasData as area, i (area.areacd)}
				{@const latestDataFiltered = latestData?.find((d) => d.areacd === area.areacd)}
				<div
					class:alternating-row={i % 2 !== 0}
					class="comparison-row-item"
					style:grid-template-columns="{labelWidth}px {valueWidth}px {pointRangeWidth}px {sparklineWidth}px"
				>
					<div
						class="area-name"
						style:margin-left="{labelMargin}px"
						use:updateLabelWidths={area.areacd}
					>
						{area.areanm}
						{parsePeriod(latestDataFiltered.period).getTime() !== periodRange[1].getTime()
							? `(${formatPeriod(latestDataFiltered.period)})`
							: ''}
					</div>
					<p class="area-value" use:updateValueWidth={i}>
						{prefix}{formatValue(latestDataFiltered.value)}{suffix}
					</p>
					<ComparisonPointrange
						data={latestDataFiltered}
						xDomain={xValueRange}
						chartWidth={pointRangeWidth}
					/>
					<ComparisonSparkline
						data={area.rows}
						yDomain={yValueRange}
						comparisonData={comparisonRows}
						xDomain={periodRange}
						{prefix}
						{suffix}
						{formatValue}
						chartWidth={sparklineWidth}
					/>
				</div>
			{/each}
		{/key}
	</div>
</div>

<style>
	.table-sort-button {
		font-weight: bold;
		background: none;
		stroke: none;
		border: none;
	}

	.rows-wrapper {
		position: relative;
	}
	.comparison-row-item {
		position: relative;
		display: grid;
		column-gap: 20px;
		align-items: center;
		justify-content: left;
		width: 100%;
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
		white-space: nowrap;
		z-index: 4;
	}
	.comparison-reference-bar {
		position: absolute;
		top: 20px;
		bottom: 0px;
		background: var(--ons-color-grey-25);
		opacity: 1;
		pointer-events: none;
		z-index: 2;
	}
	.comparison-reference-line {
		position: absolute;
		top: 20px;
		bottom: 0px;
		width: 2.5px;
		background: var(--ons-color-grey-60);
		pointer-events: none;
		z-index: 3;
	}
	.area-value {
		margin: 0;
		font-weight: bold;
		color: var(--ons-color-ocean-blue);
		width: max-content;
		white-space: nowrap;
	}
	.area-name {
		font-weight: 400;
		margin-left: 20px;
		width: fit-content;
		max-width: 250px;
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

	.header-cell {
		overflow: visible;
		white-space: nowrap;
		font-weight: bold;
		font-size: 16px;
	}
</style>
