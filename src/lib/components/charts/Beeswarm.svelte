<script lang="ts">
	import { parseBeeswarmData, getPaletteColor, getMarkerPath } from './chartHelpers';

	let {
		data,
		xKey = 'value',
		idKey = 'areacd',
		labelKey = 'areanm',
		periodKey = 'period',
		formatPeriod = (d) => d,
		formatValue = (d) => d,
		valuePrefix = null,
		valueSuffix = null,
		showIntervals = false,
		selected = [],
		hovered = $bindable()
	} = $props();

	let _data = $derived(parseBeeswarmData(data, xKey, idKey));
	let _selected = $derived(
		_data ? selected.map((cd, i) => ({ i, datum: _data.keyed[cd] })).filter((d) => d.datum) : []
	);
	let _hovered = $derived(_data ? _data.keyed[hovered] : null);
	let comparison = $derived.by(() => {
		const val1 = _data?.keyed?.[selected[0]]?.[xKey];
		const val2 = _data?.keyed?.[selected[1]]?.[xKey];
		if (!val1 || !val2) return null;
		const diff = val1 - val2;
		return diff > _data.mad ? 'Higher than' : diff < -_data.mad ? 'Lower than' : 'Similar to';
	});

	const labels = $state({});
	function labelDodge(el, params) {
		const rect = el.getBoundingClientRect();
		const parent = el.parentElement.getBoundingClientRect();
		const toPercent = (val) => (100 * val) / parent.width;

		const leftDiff = parent.left - rect.left;
		const rightDiff = parent.right - rect.right;
		let offset = leftDiff > 0 ? toPercent(leftDiff) : rightDiff < 0 ? toPercent(rightDiff) : 0;
		let x = params.d.x + offset;

		if (params.i > 0 && labels[0]) {
			const sibling = labels[0].rect;
			const overlap = sibling.left < rect.right && sibling.right > rect.left;
			if (overlap) {
				const sibX = labels[0].x;
				const labelsOffset = toPercent((rect.width + sibling.width + 6) / 2);
				x = x > sibX ? sibX + labelsOffset : sibX - labelsOffset;
			}
		}
		labels[params.i] = { x, rect };
		return { destroy: () => (labels[params.i] = null) };
	}
</script>

