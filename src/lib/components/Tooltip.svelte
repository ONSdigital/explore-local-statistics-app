<script>
	export let title;
	export let x;
	export let y;
	export let width;
	export let pos = 'top';

	let w;

	const xPad = 4;

	$: xPos =
		w && x + w / 2 > width - xPad
			? width - w / 2 - xPad
			: w && x - w / 2 < 0 + xPad
				? w / 2 + xPad
				: x;
</script>

{#if title}
	<div
		class="tooltip"
		style:top="{y}px"
		style:left="{xPos}px"
		bind:clientWidth={w}
		style:transform="translate(-50%,{pos === 'top' ? 'calc(-100% - 6px)' : '6px'})"
	>
		{title}
		<div
			class="caret"
			class:caret-bottom={pos == 'bottom'}
			class:caret-top={pos == 'top'}
			style:transform="translateX({w / x + (x - xPos)}px)"
		></div>
	</div>
{/if}

<style>
	.tooltip {
		position: absolute;
		background: #333;
		color: white;
		border-radius: 2px;
		padding: 4px;
		font-size: 0.85em;
		white-space: nowrap;
		pointer-events: none;
	}
	.caret {
		content: ' ';
		position: absolute;
		left: 50%;
		margin-left: -6px;
		border-width: 6px;
		border-style: solid;
		pointer-events: none;
	}
	.caret-bottom {
		bottom: calc(100% - 1px);
		border-color: transparent transparent #333 transparent;
	}
	.caret-top {
		top: calc(100% - 1px);
		border-color: #333 transparent transparent transparent;
	}
</style>
