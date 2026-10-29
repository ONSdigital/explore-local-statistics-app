<script lang="ts">
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { ONScolours } from '$lib/config';
	import { area, line as d3line, curveLinear } from 'd3-shape';
	import { Icon } from '@onsvisual/svelte-components';
	import { extent } from 'd3-array';

	let {
		data,
		comparisonData,
		formatValue = (d) => d,
		yDomain,
		xDomain,
		prefix,
		suffix,
		valuePeriod,
		allPeriods,
		isMobile
	} = $props();

	// let combined = $derived([...data, ...comparisonData]); currently we are excluding the comparison area from the sparklin when y axis free, so not needed
	let yAxisFree = false;
	let height = 70;
	let padding = 12;

	let xScale = $derived(xDomain ? scaleTime().domain(xDomain).range([0, 100]) : null);
	let yScale = $derived(
		yAxisFree
			? scaleLinear()
					.domain(extent(data.flatMap((d) => [d.value, d.lci_95, d.uci_95])))
					.range([height - padding, padding])
			: yDomain
				? scaleLinear()
						.domain(yDomain)
						.range([height - padding, padding])
				: null
	);

	const hasValue = (d) => d != null && d.value != null;
	const hasCI = (d) => hasValue(d) && d.lci_95 != null && d.uci_95 != null;

	function fillSeries(rows, periods) {
		if (!rows?.length) return [];
		if (!periods?.length) return rows;

		const byTime = new Map(rows.map((r) => [r.period.getTime(), r]));
		return periods.map(
			(period) =>
				byTime.get(period.getTime()) ?? { period, value: null, lci_95: null, uci_95: null }
		);
	}

	function isolatedPoints(filled) {
		return filled.filter(
			(d, i) => hasValue(d) && !hasValue(filled[i - 1]) && !hasValue(filled[i + 1])
		);
	}

	let filledData = $derived(fillSeries(data, allPeriods));
	let filledComparison = $derived(fillSeries(comparisonData, allPeriods));

	let lineGen = $derived(
		d3line()
			.defined(hasValue)
			.x((d) => xScale(d.period))
			.y((d) => yScale(d.value))
			.curve(curveLinear)
	);

	let ciAreaGen = $derived(
		area()
			.defined(hasCI)
			.x((d) => xScale(d.period))
			.y0((d) => yScale(d.lci_95))
			.y1((d) => yScale(d.uci_95))
			.curve(curveLinear)
	);

	let diff = $derived(data[data.length - 1].value - data[0].value);
	let direction = $derived(
		data.length === 1 ? 'no time series' : diff === 0 ? 'no change' : diff < 0 ? 'lower' : 'higher'
	);
	let suffix2 = $derived(suffix === '%' ? ' pp' : suffix);

	let posColBox = '#B6E9FB';
	let negColBox = '#76A2B7';
	let posColText = '#106B8C';
	let negColText = '#00344D';

	let valuePeriodData = $derived(data.filter((d) => d.period.getTime() === valuePeriod.getTime()));

	let changeBoxBg = $derived(
		data.length === 1
			? 'transparent'
			: diff === 0
				? ONScolours.grey25
				: diff > 0
					? posColBox
					: negColBox
	);

	let changeBoxText = $derived(diff === 0 ? ONScolours.black : diff > 0 ? posColText : negColText);
	let showChangeText = $derived(
		!isMobile ? true : diff === 0 ? true : data.length === 1 ? true : false
	);
</script>

{#snippet ribbon(rows, color = ONScolours.grey40, opacity = 0.7)}
	{#if rows?.some(hasCI)}
		<path d={ciAreaGen(rows)} fill={color} stroke="none" {opacity} style:pointer-events="none" />
	{/if}
{/snippet}
{#snippet line(rows, color, dash = 'none', strokewidth = 1.5)}
	{#if rows?.some(hasValue)}
		<path
			d={lineGen(rows)}
			stroke={color}
			stroke-width={strokewidth}
			fill="none"
			stroke-dasharray={dash}
		/>
		{#each isolatedPoints(rows) as d (d.period.getTime())}
			<circle
				cx={xScale(d.period)}
				cy={yScale(d.value)}
				r={2.5}
				fill={color}
				stroke={ONScolours.white}
			/>
		{/each}
	{/if}
{/snippet}
<!-- if wanting to fill in the gaps with a dashed line? -->
{#snippet linedash(rows, color, dash, strokewidth)}
	{#if rows?.length}
		<polyline
			points={rows.map((d) => [xScale(d.period), yScale(d.value)].join(',')).join(' ')}
			stroke={color}
			stroke-width={strokewidth}
			fill="none"
			stroke-dasharray={dash}
		/>
	{/if}
{/snippet}
<div
	class="sparkline-individual"
	style:padding-left="0px"
	style:padding-top="0px"
	style:padding-bottom="0px"
	style:padding-right="0px"
>
	{#if data.length > 1}
		<!-- move if statement to within svg if want to preserve the sparkline spacing??? -->
		<svg viewBox="0 0 100 70" class="sparkline-svg" style:height="70px" overflow="visible">
			<line
				x1={xScale(valuePeriod)}
				x2={xScale(valuePeriod)}
				y1="5"
				y2="80"
				stroke={ONScolours.grey15}
				stroke-width="1.5"
				stroke-dasharray="4"
			>
			</line>
			{#if filledComparison?.length && !yAxisFree}
				{@render ribbon(filledComparison, ONScolours.grey60, 0.3)}
				{@render linedash(comparisonData, ONScolours.grey60, 3, 1)}
				{@render line(filledComparison, ONScolours.grey60, 'none', 1)}
			{/if}
			{#if data?.length}
				{@render ribbon(filledData, ONScolours.oceanBlue, 0.35)}
				{@render linedash(data, ONScolours.oceanBlue, 3, 1)}
				{@render line(filledData, ONScolours.oceanBlue, 'none', 2)}
				{#if valuePeriodData.length}
					<circle
						cx={xScale(valuePeriodData[0]?.period)}
						cy={yScale(valuePeriodData[0]?.value)}
						r="4"
						fill={ONScolours.oceanBlue}
						stroke="white"
					>
					</circle>
				{/if}
			{/if}
		</svg>
	{/if}
	<div
		class="change-box"
		style:padding="5px;"
		style:background-color={changeBoxBg}
		style:color={changeBoxText}
	>
		<div class="change-text">
			{#if diff !== 0}
				<Icon type="arrow" rotation={diff > 0 ? 270 : 90} />
				<strong>{prefix}{formatValue(Math.abs(diff))}{suffix2}</strong>
			{/if}
			{#if showChangeText}
				{direction}
			{/if}
		</div>
	</div>
</div>

<style>
	.sparkline-individual {
		display: flex;
		align-items: center;
		height: 70px;
		width: 100%;
	}
	.sparkline-svg {
		min-width: 0;
		display: block;
		width: auto;
	}
	.change-box {
		flex: 0 0 auto;
		margin-left: 26px;
		/* 20px to match column gap, plus 6 to match the diamond padding around the pointrange */
	}
	@media (max-width: 600px) {
		.change-text {
			margin-right: 5px;
		}
	}
</style>
