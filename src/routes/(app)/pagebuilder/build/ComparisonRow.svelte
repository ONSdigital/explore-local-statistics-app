<script lang="ts">
	import ComparisonPointrange from '$lib/components/charts/ComparisonPointrange.svelte';
	import ComparisonSparkline from '$lib/components/charts/ComparisonSparkline.svelte';
	import { scaleLinear } from 'd3-scale';
	import { parsePeriod, parseData } from '$lib/utils';
	import { Icon, Divider } from '@onsvisual/svelte-components';
	import { ONScolours } from '$lib/config';

	let {
		data,
		metadata,
		selectedAreas,
		comparisonArea,
		formatValue = (d) => d,
		formatPeriod
	} = $props();
	let width = $state(800);
	let leftMargin = $state(0);
	let chosenYear = $state(null); //user will be able to select this

	// find whatever the latest available period with data is for each area
	function getLatestPeriodPerArea(data) {
		const rowCount = data.areacd.length;
		const latestByArea = new Map();

		for (let i = 0; i < rowCount; i++) {
			const areacd = data.areacd[i];
			if (data.value[i] == null) continue;
			const period = parsePeriod(data.period[i]);
			const current = latestByArea.get(areacd);
			if (!Number.isNaN(period.getTime()) && (!current || period > current)) {
				latestByArea.set(areacd, period);
			}
		}
		return latestByArea;
	}
	let latestPerArea = $derived(data ? getLatestPeriodPerArea(data) : new Map());

	function processData(data, chosenYear, standardised, comparisonCd) {
		const areaDataSparkline = [];
		const areaDataPointrange = [];
		const comparisonDataSparkline = [];
		const comparisonDataPointrange = [];
		const pointrangeXDomain = [Infinity, -Infinity];
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
			if (selectedAreas.includes(d.areacd)) {
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
			// filter to desired period (chosen by user or defaults to latest available date for the area indicator)
			const targetPeriod = chosenYear != null ? chosenYear : latestPerArea.get(d.areacd);
			if (
				d.value != null &&
				targetPeriod &&
				d.period.getTime() === parsePeriod(targetPeriod).getTime()
			) {
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
				if (selectedAreas.includes(d.areacd)) {
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
			areaDataSparkline,
			areaDataPointrange,
			comparisonDataSparkline,
			comparisonDataPointrange,
			pointrangeXDomain,
			sparklineXDomain,
			sparklineYDomain
		};
	}

	let {
		areaDataSparkline,
		areaDataPointrange,
		comparisonDataSparkline,
		comparisonDataPointrange,
		pointrangeXDomain,
		sparklineXDomain,
		sparklineYDomain
	} = $derived(processData(data, chosenYear, metadata?.standardised, comparisonArea.areacd));

	let areaCodes = $derived([...new Set(areaDataSparkline.map((d) => d.areacd))]);

	let areasData = $derived.by(() => {
		const rowsByArea = new Map();

		for (const d of areaDataSparkline) {
			if (!rowsByArea.has(d.areacd)) {
				rowsByArea.set(d.areacd, { areacd: d.areacd, areanm: d.areanm, rows: [] });
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
		if (!cd || !xScale) return null;

		const hasInterval = cd.lci_95 != null && cd.uci_95 != null;

		return {
			left: hasInterval ? xScale(cd.lci_95) : null,
			width: hasInterval ? xScale(cd.uci_95) - xScale(cd.lci_95) : null,
			valueX: cd.value != null ? xScale(cd.value) : null
		};
	});

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

	let CIsStyle = $derived(areaDataPointrange.some((d) => d.lci_95 != null && d.uci_95 != null));
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
				{formatPeriod(sparklineXDomain[1])} value
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
			<button class="table-sort-button" on:click={() => toggleSort('diff')}>
				Trend since {formatPeriod(sparklineXDomain[0])}
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
		</div>
	</div>

	<Divider marginTop={false} marginBottom={false} mode="dark"></Divider>
	<div class="rows-wrapper" style:margin-top="10px" style:padding-top="25px">
		{#if comparisonBar}
			<div class="comparison-overlay" style:left="{comparisonOffset}px">
				<div class="comparison-name" style:left="{comparisonBar.valueX}px">
					{comparisonDataPointrange[0].areanm}: {prefix}{formatValue(
						comparisonDataPointrange[0].value
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
					<div
						class="comparison-reference-line"
						style:left="{comparisonBar.valueX - 2.5 / 2}px"
					></div>
				{/if}
			</div>
		{/if}
		{#each sortedAreasData as area, i (area.areacd)}
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
					{area.pointrangeRow?.period &&
					sparklineXDomain[1] &&
					area.pointrangeRow.period.getTime() !== sparklineXDomain[1].getTime()
						? `(${formatPeriod(area.pointrangeRow.period)})`
						: ''}
				</div>
				<p class="area-value" use:updateValueWidth={area.areacd}>
					{prefix}{formatValue(area.pointrangeRow?.value)}{suffix}
				</p>
				<ComparisonPointrange
					data={area.pointrangeRow}
					xDomain={pointrangeXDomain}
					chartWidth={pointRangeWidth}
					{CIsStyle}
				/>
				<ComparisonSparkline
					data={area.rows}
					yDomain={sparklineYDomain}
					comparisonData={comparisonRows}
					xDomain={sparklineXDomain}
					{prefix}
					{suffix}
					{formatValue}
					chartWidth={sparklineWidth}
				/>
			</div>
		{/each}
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
