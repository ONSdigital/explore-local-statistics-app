<script lang="ts">
	// @ts-nocheck
	import { createEventDispatcher } from 'svelte';
	import { base } from '$app/paths';
	import { geoCodesLookup } from '$lib/config/geoConfig';
	import { capitalise } from '@onsvisual/robo-utils';
	import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';
	import { Theme, Button } from '@onsvisual/svelte-components';
	import { analyticsEvent } from '@onsvisual/svelte-components';
	// import Icon from '$lib/components/Icon.svelte';

	const dispatch = createEventDispatcher();

	export let postcode;
	export let urlSuffix = '';
</script>

<Theme theme="light" background="none">
	<p role="status" class="dl-status">Areas covering <strong>{postcode.postcd}</strong></p>
	<dl class="dl-results">
		{#each postcode.places as p}
			{#if geoCodesLookup[p.areacd.slice(0, 3)]}
				<div>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<dt>
						<a
							href="{base}/areas/{makeCanonicalSlug(p.areacd, p.areanm)}{urlSuffix}"
							on:click={() =>
								analyticsEvent({
									event: 'postcodeSelect',
									areaCode: p.areacd,
									areaName: p.areanm,
									areaType: geoCodesLookup?.[p.areacd.slice(0, 3)]?.label
								})}>{p.areanm}</a
						>
					</dt>
					<dd>{capitalise(p.typenm)}</dd>
				</div>
			{/if}
		{/each}
	</dl>
	<Button variant="secondary" small on:click={() => dispatch('clear')}>Close results</Button>
</Theme>

<style>
	p.dl-status {
		font-size: 16px;
		margin: 8px 0;
	}
	dl.dl-results {
		margin: 12px 0 18px;
	}
	dl.dl-results > div {
		display: block;
		margin: 6px 0;
		font-size: 16px;
	}
	dl.dl-results dt {
		display: inline-block;
	}
	dl.dl-results dd {
		display: inline-block;
		margin: 0;
		color: var(--muted, #707070);
	}
</style>
