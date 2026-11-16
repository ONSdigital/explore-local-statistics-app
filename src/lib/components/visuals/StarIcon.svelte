<script lang="ts">
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let {
		filled = false,
		size = 24,
		strokeWidth = 2
	}: { filled?: boolean; size?: number; strokeWidth?: number } = $props();

	const fill = new Tween(filled ? 1 : 0, { duration: 200, easing: cubicOut });

	let svgEl: SVGSVGElement | undefined = $state();
	let previous = filled;

	$effect(() => {
		fill.target = filled ? 1 : 0;

		if (filled && !previous && svgEl && !prefersReducedMotion.current) {
			svgEl.animate(
				[
					{ transform: 'scale(1.15) rotate(0deg)' },
					{ transform: 'scale(1.35) rotate(12deg)', offset: 0.5 },
					{ transform: 'scale(1) rotate(0deg)' }
				],
				{ duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
			);
		}
		previous = filled;
	});
</script>

<svg
	bind:this={svgEl}
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linejoin="round"
	stroke-linecap="round"
	aria-hidden="true"
>
	<path
		d="M12 3 L14.94 8.95 L21.51 9.91 L16.76 14.55 L17.88 21.09 L12 18 L6.12 21.09 L7.24 14.55 L2.49 9.91 L9.06 8.95 Z"
		fill="currentColor"
		fill-opacity={fill.current}
	/>
</svg>

<style>
	svg {
		overflow: visible;
		transform-origin: 50% 50%;
	}
</style>
