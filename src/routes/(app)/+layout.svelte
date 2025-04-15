<script lang="ts">
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import {
		AnalyticsBanner,
		analyticsEvent,
		Header,
		Main,
		Footer
	} from '@onsvisual/svelte-components';

	const analyticsId = 'GTM-MBCBVQS';
	const analyticsProps = {
		contentTitle: 'Explore local statistics',
		contentType: 'exploratory'
	};

	afterNavigate(() => {
		const eventData = {
			event: 'pageView',
			product: 'explore local statistics',
			pageUrl: $page.url.href,
			contentTitle: $page.data.title,
			contentType: $page.data.pageType
		};
		if (
			['els - area page', 'els - area data page'].includes($page.data.pageType) &&
			$page.data.place
		) {
			eventData.areaCode = $page.data.place.areacd;
			eventData.areaName = $page.data.place.areanm || $page.data.place.areacd;
			eventData.areaType = $page.data.place.typenm;
		} else if ($page.data.pageType === 'indicator data page' && $page.data.indicator) {
			eventData.indicator = $page.data.indicator.metadata.slug;
			eventData.indicatorName = $page.data.indicator.metadata.label;
			eventData.contentGroup = $page.data.indicator.topic;
			eventData.contentSubgroup = $page.data.indicator.subTopic;
		}
		analyticsEvent(eventData);
	});
</script>

<svelte:head>
	<title>{$page.data.title}</title>
	<link rel="canonical" href={$page.url.origin + $page.url.pathname} />
	<meta property="og:title" content={$page.data.title} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$page.url.origin + $page.url.pathname} />
	<meta name="description" content={$page.data.description} />
	<meta property="og:description" content={$page.data.description} />
	<meta property="og:description" content={$page.data.description} />
	<meta property="og:image" content="{$page.url.origin}/img/og.png" />
	<meta property="og:image:type" content="image/png" />
</svelte:head>

<div class="flex flex-col min-h-screen">
	<div class="flex-grow">
		<Header bilingual={false}>
			<div slot="before">
				<AnalyticsBanner {analyticsId} {analyticsProps} pageViewEnabled={false} />
			</div>
		</Header>
		{#if $page.data.component}
			<svelte:component
				this={$page.data.component}
				links={$page.data.breadcrumbLinks}
				background={$page.data.background ?? ''}
			/>
		{:else}
			<p>$page.data.component is undefined</p>
		{/if}
		<Main>
			<slot />
		</Main>
	</div>
	<Footer theme="dark" />
</div>

<style>
	:global(a:focus > svg.logo) {
		outline: auto 5px;
	}
</style>
