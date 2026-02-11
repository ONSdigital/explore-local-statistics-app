<script lang="ts">
	import { resolve } from '$app/paths';
	import { getName } from '@onsvisual/robo-utils';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
	import { Container, Notice } from '@onsvisual/svelte-components';

	let { areaProps } = $props();

	$inspect({ areaProps });
</script>

{#if areaProps.end}
	<Container width="medium" marginTop>
		<Notice>
			This geographic area is no longer active.
			{#if areaProps.successor && areaProps.end === new Date().getFullYear() - 1}
				However, for a period it may continue to have more data available than its successor area, {getName(
					areaProps.successor,
					'the',
					'prefix'
				)}
				<a
					data-sveltekit-reload
					href={resolve(`/areas/${makeCanonicalSlug(areaProps.successor)}/indicators`)}
					>{getName(areaProps.successor)}</a
				>
				({areaProps.successor.areacd}).
			{:else if areaProps.successor}
				You may find more data available for its successor area,
				{getName(areaProps.successor, 'the', 'prefix')}
				<a
					data-sveltekit-reload
					href={resolve(`/areas/${makeCanonicalSlug(areaProps.successor)}/indicators`)}
					>{getName(areaProps.successor)}</a
				>
				({areaProps.successor.areacd}).
			{/if}
		</Notice>
	</Container>
{:else if areaProps.replaces?.[0]?.areacd && areaProps.start > new Date().getFullYear() - 2}
	<Container width="medium" marginTop>
		<Notice>
			This is a newly defined geographic area. For a period you may find more data for
			{#each areaProps.replaces as rep, i}
				{areaProps.areanm === rep.areanm ? 'the previous' : getName(rep, 'the', 'prefix')}
				<a
					data-sveltekit-reload
					href={resolve(`/areas/${makeCanonicalSlug(rep)}/indicators`)}
					data-sveltekit-noscroll>{getName(rep)}</a
				>
				({rep.areacd}){i === areaProps.replaces.length - 2 ? ' and ' : ', '}
			{/each}
			which it replaced.
		</Notice>
	</Container>
{/if}
