<script lang="ts">
	import { resolve } from '$app/paths';
	import { getName, capitalise } from '@onsvisual/robo-utils';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
	import { Notice } from '@onsvisual/svelte-components';

	let { areaProps } = $props();
</script>

<div class="ons-hero__text">
	{#if areaProps.areacd === 'K02000001'}
		<p>Explore areas within the United Kingdom.</p>
	{:else}
		{@const parent = areaProps.parents[0]}
		<p>
			{#if areaProps.end}
				<span class="inactive-badge">Inactive</span> {areaProps.typenm}
			{:else}
				{capitalise(areaProps.typenm)}
			{/if}
			{getName(parent, 'in', 'prefix')}
			<a href={resolve(`/areas/${makeCanonicalSlug(parent)}`)} data-sveltekit-noscroll
				>{getName(parent)}</a
			>.
			{#if ['E02', 'W02'].includes(areaProps.typecd)}
				The official name of this area is <strong>{areaProps.areanm}</strong>.
			{/if}
		</p>
		{#if areaProps.start && areaProps.replaces?.[0]?.areacd}
			<Notice>
				In {areaProps.start}, this area replaced
				{#each areaProps.replaces as rep, i}
					{areaProps.areanm === rep.areanm ? 'the previous' : getName(rep, 'the', 'prefix')}
					<a href={resolve(`/areas/${makeCanonicalSlug(rep)}`)} data-sveltekit-noscroll
						>{getName(rep)}</a
					>
					({rep.areacd})
					{i === areaProps.replaces.length - 1
						? ''
						: i === areaProps.replaces.length - 2
							? ' and '
							: ', '}
					{areaProps.areanm === rep.areanm ? 'due to a boundary change.' : '.'}
				{/each}
			</Notice>
		{/if}
		{#if areaProps.end && areaProps.successor?.areacd}
			<Notice>
				In {areaProps.end + 1}, this area was replaced by
				{areaProps.areanm === areaProps.successor.areanm
					? 'the new'
					: getName(areaProps.successor, 'the', 'prefix')}
				<a
					href={resolve(`/areas/${makeCanonicalSlug(areaProps.successor)}`)}
					data-sveltekit-noscroll>{getName(areaProps.successor)}</a
				>
				({areaProps.successor.areacd}) due to a boundary change.
			</Notice>
		{:else if areaProps.end}
			<Notice>
				This area ceased to be an official geography in {areaProps.end + 1}.
			</Notice>
		{/if}
	{/if}
</div>