{#snippet point(d, radius = 8, color)}
	<g class="beeswarm-point" transform="translate({d.x} {100 - d.y})" opacity={color ? 1 : 0.9}>
		<polyline points="0,0 0,0" stroke="white" stroke-width={radius + 2} />
		<polyline points="0,0 0,0" stroke={color || '#aaa'} stroke-width={radius} />
		<polyline
			points="0,0 0,0"
			stroke={color || '#ddd'}
			stroke-width={radius - 2}
			onmouseenter={() => (hovered = d[idKey])}
		/>
	</g>
{/snippet}

{#snippet line(d, i, color)}
	{@const offsetX = labels?.[i]?.x ?? d.x}
	<polyline
		points="{d.x},{100 - d.y} {d.x},{(100 - d.y) / 3} {offsetX},{(100 - d.y) / 3} {offsetX},0"
		stroke={color}
		stroke-width="2"
	/>
{/snippet}

{#snippet marker(d, path, color)}
	<svg viewBox="-4 -4 8 8" class="beeswarm-marker" style:left="{d.x}%">
		<path d={path} fill={color} vector-effect="non-scaling-stroke" />
	</svg>
{/snippet}

{#snippet confidenceRect(d, i, color)}
	{#if showIntervals && i === 0 && d.lci_95 != null && d.uci_95 != null}
		{@const valueToX = (val) =>
			((val - _data.domain[0]) / (_data.domain[1] - _data.domain[0])) * 100}
		{@const lciX = valueToX(d.lci_95)}
		{@const uciX = valueToX(d.uci_95)}
		<rect x={lciX} y="90" width={uciX - lciX} height="20" fill={color} opacity="0.5" />
		<rect x={lciX} y="90" width="1" height="20" fill={color} />
		<rect x={uciX - 1} y="90" width="1" height="20" fill={color} />
	{/if}
{/snippet}

{#snippet label(d, i, color, showName = false)}
	{#key d[idKey]}
		<div
			class="beeswarm-label"
			style:background={i === 0 ? color : 'rgba(255, 255, 255, 0.4)'}
			style:color={i === 0 ? 'white' : color}
			style:left="{labels?.[i]?.x ?? d.x}%"
			use:labelDodge={{ i, d }}
		>
			{#if showName}{d[labelKey]},{/if}
			{valuePrefix}{formatValue(d[xKey])}{valueSuffix}
		</div>
	{/key}
{/snippet}

<div class="beeswarm-wrapper">
	<div class="beeswarm-chart">
		<svg viewBox="0 0 100 100" class="beeswarm-svg" preserveAspectRatio="none">
			{#if _data}
				<g class="beeswarm-points" onmouseleave={() => (hovered = null)}>
					{#each _data.array as d (d[idKey])}
						{@render point(d)}
					{/each}
				</g>
				<g class="beeswarm-selected">
					{#each _selected as sel, i}
						{@const d = { ...sel.datum, y: 0 }}
						{#if !hovered && i < 2}
							{@render line(d, i, getPaletteColor(sel.i, _selected.length))}
							{@render confidenceRect(d, i, getPaletteColor(sel.i, _selected.length))}
						{/if}
					{/each}
				</g>
				<g class="beeswarm-hovered">
					{#if _hovered}
						{@const d = _hovered}
						{@render line(d, 0, 'orange')}
						{@render point(d, 14, 'orange')}
					{/if}
				</g>
			{/if}
		</svg>
		<div class="beeswarm-annotations">
			{#if _data}
				{#if _hovered}
					{@render label(_hovered, 0, 'orange', true)}
				{:else}
					{#each _selected as d, i}
						{@const color = getPaletteColor(d.i, _selected.length)}
						{#if i < 2}{@render label(d.datum, i, color, false)}{/if}
						{@render marker(d.datum, getMarkerPath(d.i, _selected.length), color)}
					{/each}
				{/if}
			{/if}
		</div>
	</div>
	<p class="beeswarm-comparison ons-u-fs-s">
		{#if comparison}
			{comparison} <strong>{_data?.keyed?.[selected[1]]?.[labelKey]}</strong> in {formatPeriod(
				_data?.keyed?.[selected[1]]?.[periodKey]
			)}
		{:else}
			Data for comparison area not available
		{/if}
	</p>
	<p class="indicator-confidence ons-u-fs-s">
		{#if showIntervals && _data?.keyed?.[selected[0]] && (_data.keyed[selected[0]].lci_95 == null || _data.keyed[selected[0]].lci_95 === '')}
			Confidence intervals not available
		{/if}
	</p>
</div>

<style>
	.beeswarm-wrapper {
		display: block;
		position: relative;
		margin: 30px 0 20px;
		padding: 0 7px;
	}
	.beeswarm-chart {
		display: block;
		position: relative;
		height: 100%;
		margin: 0;
	}
	.beeswarm-svg {
		display: block;
		width: 100%;
		height: 70px;
		overflow: visible;
	}
	.beeswarm-chart polyline {
		stroke-linecap: round;
		vector-effect: non-scaling-stroke;
		fill: none;
	}
	.beeswarm-selected,
	.beeswarm-hovered,
	.beeswarm-label {
		pointer-events: none;
	}
	.beeswarm-annotations {
		position: absolute;
		pointer-events: none;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
	}
	.beeswarm-label {
		position: absolute;
		bottom: calc(100% - 6px);
		transform: translateX(-50%);
		padding: 4px 6px;
		border-radius: 4px;
		font-weight: bold;
		line-height: 1.2;
	}
	.beeswarm-marker {
		position: absolute;
		bottom: 0;
		width: 20px;
		height: 20px;
		transform: translate(-50%, 50%);
	}
	.beeswarm-comparison {
		display: block;
		text-align: center;
		margin-top: 10px;
	}
	.indicator-confidence {
		display: block;
		text-align: center;
		margin-top: -20px;
	}
</style>
