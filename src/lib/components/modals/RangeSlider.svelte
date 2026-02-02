<script lang="ts">
	let { label, options, selectedRange = $bindable(), formatTick = (d) => d } = $props();

	let selectedIndices = $state([
		options.indexOf(selectedRange[0]) ?? 0,
		options.indexOf(selectedRange[1]) ?? options.length - 1
	]);
	let xPercent = $state([0, 100]);
	let dragging = $state([false, false]);
	let focused = $state([false, false]);

	let scale = $derived((i) => (i * 100) / (options.length - 1));

	function updateRange() {
		selectedRange[0] = options[selectedIndices[0]];
		selectedRange[1] = options[selectedIndices[1]];
	}

	function handleDrag(el, i) {
		const parent = el.parentElement;

		let xDomain;

		const dragover = (e) => {
			const clamp = (val) => (val < 0 ? 0 : val > 100 ? 100 : val);
			xPercent[i] = clamp(((e.clientX - xDomain[0]) * 100) / (xDomain[1] - xDomain[0]));
		};

		el.addEventListener('dragstart', (e) => {
			console.log('dragstart');
			dragging[i] = true;
			const rect = parent.getBoundingClientRect();
			xDomain = [Math.round(rect.left), Math.round(rect.right)];
			window.addEventListener('dragover', dragover);
		});
		el.addEventListener('dragend', () => {
			console.log('dragend');
			window.removeEventListener('dragover', dragover);
			dragging[i] = false;
			const newIndex = Math.round((xPercent[i] * (options.length - 1)) / 100);
			if (i === 0 && newIndex > selectedIndices[1]) {
				selectedIndices[0] = selectedIndices[1];
				selectedIndices[1] = newIndex;
			} else if (i === 1 && newIndex < selectedIndices[0]) {
				selectedIndices[1] = selectedIndices[0];
				selectedIndices[0] = newIndex;
			} else selectedIndices[i] = newIndex;
			updateRange();
		});
	}
</script>

<fieldset>
	{#if label}<legend
			>{label} <strong>{formatTick(selectedRange[0])}</strong> to
			<strong>{formatTick(selectedRange[1])}</strong></legend
		>{/if}
	<div class="range-container">
		<div class="range-ticks">
			{#each options as tick, i}
				<div
					class="range-tick"
					class:range-tick-end={i === 0 || i === options.length - 1}
					style:left="{scale(i)}%"
				></div>
			{/each}
			{#each [0, options.length - 1] as i}
				<div class="range-tick-text" style={i === 0 ? 'left: 0' : 'right: 0'}>
					{formatTick(options[i])}
				</div>
			{/each}
		</div>
		<div class="range-track">
			<div
				class="range-progress"
				style:left="{dragging[0] ? xPercent[0] : scale(selectedIndices[0])}%"
				style:right="{dragging[1] ? 100 - xPercent[1] : 100 - scale(selectedIndices[1])}%"
			></div>
			{#each [0, 1] as i}
				<div
					class="range-marker"
					class:range-marker-active={dragging[i] || focused[i]}
					style:left="{dragging[i] ? xPercent[i] : scale(selectedIndices[i])}%"
				></div>
				<div
					class="range-marker range-marker-overlay"
					draggable="true"
					style:left="{scale(selectedIndices[i])}%"
					use:handleDrag={i}
				></div>
			{/each}
		</div>
		<input
			type="range"
			name="min"
			class="ons-u-vh"
			min={0}
			max={selectedIndices[1]}
			bind:value={selectedIndices[0]}
			onfocus={() => (focused[0] = true)}
			onblur={() => (focused[0] = false)}
			onchange={updateRange}
		/>
		<input
			type="range"
			name="max"
			class="ons-u-vh"
			min={selectedIndices[0]}
			max={options.length - 1}
			bind:value={selectedIndices[1]}
			onfocus={() => (focused[1] = true)}
			onblur={() => (focused[1] = false)}
			onchange={updateRange}
		/>
	</div>
</fieldset>

<style>
	.range-container {
		display: block;
		position: relative;
		width: 100%;
		height: 64px;
	}
	.range-track {
		position: absolute;
		left: 7px;
		right: 7px;
		top: 7px;
		height: 6px;
		border-radius: 3px;
		background-color: #ddd;
	}
	.range-progress {
		position: absolute;
		top: 0;
		bottom: 0;
		height: 100%;
		background-color: var(--ons-color-branded, #206095);
		opacity: 0.6;
	}
	.range-marker {
		position: absolute;
		top: 3px;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background-color: var(--ons-color-branded, #206095);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
	.range-marker-active {
		outline: 3px solid var(--ons-color-focus, #fbc900);
	}
	.range-marker-overlay {
		background-color: transparent;
		pointer-events: all;
	}
	.range-ticks {
		position: absolute;
		left: 7px;
		right: 7px;
	}
	.range-tick {
		position: absolute;
		top: 15px;
		height: 5px;
		border-left: 1px solid grey;
	}
	.range-tick-end {
		height: 15px;
	}
	.range-tick-text {
		position: absolute;
		margin: -3px;
		top: 30px;
	}
</style>
