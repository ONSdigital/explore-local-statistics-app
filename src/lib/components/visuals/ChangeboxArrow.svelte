<script>
	let { direction = 'up', size = 16 } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 12 14"
	fill="none"
	aria-hidden="true"
	style:transform="rotate({direction === 'up' ? 0 : 180}deg)"
>
	<path
		d="M5.88784 12.25L5.88784 1.25L1.25 5.88784"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke="currentColor"
	/>
	<path
		d="M5.88804 12.25L5.88804 1.25L10.5259 5.88784"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke="currentColor"
	/>
	<path d="..." fill="currentColor" />
</svg>
