<script lang="ts">
	import { parseBeeswarmData, getPaletteColor, getMarkerPath } from './chartHelpers';
	import { ONScolours } from '$lib/config';

	let {
		data,
		metadata,
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

	let keyboardMode = $state(false);

	let _data = $derived(parseBeeswarmData(data, xKey, idKey, metadata?.slug === '4g-coverage')); // this should be done in the metatdata
	let _sorted = $derived(_data ? [..._data.array].sort((a, b) => a[xKey] - b[xKey]) : null);
	let _selected = $derived(
		_data ? selected.map((cd, i) => ({ i, datum: _data.keyed[cd] })).filter((d) => d.datum) : []
	);
	let _hovered = $derived(_data ? _data.keyed[hovered] : null);

	function getSelectedIndex(data, id) {
		const index = data.findIndex((d) => d[idKey] === id);
		return index === -1 ? 0 : index;
	}
	let activeIndex = $derived(_sorted ? getSelectedIndex(_sorted, selected[0]) : 0);
	let comparison = $derived.by(() => {
		const val1 = _data?.keyed?.[selected[0]]?.[xKey];
		const val2 = _data?.keyed?.[selected[1]]?.[xKey];
		if (!val1 || !val2) return null;
		const diff = val1 - val2;
		return diff > _data.mad ? 'Higher than' : diff < -_data.mad ? 'Lower than' : 'Similar to';
	});

	let labelPos = $state(null);
	function labelDodge(el, params) {
		if (el?.getBoundingClientRect && el?.parentElement) {
			const rect = el.getBoundingClientRect();
			const parent = el.parentElement.getBoundingClientRect();
			const toPercent = (val) => (100 * val) / parent.width;

			const leftDiff = parent.left - rect.left - 6;
			const rightDiff = parent.right - rect.right + 6;
			let offset = leftDiff > 0 ? toPercent(leftDiff) : rightDiff < 0 ? toPercent(rightDiff) : 0;
			let x = params.d.x + offset;

			labelPos = { x, rect };
		}
		return { destroy: () => (labelPos = null) };
	}

	function doKeydown(e) {
		if (['ArrowLeft', 'ArrowDown'].includes(e.key) && activeIndex !== 0) {
			activeIndex -= 1;
			_hovered = _sorted[activeIndex];
		}
		if (['ArrowRight', 'ArrowUp'].includes(e.key) && activeIndex !== _sorted.length - 1) {
			activeIndex += 1;
			_hovered = _sorted[activeIndex];
		}
	}
</script>

{#snippet point(d, radius = 8, color)}
	<g class="beeswarm-point" transform="translate({d.x} {100 - d.y})" opacity={color ? 1 : 0.9}>
		<polyline points="0,0 0,0" stroke={ONScolours.white} stroke-width={radius + 2} />
		<polyline points="0,0 0,0" stroke={color || ONScolours.grey40} stroke-width={radius} />
		<polyline
			points="0,0 0,0"
			stroke={color || ONScolours.grey20}
			stroke-width={radius - 2}
			onmouseenter={() => (hovered = d[idKey])}
		/>
	</g>
{/snippet}

{#snippet line(d, i, color)}
	{@const offsetX = labelPos?.x ?? d.x}
	<polyline
		points="{d.x},{100 - (selected.includes(d[idKey]) ? 0 : d.y)} {d.x},0"
		stroke={color}
		stroke-width="2"
	/>
{/snippet}

{#snippet marker(d, markerInfo, color)}
	<svg
		viewBox="-4 -4 8 8"
		class="beeswarm-marker"
		style:left="{d.x}%"
		onmouseenter={() => (hovered = d[idKey])}
		onmouseleave={() => (hovered = null)}
	>
		<defs>
			<clipPath id="clip-{markerInfo.name}-{d[idKey]}">
				<path d={markerInfo.path} />
			</clipPath>
		</defs>
		<path
			d={markerInfo.path}
			fill={ONScolours.white}
			stroke={ONScolours.white}
			stroke-width={1.5}
			vector-effect="non-scaling-stroke"
		/>
		<path
			d={markerInfo.path}
			fill={markerInfo.hollow ? ONScolours.white : color}
			stroke={markerInfo.hollow ? color : ONScolours.white}
			stroke-width={markerInfo.hollow ? 5.5 : 1}
			vector-effect="non-scaling-stroke"
			clip-path="url(#clip-{markerInfo.name}-{d[idKey]})"
		/>
	</svg>
{/snippet}

{#snippet confidenceRect(d, i, color)}
	{#if showIntervals && i === 0 && d.lci_95 != null && d.uci_95 != null}
		{@const valueToX = (val) =>
			((val - _data.domain[0]) / (_data.domain[1] - _data.domain[0])) * 100}
		{@const lciX = d.lci_95 < _data.domain[0] ? valueToX(_data?.domain[0]) : valueToX(d.lci_95)}
		{@const uciX = d.uci_95 > _data.domain[1] ? valueToX(_data.domain[1]) : valueToX(d.uci_95)}
		<rect x={lciX} y="90" width={uciX - lciX} height="20" fill={color} opacity="0.5" />
		<rect x={lciX} y="90" width="1" height="20" fill={color} />
		<rect x={uciX - 1} y="90" width="1" height="20" fill={color} />
	{/if}
{/snippet}

{#snippet label(d, i, color, showName = false)}
	{#key d}
		{@const xPos = labelPos?.x ?? d.x}
		{@const floatRight = xPos > 50}
		<div
			class="beeswarm-label"
			aria-live="assertive"
			style:background={i === 0 ? color : 'rgba(255, 255, 255, 0.4)'}
			style:color={i === 0 ? ONScolours.white : color}
			style:left={!floatRight ? `${xPos}%` : null}
			style:right={floatRight ? `${100 - xPos}%` : null}
			style:transform="translateX({floatRight ? 50 : -50}%)"
			use:labelDodge={{ i, d }}
		>
			{#if showName}{d[labelKey]},{/if}
			{valuePrefix}{formatValue(d[xKey])}{valueSuffix}
		</div>
	{/key}
{/snippet}

{#if selected.length == 1}
	<p class="ons-u-vh">
		Distribution chart showing values for {metadata.label} ({metadata.subText}). The value for {_data
			?.keyed?.[selected[0]]?.[labelKey]} was
		{formatValue(_data?.keyed?.[selected[0]]?.[xKey])}.
	</p>
{:else}
	<p class="ons-u-vh">
		Distribution chart showing values for {metadata.label} ({metadata.subText}). The value for {_data
			?.keyed?.[selected[0]]?.[labelKey]} was {formatValue(_data?.keyed?.[selected[0]]?.[xKey])},
		the value for {_data?.keyed?.[selected[1]]?.[labelKey]} was {formatValue(
			_data?.keyed?.[selected[1]]?.[xKey]
		)}
	</p>
{/if}

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="beeswarm-wrapper"
	class:keyboard-mode={keyboardMode}
	tabindex="0"
	onfocus={() => {
		keyboardMode = true;
		_hovered = _sorted[activeIndex];
	}}
	onblur={() => {
		keyboardMode = false;
		_hovered = null;
		activeIndex = getSelectedIndex(_sorted, selected[0]);
	}}
	onmousedown={(e) => e.preventDefault()}
	onkeydown={doKeydown}
	role="figure"
>
	<div class="beeswarm-chart" aria-hidden="true">
		<svg viewBox="0 0 100 100" class="beeswarm-svg" preserveAspectRatio="none">
			{#if _data}
				<g class="beeswarm-points" onmouseleave={() => (hovered = null)}>
					{#each _data.array as d (d[idKey])}
						{@render point(d)}
					{/each}
				</g>
				<g class="beeswarm-selected">
					{#each [..._selected].reverse() as sel}
						{@const d = { ...sel.datum, y: 0 }}
						{#if !_hovered && sel.i === 0}
							{@render line(d, sel.i, getPaletteColor(sel.i, selected.length))}
							{@render confidenceRect(d, sel.i, getPaletteColor(sel.i, selected.length))}
						{/if}
					{/each}
				</g>
				<g class="beeswarm-hovered">
					{#if _hovered}
						{@const d = _hovered}
						{@render line(d, 0, ONScolours.highlightOrangeDark)}
						{#if !selected.includes(_hovered[idKey])}
							{@render point(d, 14, ONScolours.highlightOrangeDark)}
						{/if}
					{/if}
				</g>
			{/if}
		</svg>
		<div class="beeswarm-annotations">
			{#if _data}
				{#if _hovered}
					{@render label(_hovered, 0, ONScolours.highlightOrangeDark, true)}
				{/if}
				{#each _selected as d, i}
					{@const color =
						d.datum[idKey] === _hovered?.[idKey]
							? ONScolours.highlightOrangeDark
							: getPaletteColor(d.i, selected.length)}
					{#if i === 0 && !_hovered}{@render label(d.datum, i, color, false)}{/if}
					{@render marker(d.datum, getMarkerPath(d.i, selected.length), color)}
				{/each}
			{/if}
		</div>
	</div>
	<p class="beeswarm-comparison ons-u-fs-s">
		{#if keyboardMode}
			Use the arrow keys to move through the different areas
		{:else if comparison}
			{comparison}
			<strong style:color={getPaletteColor(1, selected.length, 'text')}
				>{_data?.keyed?.[selected[1]]?.[labelKey]}</strong
			>
			in {formatPeriod(_data?.array?.[0]?.[periodKey])}
		{:else}
			No data for comparison area
		{/if}
	</p>
	<p class="indicator-confidence ons-u-fs-s" aria-hidden="true">
		{#if showIntervals && _data?.keyed?.[selected[0]] && (_data.keyed[selected[0]].lci_95 == null || _data.keyed[selected[0]].lci_95 === '')}
			Confidence intervals not available
		{/if}
	</p>
</div>

<style>
	.beeswarm-wrapper {
		display: block;
		position: relative;
		margin: 0 0 20px;
		padding: 26px 6px 7px;
		border-radius: 2px;
	}
	.beeswarm-wrapper:focus {
		outline: 2px solid var(--ons-color-text);
		box-shadow:
			6px 6px var(--ons-color-focus),
			6px -6px var(--ons-color-focus),
			-6px -6px var(--ons-color-focus),
			-6px 6px var(--ons-color-focus);
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
		padding: 4px 6px;
		border-radius: 4px;
		font-weight: bold;
		line-height: 1.2;
	}
	.beeswarm-marker {
		position: absolute;
		pointer-events: all;
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
	.keyboard-mode {
		pointer-events: none;
	}
</style>
