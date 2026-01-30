<script lang="ts">
	import { resolve } from '$app/paths';
	import { Tabs, Tab, Accordion, AccordionItem } from '@onsvisual/svelte-components';
	import { getName, capitalise, pluralise } from '@onsvisual/robo-utils';
	import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';

	let { areaProps, selected = $bindable() } = $props();
</script>

{#if areaProps.children[0]}
	{#key areaProps}
		<div class="child-areas-tabs">
			<Tabs bind:selected compact>
				{#each areaProps.children as childGroup, i}
					<Tab title={capitalise(pluralise(childGroup.label))} id={childGroup.key} hideTitle>
						<ul class="list-columns">
							{#each childGroup.areas as child}
								<li>
									<a href={resolve(`/areas/${makeCanonicalSlug(child)}`)} data-sveltekit-noscroll>
										{getName(child)}
									</a>
								</li>
							{/each}
						</ul>
					</Tab>
				{/each}
			</Tabs>
		</div>
		<div class="child-areas-accordion">
			<Accordion
				on:toggle={(e) => {
					console.log(e);
					if (e?.detail?.open) selected = e?.detail?.id;
				}}
			>
				{#each areaProps.children as childGroup, i}
					<AccordionItem title={capitalise(pluralise(childGroup.label))} id={childGroup.key}>
						<ul class="list-columns">
							{#each childGroup.areas as child}
								<li>
									<a href={resolve(`/areas/${makeCanonicalSlug(child)}`)} data-sveltekit-noscroll>
										{getName(child)}
									</a>
								</li>
							{/each}
						</ul>
					</AccordionItem>
				{/each}
			</Accordion>
		</div>
	{/key}
{:else}
	<p>No smaller areas available within {getName(areaProps, 'the')}.</p>
{/if}

<style>
	.child-areas-tabs {
		display: none;
	}
	.child-areas-accordion {
		display: block;
	}
	@media (min-width: 740px) {
		.child-areas-tabs {
			display: block;
		}
		.child-areas-accordion {
			display: none;
		}
	}
	ul.list-columns {
		list-style: none;
		margin: 4px 0 8px;
		padding: 0;
		column-width: 220px;
		overflow-x: none;
		position: relative;
	}
	ul.list-columns > li {
		font-size: 16px !important;
		margin: 0;
		padding: 0;
	}
</style>
