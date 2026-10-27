<script lang="ts">
	// @ts-nocheck
	import ComparisonPointrange from '$lib/components/charts/ComparisonPointrange.svelte';
	import ComparisonSparkline from '$lib/components/charts/ComparisonSparkline.svelte';
	import { scaleLinear } from 'd3-scale';
	import { parsePeriod, parseData } from '$lib/utils';
	import { Icon, Divider } from '@onsvisual/svelte-components';
	import { ONScolours } from '$lib/config';
	import { flip } from 'svelte/animate';
	import { sineInOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';

	let {
		filteredData,
		data,
		metadata,
		selectedAreas,
		comparisonArea,
		formatValue = (d) => d,
		formatPeriod,
		selectedPeriod = null,
		yAxisFree
	} = $props();
	let width = $state(800);
	let leftMargin = $state(0);
	let selectedAreaCodes = $derived(selectedAreas.map((d) => d.areacd));

	let areasWithData = $derived([...new Set(data?.areacd)]);
	let areasMissingData = $derived(selectedAreas.filter((d) => !areasWithData.includes(d.areacd)));

	// The period being displayed. Areas without an observation for exactly this period stay blank.
	let latestPeriod = $derived.by(() => {
		if (selectedPeriod) {
			const p = parsePeriod(selectedPeriod);
			if (!Number.isNaN(p.getTime())) return p;
		}

		// Fallback until selectedPeriodRange has been initialised
		if (!filteredData?.areacd || !filteredData.period || !filteredData.value) return null;
		let latest = null;
		for (let i = 0; i < filteredData.areacd.length; i++) {
			if (!selectedAreaCodes.includes(filteredData.areacd[i]) || filteredData.value[i] == null)
				continue;
			const period = parsePeriod(filteredData.period[i]);
			if (!Number.isNaN(period.getTime()) && (!latest || period > latest)) latest = period;
		}
		return latest;
	});

	let selectedKey = $derived(latestPeriod ? formatPeriod(latestPeriod) : null);

	function processDataSparkline(data, standardised, comparisonCd) {
		const areaDataSparkline = [];
		const comparisonDataSparkline = [];
		const sparklineXDomain = [null, null];
		const sparklineYDomain = [Infinity, -Infinity];

		const rows = parseData(data).map((row) => ({
			...row,
			period: parsePeriod(row.period)
		}));
		for (const d of rows) {
			const period = d.period;
			const periodTime = period.getTime();

			// push to the sparkline datasets - comparison
			// generate sparkline domains (remember CIs) - comparison so only if indicator is standardised
			if (d.areacd === comparisonCd) {
				comparisonDataSparkline.push(d);

				if (standardised) {
					for (const v of [d.value, d.lci_95, d.uci_95]) {
						if (v != null) {
							sparklineYDomain[0] = Math.min(sparklineYDomain[0], v);
							sparklineYDomain[1] = Math.max(sparklineYDomain[1], v);
						}
					}
					if (!sparklineXDomain[0] || periodTime < sparklineXDomain[0].getTime())
						sparklineXDomain[0] = period;
					if (!sparklineXDomain[1] || periodTime > sparklineXDomain[1].getTime())
						sparklineXDomain[1] = period;
				}
			}
			if (selectedAreaCodes.includes(d.areacd)) {
				// push to the sparkline datasets - data
				// generate sparkline domains (remember CIs)
				areaDataSparkline.push(d);

				for (const v of [d.value, d.lci_95, d.uci_95]) {
					if (v != null) {
						sparklineYDomain[0] = Math.min(sparklineYDomain[0], v);
						sparklineYDomain[1] = Math.max(sparklineYDomain[1], v);
					}
				}
				if (!sparklineXDomain[0] || periodTime < sparklineXDomain[0].getTime())
					sparklineXDomain[0] = period;
				if (!sparklineXDomain[1] || periodTime > sparklineXDomain[1].getTime())
					sparklineXDomain[1] = period;
			}
		}

		return {
			areaDataSparkline,
			comparisonDataSparkline,
			sparklineXDomain,
			sparklineYDomain
		};
	}

	function processDataPointrange(data, standardised, comparisonCd, selectedKey, formatPeriod) {
		const areaDataPointrange = [];
		const comparisonDataPointrange = [];
		const pointrangeXDomain = [Infinity, -Infinity];

		const rows = parseData(data).map((row) => ({
			...row,
			period: parsePeriod(row.period)
		}));
		for (const d of rows) {
			if (d.value != null && selectedKey && formatPeriod(d.period) === selectedKey) {
				// push to pointrange dataset - comparison
				if (d.areacd === comparisonCd) {
					comparisonDataPointrange.push(d);
					// add comparison to pointrange x domain (remember CIs) but only if standardised
					if (standardised) {
						for (const v of [d.value, d.lci_95, d.uci_95]) {
							if (v != null) {
								pointrangeXDomain[0] = Math.min(pointrangeXDomain[0], v);
								pointrangeXDomain[1] = Math.max(pointrangeXDomain[1], v);
							}
						}
					}
				}
				if (selectedAreaCodes.includes(d.areacd)) {
					// push area to pointrange dataset
					areaDataPointrange.push(d);
					for (const v of [d.value, d.lci_95, d.uci_95]) {
						if (v != null) {
							pointrangeXDomain[0] = Math.min(pointrangeXDomain[0], v);
							pointrangeXDomain[1] = Math.max(pointrangeXDomain[1], v);
						}
					}
				}
			}
		}

		return {
			areaDataPointrange,
			comparisonDataPointrange,
			pointrangeXDomain
		};
	}

	let { areaDataSparkline, comparisonDataSparkline, sparklineXDomain, sparklineYDomain } = $derived(
		processDataSparkline(data, metadata?.standardised, comparisonArea.areacd)
	);

	let { areaDataPointrange, comparisonDataPointrange, pointrangeXDomain } = $derived(
		processDataPointrange(
			data,
			metadata?.standardised,
			comparisonArea.areacd,
			selectedKey,
			formatPeriod
		)
	);
	let allPeriods = $derived.by(() => {
		const rows = [...areaDataSparkline, ...(metadata?.standardised ? comparisonDataSparkline : [])];
		const byTime = new Map();
		for (const d of rows) {
			if (d.value != null) byTime.set(d.period.getTime(), d.period);
		}
		return [...byTime.values()].sort((a, b) => a - b);
	});

	let areasData = $derived.by(() => {
		const rowsByArea = new Map();

		for (const d of areaDataSparkline) {
			if (!rowsByArea.has(d.areacd)) {
				rowsByArea.set(d.areacd, {
					areacd: d.areacd,
					areanm: d.areanm,
					rows: [],
					isMissing: false
				});
			}
			rowsByArea.get(d.areacd).rows.push(d);
		}

		const pointrangeByArea = new Map(areaDataPointrange.map((d) => [d.areacd, d]));

		for (const group of rowsByArea.values()) {
			group.pointrangeRow = pointrangeByArea.get(group.areacd) ?? null;

			const earliest = group.rows.reduce((a, b) => (a.period < b.period ? a : b));
			const latest = group.rows.reduce((a, b) => (a.period > b.period ? a : b));
			group.diff =
				earliest.value != null && latest.value != null ? latest.value - earliest.value : null;
		}

		// add in missing areas
		for (const missing of areasMissingData) {
			rowsByArea.set(missing.areacd, {
				areacd: missing.areacd,
				areanm: missing.areanm,
				rows: [],
				pointrangeRow: null,
				diff: null,
				isMissing: true
			});
		}

		return Array.from(rowsByArea.values());
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

	function getSortValue(area, column) {
		if (column === 'value') return area.pointrangeRow?.value ?? null;
		return area[column];
	}

	let sortedAreasData = $derived.by(() => {
		const sorted = [...areasData].sort((a, b) =>
			compareValues(getSortValue(a, sortColumn), getSortValue(b, sortColumn))
		);
		return sortDirection === 'descending' ? sorted.reverse() : sorted;
	});

	let comparisonGroup = $derived.by(() => {
		if (!comparisonDataSparkline.length && !comparisonDataPointrange.length) return null;
		return {
			areacd: comparisonArea?.areacd,
			areanm: comparisonDataSparkline[0]?.areanm ?? comparisonArea?.areanm,
			rows: comparisonDataSparkline,
			pointrangeRow: comparisonDataPointrange[0] ?? null
		};
	});

	let comparisonRows = $derived(metadata?.standardised ? (comparisonGroup?.rows ?? []) : []);

	let comparisonBar = $derived.by(() => {
		const cd = comparisonGroup?.pointrangeRow;
		if (!cd || !xScale || !metadata?.standardised) return null;

		const hasInterval = cd.lci_95 != null && cd.uci_95 != null;

		return {
			left: hasInterval ? xScale(cd.lci_95) : null,
			width: hasInterval ? xScale(cd.uci_95) - xScale(cd.lci_95) : null,
			valueX: cd.value != null ? xScale(cd.value) : null
		};
	});

	const colGap = 20;
	const labelMargin = $derived(isMobile ? 8 : colGap);
	const nColsPreceedingPointrange = 2;

	let valueWidths = $state({});
	let valueWidth = $derived.by(() => {
		const widths = Object.values(valueWidths);
		if (!widths.length) return 70;
		return Math.max(...widths);
	});
	function updateValueWidth(el, areacd) {
		const update = () => {
			valueWidths[areacd] = el.getBoundingClientRect().width;
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return {
			destroy() {
				observer.disconnect();
				delete valueWidths[areacd];
			}
		};
	}
	let isMobile = $derived(width < 600);
	let maxLabelWidth = $derived(isMobile ? 150 : 250);

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
				delete labelWidths[areacd];
			}
		};
	}

	let sparklineWidths = $state({});
	let sparklineWidth = $derived.by(() => {
		const widths = Object.values(sparklineWidths);
		if (!widths.length) return 300; // fallback until first measure
		return Math.max(...widths);
	});
	function updateSparklineWidth(el, areacd) {
		const update = () => {
			sparklineWidths[areacd] = el.getBoundingClientRect().width;
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return {
			destroy() {
				observer.disconnect();
				delete sparklineWidths[areacd];
			}
		};
	}
	let pointRangeWidth = $derived.by(() => {
		const fixed = leftMargin + labelWidth + valueWidth + sparklineWidth + colGap * 3;
		return Math.max(120, width - fixed);
	});
	let contentWidth = $derived(
		labelWidth + valueWidth + pointRangeWidth + sparklineWidth + colGap * 3
	);

	let xScale = $derived(
		pointrangeXDomain ? scaleLinear().domain(pointrangeXDomain).range([0, pointRangeWidth]) : null
	);

	let comparisonOffset = $derived(labelWidth + valueWidth + colGap * nColsPreceedingPointrange);

	let suffix = $derived(metadata?.suffix);
	let prefix = $derived(metadata?.prefix);

	function sortIconFill(column) {
		if (sortColumn !== column) {
			return {
				upperFill: ONScolours.grey75,
				lowerFill: ONScolours.grey75
			};
		}

		return sortDirection === 'ascending'
			? { upperFill: ONScolours.grey75, lowerFill: ONScolours.grey25 }
			: { upperFill: ONScolours.grey25, lowerFill: ONScolours.grey75 };
	}

	let valuePeriod = $derived(latestPeriod);
	let CIsStyle = $derived(areaDataPointrange.some((d) => d.lci_95 != null && d.uci_95 != null));

	let nameWidth = $state(0);
	let labelHeight = $state(0);

	// keep the label inside the point range column
	let nameLeft = $derived.by(() => {
		const x = comparisonBar?.valueX ?? 0;
		const half = nameWidth / 2;
		const min = half - 5;
		const max = pointRangeWidth - half + 5;
		return Math.max(min, Math.min(x, max));
	});

	const rowsPaddingTop = 35;
	// how far the arrow tip reaches into the first row
	let firstRowInset = $derived(Math.max(0, labelHeight + 8 - rowsPaddingTop));
	$inspect(sortedAreasData);
</script>

<div
	bind:clientWidth={width}
	class="pointrange-individual-list"
	style:padding-left="{leftMargin}px"
	style:padding-bottom="3px"
	style:width="100%"
	style:overflow-x="auto"
	style:-webkit-overflow-scrolling="touch"
>
	<div
		class="comparison-row-item comparison-header-row"
		style:grid-template-columns="{labelWidth}px {valueWidth}px {pointRangeWidth}px {sparklineWidth}px"
		style:margin-bottom="10px"
		style:min-width="{contentWidth}px"
	>
		<div class="header-cell" style:margin-left="{labelMargin}px">
			<button class="table-sort-button" on:click={() => toggleSort('areanm')}>
				Area
				<svg
					class="ons-icon"
					viewBox="0 0 12 19"
					xmlns="http://www.w3.org/2000/svg"
					focusable="false"
					fill="currentColor"
					role="img"
					aria-hidden="true"
				>
					<path
						class="ons-topTriangle"
						fill={sortIconFill('areanm').upperFill}
						d="M6 0l6 7.2H0L6 0zm0 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
					/>
					<path
						class="ons-bottomTriangle"
						fill={sortIconFill('areanm').lowerFill}
						d="M6 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
					/>
				</svg>
			</button>
		</div>
		<div class="header-cell">
			<button class="table-sort-button" on:click={() => toggleSort('value')}>
				{formatPeriod(valuePeriod)} value
				<svg
					class="ons-icon"
					viewBox="0 0 12 19"
					xmlns="http://www.w3.org/2000/svg"
					focusable="false"
					fill="currentColor"
					role="img"
					aria-hidden="true"
				>
					<path
						class="ons-topTriangle"
						fill={sortIconFill('value').upperFill}
						d="M6 0l6 7.2H0L6 0zm0 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
					/>
					<path
						class="ons-bottomTriangle"
						fill={sortIconFill('value').lowerFill}
						d="M6 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
					/>
				</svg>
			</button>
		</div>
		<div class="header-cell"></div>
		<div class="header-cell">
			{#if sparklineXDomain[0] !== sparklineXDomain[1]}
				<button class="table-sort-button" on:click={() => toggleSort('diff')}>
					Trend {formatPeriod(sparklineXDomain[0])} to {formatPeriod(sparklineXDomain[1])}

					<svg
						class="ons-icon"
						viewBox="0 0 12 19"
						xmlns="http://www.w3.org/2000/svg"
						focusable="false"
						fill="currentColor"
						role="img"
						aria-hidden="true"
					>
						<path
							class="ons-topTriangle"
							fill={sortIconFill('diff').upperFill}
							d="M6 0l6 7.2H0L6 0zm0 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
						/>
						<path
							class="ons-bottomTriangle"
							fill={sortIconFill('diff').lowerFill}
							d="M6 18.6l6-7.2H0l6 7.2zm0 3.6l6 7.2H0l6-7.2z"
						/>
					</svg>
				</button>
			{:else}
				Trend
			{/if}
		</div>
	</div>

	<!-- <Divider marginTop={false} marginBottom={false} mode="dark" width="full"></Divider> -->
	<hr style:min-width="{contentWidth}px" />
	<div
		class="rows-wrapper"
		style:margin-top="10px"
		style:padding-top="{rowsPaddingTop}px"
		style:min-width="{contentWidth}px"
	>
		{#if comparisonBar}
			<div class="comparison-overlay" style:left="{comparisonOffset}px">
				<div
					class="comparison-name"
					bind:clientWidth={nameWidth}
					bind:clientHeight={labelHeight}
					style:left="{nameLeft}px"
				>
					{comparisonDataPointrange[0].areanm}: {prefix}{formatValue(
						comparisonDataPointrange[0].value
					)}{suffix}
				</div>
				<svg
					class="comparison-arrow"
					width="12"
					height="8"
					viewBox="0 0 12 8"
					aria-hidden="true"
					style:left="{comparisonBar?.valueX ?? 0}px"
					style:top="{labelHeight}px"
				>
					<path d="M0 0 L12 0 L6 8 Z" fill="var(--ons-color-grey-25)" />
				</svg>
			</div>
		{/if}
		{#each sortedAreasData as area, i (area.areacd)}
			<div
				animate:flip={{
					delay: 200,
					duration: prefersReducedMotion.current ? 0 : 900,
					easing: sineInOut
				}}
				// class:alternating-row={i % 2 !== 0}
				class="comparison-row-item"
				style:grid-template-columns="{labelWidth}px {valueWidth}px {pointRangeWidth}px {sparklineWidth}px"
				style:border-bottom="0.5px solid {ONScolours.grey35}"
			>
				<div
					class="area-name"
					style:margin-left="{labelMargin}px"
					style:max-width="{maxLabelWidth}px"
					use:updateLabelWidths={area.areacd}
				>
					{area.areanm}
				</div>
				{#if area.pointrangeRow?.value != null}
					<p class="area-value" use:updateValueWidth={area.areacd}>
						{prefix}{formatValue(area.pointrangeRow.value)}{suffix}
					</p>
				{:else if !area.isMissing}
					<p class="area-value" use:updateValueWidth={area.areacd}>-</p>
				{:else}
					<p></p>
				{/if}
				<ComparisonPointrange
					data={area.isMissing ? null : area.pointrangeRow}
					comparisonData={metadata?.standardised ? comparisonGroup?.pointrangeRow : null}
					xDomain={pointrangeXDomain}
					chartWidth={pointRangeWidth}
					{CIsStyle}
					refInset={i === 0 ? firstRowInset : 0}
					{formatPeriod}
					{valuePeriod}
					fullSeriesMissing={area.isMissing}
				/>
				{#if !area.isMissing}
					<div class="sparkline-cell" use:updateSparklineWidth={area.areacd}>
						<ComparisonSparkline
							data={area.rows}
							yDomain={sparklineYDomain}
							comparisonData={comparisonRows}
							xDomain={sparklineXDomain}
							{valuePeriod}
							{prefix}
							{suffix}
							{formatValue}
							{yAxisFree}
							{allPeriods}
							{isMobile}
						/>
					</div>
				{:else}
					<div class="data-unavilable">Data unavailable</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	hr {
		overflow-x: auto;
		margin-top: 10px;
	}

	.data-unavilable {
		grid-column: 4;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--ons-color-grey-75);
		min-height: 70px;
	}
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

	.comparison-arrow {
		position: absolute;
		transform: translateX(-50%);
		z-index: 4;
		display: block;
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
		width: max-content;
		overflow-wrap: anywhere;
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
	.comparison-row-item > :global(.pointrange-individual) {
		position: relative;
		z-index: 5;
	}

	.header-cell {
		overflow: visible;
		white-space: nowrap;
		font-weight: bold;
		font-size: 16px;
	}

	.sparkline-cell {
		grid-column: 4;
		width: max-content;
		position: relative;
		z-index: 5;
	}
</style>
