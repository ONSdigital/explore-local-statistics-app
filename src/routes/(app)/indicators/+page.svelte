<script lang="ts">
	// @ts-nocheck
	import { resolve } from '$app/paths';
	import { base } from '$app/paths';
	import {
		PhaseBanner,
		Hero,
		Header,
		Breadcrumb,
		Section,
		NavSections,
		NavSection,
		Footer
	} from '@onsvisual/svelte-components';
	import { capitalise } from '@onsvisual/robo-utils';

	export let data;
</script>

<Hero width="medium" title="Local indicators" cls="titleblock-transparent">
	<p class="ons-hero__text">
		Explore our {data.summaryStats.univariateCount} local indicators, including
		<b>disposable household income</b>,
		<b>participation in further education</b>
		and
		<b>life satisfaction</b>.
	</p>
</Hero>
<!-- too much space between hero and sections -->

{#snippet indicator(ind)}
	<p>
		<a href={resolve(`/indicators/${ind.slug}`)}>{ind.label}</a><br />
		{ind.description}
	</p>
{/snippet}

<NavSections cls="nav-sections" marginTop>
	{#each data.taxonomy.data as theme}
		<NavSection title={theme.label} id={theme.slug}>
			{#each theme.children as child}
				{#if child.description}
					{@render indicator(child)}
				{:else}
					<h3>{child.label}</h3>
					{#each child.children as ind}
						{@render indicator(ind)}
					{/each}
				{/if}
			{/each}
			<!-- <div class="horizontal-divider"></div> -->
		</NavSection>
	{/each}
</NavSections>

<style>
	/* .horizontal-divider {
    border-bottom: 1px solid var(--ons-color-grey-15);
  } */
	.sticky {
		position: -webkit-sticky; /* For Safari */
		position: sticky;
		top: 0; /* Value that defines the threshold at which the element becomes sticky */
	}
	:global(.nav-sections section + section) {
		border-top: 1px solid #ddd;
		margin-top: 1.5em;
		padding-top: 1em;
	}
</style>
