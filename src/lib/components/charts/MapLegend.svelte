<script>
	//@ts-nocheck
	import { ONScolours } from '$lib/config';

	let {
		data,
		hovered = $bindable(),
		onHover = () => null,
		selectedAreas = [],
		lineWidth = 3,
		barHeight = 15,
		labelHeight = 20,
		breaks,
		colors = [
			'rgba(234,236,177,.8)',
			'rgba(169,216,145,.8)',
			'rgba(0,167,186,.8)',
			'rgba(0,78,166,.8)',
			'rgba(0,13,84,.8)'
		],
		format = (d) => d.toFixed(0),
		prefix = '',
		suffix = '',
		snapTicks = true,
		markerPadding = 6
	} = $props();

	let container = $state();
	let width = $state();
	let hoveredLabel = $state();
	let hoverLeft = $state();
	let labels = $state([]);

	const pos = (val, breaks) => {
		let i = 0;
		while (val > breaks[i + 1]) i += 1;
		let unit = 100 / (breaks.length - 1);
		let offset = (val - breaks[i]) / (breaks[i + 1] - breaks[i]);
		return (i + offset) * unit;
	};

	const doHover = (e, d = null) => {
		if (d === null) hovered = null;
		else {
			hovered = d.areacd;
		}
		onHover({ id: hovered, d, e });
	};

	const hoverLeftCheck = (el) => {
		hoverLeft = +el?.offsetLeft + +el?.offsetWidth > width;
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

	function positionLabels(selectedData, labels, container) {
		const other = (side) => (side === 'left' ? 'right' : 'left');
		const clash = (lab1, lab2) => {
			const minMax = (l) =>
				l.align === 'right' ? [l.pos, l.pos + l.width] : [l.pos - l.width, l.pos];
			const l1 = minMax(lab1);
			const l2 = minMax(lab2);
			const clash = !(l1[1] < l2[0] || l1[0] > l2[1]);
			return !(l1[1] < l2[0] || l1[0] > l2[1]);
		};

		let maxOffset = 0;
		const filteredLabels = labels.filter((l) => l);
		if (selectedData && container && filteredLabels.length === selectedData.length) {
			const sortIndex = Array.from(selectedData.keys()).sort(
				(a, b) => selectedData[a].value - selectedData[b].value
			);
			const sortedData = sortIndex.map((i) => selectedData[i]);
			const sortedLabels = sortIndex.map((i) => filteredLabels[i]);
			let labs = [];
			const containerLeft = container.offsetLeft || 0;
			const containerRight = containerLeft + container.offsetWidth;
			for (let i = 0; i < sortedLabels.length; i++) {
				const lab = {
					...sortedData[i],
					pos: sortedLabels[i].offsetLeft,
					width: sortedLabels[i].offsetWidth + markerPadding
				};
				const labelLeft = lab.pos;
				const labelRight = lab.pos + lab.width;
				if (labelRight > containerRight) lab.align = 'left';
				else lab.align = 'right';
				labs.push(lab);
			}
			const sides = {
				right: labs.filter((l) => l.align === 'right').reverse(),
				left: labs.filter((l) => l.align === 'left')
			};

			const positionedLabels = [];
			let offset = 0;
			let side = sides.left.length > sides.right.length ? 'left' : 'right';
			while (sides.right.length + sides.left.length > 0) {
				if (sides[side].length === 0) side = other(side);
				const label = sides[side].shift();
				positionedLabels.push({ ...label, offset });
				const next = sides[other(side)].length > 0 ? sides[other(side)][0] : sides[side][0];
				if (next && positionedLabels.filter((p) => p.offset === offset).some((p) => clash(p, next)))
					offset += 1;
				side = other(side);
			}
			maxOffset = offset;
			return {
				labels: selectedData.map((d) => positionedLabels.find((p) => p.areacd === d.areacd)),
				maxOffset
			};
		} else {
			return { labels: [...selectedData], maxOffset };
		}
	}

	let cells = $derived(makeCells(data.map((d) => d.value)));
	let positionedData = $derived(positionLabels(selectedAreas, labels, container, width));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="container"
	style:height="{barHeight}px"
	style:margin-bottom="{24 + (positionedData?.maxOffset || 0) * labelHeight}px"
	onmouseleave={doHover}
	bind:this={container}
	bind:clientWidth={width}
>
	{#each breaks.slice(1) as brk, i}
		<div
			class="block"
			style="width: {100 / (breaks.length - 1)}%; left: {i *
				(100 / (breaks.length - 1))}%; background-color: {colors[i]};"
		></div>
		<div class="line" style="left: {i * (100 / (breaks.length - 1))}%;"></div>
		<div
			class="tick"
			style="left: {i * (100 / (breaks.length - 1))}%; transform: translateX({i == 0 && snapTicks
				? '-2px'
				: '-50%'});"
		>
			{prefix}{format(breaks[i])}{suffix}
		</div>
	{/each}
	<div class="line" style="right: 0;"></div>
	<div class="tick" style="right: 0; transform: translateX({snapTicks ? '2px' : '50%'});">
		{prefix}{format(breaks[breaks.length - 1])}{suffix}
	</div>

	{#key data}
		{#each positionedData?.labels || [] as d, i}
			<div style:opacity={d.areacd === hovered ? null : hovered ? '30%' : null}>
				<div
					class="marker"
					style:width="{lineWidth}px"
					style:left="calc({pos(d.value, breaks)}% - {lineWidth / 2}px)"
					style:bottom="{-20 - (d.offset || 0) * labelHeight}px"
					style:height="calc(100% + {20 + (d.offset || 0) * labelHeight}px)"
					style:background-color={d.areacd === hovered ? ONScolours.highlightOrangeDark : d.color}
				></div>
				<div
					class="value"
					style:left="{pos(d.value, breaks)}%"
					style:bottom="{-labelHeight}px"
					style:transform={d.align === 'left'
						? `translateX(-100%) translateX(1.5px) translateY(${(d.offset || 0) * labelHeight}px)`
						: `translateX(-1.5px) translateY(${(d.offset || 0) * labelHeight}px)`}
					style:color={d.areacd === hovered ? ONScolours.highlightOrangeDark : d.textColor}
					style:padding="0 {markerPadding}px"
					bind:this={labels[i]}
				>
					{d.areanm},
					{prefix}{format(d.value)}{suffix}
				</div>
			</div>
		{/each}
	{/key}
	{#each data as d, i (d.areacd)}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="block"
			style:width="{pos(cells[i][1], breaks) - pos(cells[i][0], breaks)}%"
			style:left="{pos(cells[i][0], breaks)}%"
			onmouseenter={(e) => doHover(e, d)}
		></div>
		{#if hovered === d.areacd && !(selectedAreas[0] && selectedAreas
					.map((s) => s.areacd)
					.includes(d.areacd))}
			<div
				class="marker marker-hovered"
				style="width: {lineWidth}px; left: calc({pos(d.value, breaks)}% - {lineWidth / 2}px);"
			></div>
			<div
				class="value value-hovered"
				style:left="{pos(d.value, breaks)}%"
				style:bottom="{-labelHeight}px"
				style:padding="0 {markerPadding}px"
				style:transform={hoverLeft ? 'translateX(-100%) translateX(1.5px)' : 'translateX(-1.5px)'}
				use:hoverLeftCheck
			>
				{d.areanm},
				{prefix}{format(d.value)}{suffix}
			</div>
		{/if}
	{/each}
</div>

<style>
	.container {
		margin: 32px 0 0 0;
		box-sizing: border-box;
		position: relative;
		width: 100%;
		font-size: 14px;
		forced-color-adjust: none;
	}
	.block {
		position: absolute;
		top: 0;
		height: 100%;
	}
	.line {
		position: absolute;
		bottom: 0;
		height: calc(100% + 10px);
		border-left: solid 1px black;
	}
	.tick {
		position: absolute;
		z-index: 1;
		bottom: calc(100% + 8px);
		text-align: center;
		transform: translateX(-50%);
		forced-color-adjust: auto;
	}
	.marker {
		position: absolute;
		z-index: 2;
		background-color: black;
		box-shadow:
			1px 0 white,
			-1px 0 white;
		pointer-events: none;
		bottom: -22px;
		height: calc(100% + 22px);
	}
	.value {
		position: absolute;
		z-index: 3;
		font-weight: bold;
		line-height: 1.2;
		text-align: center;
		white-space: nowrap;
		paint-order: stroke fill;
		-webkit-text-stroke: 4px white;
	}
	.marker-hovered {
		background-color: var(--ons-color-highlight-orange-dark);
	}
	.value-hovered {
		color: var(--ons-color-highlight-orange-dark);
	}
</style>
