<script>
	import { createEventDispatcher } from 'svelte';

	import Thumb from './Thumb.svelte';
	const dispatch = createEventDispatcher();

	export let timePeriodsArray;
	export let range = true;
	export let min = 0;
	export let max = 100;
	export let format = (d) => d;
	export let step = 1;
	export let value = [2010, 2020];
	export let order = false;

	export let disabled = false;
	export let showBar = true;

	let pos;
	let active = false;
	let focusLeft = false;
	let focusRight = false;

	$: ticksCount = Math.floor((max - min) / step);
	$: if (active) setValue(pos);
	$: if (!active) setPos(value);
	$: if (range && order && active) pos = checkPos(pos);
	$: min, max, clamp();
	$: progress = `
    left: ${range ? Math.min(pos[0], pos[1]) * 100 : 0}%;
    right: ${100 - Math.max(pos[0], range ? pos[1] : pos[0]) * 100}%;
  `;
	function setValue(pos) {
		const offset = min % step;
		const width = max - min;
		let newvalue = pos
			.map((v) => min + v * width)
			.map((v) => Math.round((v - offset) / step) * step + offset);

		// If timePeriodsArray is provided, check if all selected values exist
		if (timePeriodsArray) {
			const valid = newvalue.every((val) => timePeriodsArray.some((el) => el.xDomainNumb === val));

			if (!valid) {
				console.warn('Invalid time period(s) selected, dispatch skipped:', newvalue);
				return;
			}
		}

		value = Array.isArray(value) ? newvalue : newvalue[0];
		dispatch('input', value);
	}
	function setPos(value) {
		pos = Array.isArray(value)
			? value.map((v) => Math.min(Math.max(v, min), max)).map((v) => (v - min) / (max - min))
			: [(value - min) / (max - min), 0];
		dispatch('input', value);
	}
	function checkPos(pos) {
		return [Math.min(...pos), Math.max(...pos)];
	}
	function clamp() {
		setPos(value);
		setValue(pos);
	}
	$: multipleTimePeriodsSelected = Math.min(...value) != Math.max(...value);
</script>

{#if range}
	<span
		>{multipleTimePeriodsSelected ? 'Selected time periods range:' : 'Selected time period:'}
		<strong
			>{timePeriodsArray
				? timePeriodsArray.find((el) => el.xDomainNumb === Math.min(...value)).label
				: format(Math.min(...value))}</strong
		>
		{#if multipleTimePeriodsSelected}
			to
			<strong
				>{timePeriodsArray
					? timePeriodsArray.find((el) => el.xDomainNumb === Math.max(...value)).label
					: format(Math.max(...value))}</strong
			>
		{/if}
	</span>
{/if}
<div class="track">
	<div class="ticks">
		<div class="tick tick-left">
			{timePeriodsArray ? timePeriodsArray[timePeriodsArray.length - 1].label : min}
		</div>
		{#each Array.from(Array(ticksCount).keys()) as i}
			<div class="tick tick-mid" style:left="{100 * (i / ticksCount)}%" />
		{/each}
		<div class="tick tick-right">{timePeriodsArray ? timePeriodsArray[0].label : max}</div>
	</div>
	{#if showBar}
		<div class="progress" style={progress} />
	{/if}
	{#if !disabled}
		<Thumb bind:pos={pos[0]} on:active={({ detail: v }) => (active = v)}>
			<slot name="left">
				<slot>
					<div class="thumb" class:focus={focusLeft} />
				</slot>
			</slot>
		</Thumb>
		{#if range}
			<Thumb bind:pos={pos[1]} on:active={({ detail: v }) => (active = v)}>
				<slot name="right">
					<slot>
						<div class="thumb" class:focus={focusRight} />
					</slot>
				</slot>
			</Thumb>
		{/if}
	{/if}
</div>
<input
	type="range"
	class="visuallyhidden"
	on:focus={() => (focusLeft = true)}
	on:blur={() => (focusLeft = false)}
	bind:value={value[0]}
	{min}
	max={value[1] - 1}
	{step}
	{disabled}
	aria-label="Selected time period minimum"
/>
{#if range}
	<input
		type="range"
		class="visuallyhidden"
		on:focus={() => (focusRight = true)}
		on:blur={() => (focusRight = false)}
		bind:value={value[1]}
		min={value[0] + 1}
		{max}
		{step}
		{disabled}
		aria-label="Selected time period maximum"
	/>
{/if}

<style>
	/* input {
    display: none;
  } */
	.track {
		margin: 8px 0 40px;
		position: relative;
		height: 4px;
		width: 100%;
		border-radius: 100vh;
		background: var(--track-bg, #ebebeb);
	}
	.progress {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		border-radius: 100vh;
		background: var(--progress-bg, #206095);
		opacity: 0.7;
	}
	.thumb {
		width: 16px;
		height: 16px;
		border-radius: 100vh;
		background: var(--thumb-bg, #206095);
	}
	.thumb:hover {
		background: #003c57;
		transition: 0.2s background;
		-webkit-transition: 0.2s background;
		-moz-transition: 0.2s background;
	}
	.thumb:focus {
		outline: 3px solid #fbc900;
	}
	.focus {
		background: #003c57;
		outline: 3px solid #fbc900;
	}
	.ticks {
		display: contents;
		font-size: 16px;
	}
	.tick {
		position: absolute;
		height: 36px;
		top: 6px;
		padding: 0 2px;
		border-left: 1px solid grey;
	}
	.tick-left {
		left: 0;
		padding-top: 16px;
	}
	.tick-mid {
		height: 6px;
	}
	.tick-right {
		right: 0;
		padding-top: 16px;
		border-left: none;
		border-right: 1px solid grey;
	}
</style>
