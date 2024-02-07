<script lang="ts">
	//@ts-nocheck
	import { createEventDispatcher } from 'svelte';

	export let data;
	export let hovered = null;
	export let selected = null;
	export let lineWidth = 3;
	export let height = 15;
	export let breaks;
	export let colors = [
		'rgba(234,236,177,.8)',
		'rgba(169,216,145,.8)',
		'rgba(0,167,186,.8)',
		'rgba(0,78,166,.8)',
		'rgba(0,13,84,.8)'
	];
	export let formatTick = (d) => d.toFixed(0);
	export let prefix = '';
	export let suffix = '';
	export let snapTicks = true;

	const dispatch = createEventDispatcher();

	const pos = (val, breaks) => {
		let i = 0;
		while (val > breaks[i + 1]) i += 1;
		let unit = 100 / (breaks.length - 1);
		let offset = (val - breaks[i]) / (breaks[i + 1] - breaks[i]);
		return (i + offset) * unit;
	};

	const doHover = (e, d = null) => {
		if (d === null) hovered = null;
		else hovered = d.areacd;
		dispatch('hover', { id: hovered, d, e });
	};

	const doSelect = (e, d) => {
		selected = d.areacd;
		dispatch('select', { id: selected, d, e });
	};

	const makeCells = (data) => {
		const sortIndex = Array.from(data.keys()).sort((a, b) => data[a] - data[b]);
		const reverseIndex = Array.from(data.keys()).map((i) => sortIndex.indexOf(i));
		const cells = sortIndex
			.map((i) => data[i])
			.map((d, i, arr) => {
				const prev = i === 0 ? d : (d + arr[i - 1]) / 2;
				const next = i === arr.length - 1 ? d : (d + arr[i + 1]) / 2;
				return [prev, next];
			});
		return reverseIndex.map((i) => cells[i]);
	};

	$: cells = makeCells(data.map((d) => d.value));
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container" style:height="{height}px" on:mouseleave={doHover}>
	{#each breaks.slice(1) as brk, i}
		<div
			class="block"
			style:width="{100 / (breaks.length - 1)}%"
			style:left="{i * (100 / (breaks.length - 1))}%"
			style:background-color={colors[i]}
		/>
		<div class="line" style:left="{i * (100 / (breaks.length - 1))}%" />
		<div
			class="tick"
			style:left="{i * (100 / (breaks.length - 1))}%"
			style:transform="translateX({i == 0 && snapTicks ? '-2px' : '-50%'})"
		>
			{formatTick(breaks[i])}
		</div>
	{/each}
	<div class="line" style:right="0" />
	<div class="tick" style:right="0" style:transform="translateX({snapTicks ? '2px' : '50%'})">
		{prefix}{formatTick(breaks[breaks.length - 1])}{suffix}
	</div>
	{#each data as d, i (d.areacd)}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="block"
			style:width="{pos(cells[i][1], breaks) - pos(cells[i][0], breaks)}%"
			style:left="{pos(cells[i][0], breaks)}%"
			on:mouseenter={(e) => doHover(e, d)}
			on:click={(e) => doSelect(e, d)}
		/>
		{#if hovered === d.areacd}
			<div
				class="marker"
				style:width="{lineWidth}px"
				style:left="calc({pos(d.value, breaks)}% - {lineWidth / 2}px)"
			/>
			<div class="value">{d.areanm}, {prefix}{formatTick(d.value)}{suffix}</div>
		{:else if selected === d.areacd && selected !== hovered}
			<div
				class="marker"
				style:width="{lineWidth}px"
				style:left="calc({pos(d.value, breaks)}% - {lineWidth / 2}px)"
				style:opacity={hovered ? 0.4 : 1}
			/>
			{#if !hovered}<div class="value">{d.areanm}, {prefix}{formatTick(d.value)}{suffix}</div>{/if}
		{/if}
	{/each}
</div>

<style>
	.container {
		margin: 30px 0 24px 0;
		box-sizing: border-box;
		position: relative;
		width: 100%;
		font-size: 14px;
	}
	.block {
		position: absolute;
		top: 0;
		height: 100%;
	}
	.line {
		position: absolute;
		top: 0;
		height: calc(100% + 10px);
		border-left: solid 1px black;
	}
	.tick {
		position: absolute;
		z-index: 1;
		top: calc(100% + 8px);
		text-align: center;
		transform: translateX(-50%);
	}
	.marker {
		position: absolute;
		z-index: 2;
		top: -5px;
		width: 0;
		height: 0;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-top: 18px solid currentColor;
		pointer-events: none;
		transform: translateX(-8px);
	}
	.value {
		font-size: 16px;
		position: absolute;
		top: -30px;
		text-align: center;
		/* transform: translateX(-50%); */
		background-color: rgba(255, 255, 255, 0.8);
	}
	.marker-hovered {
		color: orange;
	}
</style>
