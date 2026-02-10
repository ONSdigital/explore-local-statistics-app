<script lang="ts">
	import { resolve } from '$app/paths';
	import { getName, capitalise } from '@onsvisual/robo-utils';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';

	let { areaProps } = $props();
</script>

<div class="ons-hero__text">
	{#if areaProps.areacd === 'K02000001'}
		Explore areas within the United Kingdom.
	{:else}
		{@const parent = areaProps.parents[0]}
		{#if areaProps.end}
			<span class="inactive-badge">Inactive</span> {areaProps.typenm}
		{:else}
			{capitalise(areaProps.typenm)}
		{/if}
		{getName(parent, 'in', 'prefix')}
		<a href={resolve(`/areas/${makeCanonicalSlug(parent)}`)} data-sveltekit-noscroll
			>{getName(parent)}</a
		>
		{#if ['E02', 'W02'].includes(areaProps.typecd)}
			<p class="ons-u-fs-s additional-area-info">
				Also known as {areaProps.areanm}
			</p>
		{/if}
		{#if areaProps.start && areaProps.replaces?.[0]?.areacd}
			<p class="ons-u-fs-s additional-area-info">
				In {areaProps.start}, it replaced
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
			</p>
		{/if}
		{#if areaProps.end && areaProps.successor?.areacd}
			<p class="ons-u-fs-s additional-area-info">
				In {areaProps.end + 1}, this area was replaced by
				{areaProps.areanm === areaProps.successor.areanm
					? 'the new'
					: getName(areaProps.successor, 'the', 'prefix')}
				<a
					href={resolve(`/areas/${makeCanonicalSlug(areaProps.successor)}`)}
					data-sveltekit-noscroll>{getName(areaProps.successor)}</a
				>
				({areaProps.successor.areacd}) due to a boundary change.
			</p>
		{:else if areaProps.end}
			<p class="ons-u-fs-s additional-area-info">
				It ceased to be an official geography in {areaProps.end + 1}.
			</p>
		{/if}
	{/if}
</div>

<style>
	.additional-area-info {
		margin-top: 12px;
		margin-bottom: 0;
	}
	.inactive-badge {
		font-weight: bold;
		color: white;
		padding: 0 8px 2px 8px;
		border-radius: 4px;
		background-color: #fa6401;
		margin-right: 2px;
	}
</style>
