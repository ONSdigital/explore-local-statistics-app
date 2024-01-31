<script lang="ts">
	// @ts-nocheck
	import { createEventDispatcher } from 'svelte';
	import { base } from '$app/paths';
	import { geoCodesLookup } from '$lib/config/geoConfig';
	import { capitalise } from '@onsvisual/robo-utils';
	import { makeCanonicalSlug } from '$lib/util/areas/makeCanonicalSlug';
	import { Theme } from '@onsvisual/svelte-components';
	import { analyticsEvent } from '@onsvisual/svelte-components';
	import Icon from '$lib/components/Icon.svelte';

	const dispatch = createEventDispatcher();

	export let postcode;
</script>

<Theme theme="light" background="none">
	<table class="tbl-results">
		<tbody>
			<tr>
				<td>Areas covering <strong>{postcode.postcd}</strong></td>
				<td style:text-align="right"
					><button
						class="btn-link no-border"
						title="Close area list"
						on:click={() => dispatch('clear')}><Icon type="close" /></button
					></td
				>
			</tr>
			{#each postcode.places as p}
				{#if geoCodesLookup[p.areacd.slice(0, 3)]}
					<tr>
						<td><strong>{capitalise(p.typenm)}</strong></td>
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<td
							><a
								href="{base}/areas/{makeCanonicalSlug(p.areacd, p.areanm)}"
								on:click={() =>
									analyticsEvent({
										event: 'postcodeSelect',
										areaCode: p.areacd,
										areaName: p.areanm,
										areaType: geoCodesLookup[p.areacd.slice(0, 3)].label
									})}>{p.areanm}</a
							></td
						>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</Theme>
