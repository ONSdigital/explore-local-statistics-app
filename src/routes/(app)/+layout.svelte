<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import {
		AnalyticsBanner,
		analyticsEvent,
		Header,
		Breadcrumb,
		Main,
		Footer
	} from '@onsvisual/svelte-components';
	import { geoLevelsAllLookup } from '$lib/config/geoLevels';

	const analyticsId = 'GTM-MBCBVQS';
	const analyticsProps = {
		contentTitle: 'Explore local statistics',
		// releaseDate: '20240326',
		contentType: 'explore-local-statistics'
	};

	afterNavigate(() => {
		const eventData = {
			event: 'pageView',
			pageUrl: page.url.href,
			product: 'explore-local-statistics',
			contentTitle: page.data.title,
			contentType: 'explore-local-statistics',
			contentSubType: page.data.pageType
		};
		const areaProps = page.data?.area?.properties;
		const indicator = page.data?.indicator;
		if (page.data.pageType === 'areas' && areaProps) {
			eventData.areaCode = areaProps.areacd;
			eventData.areaName = areaProps.areanm || areaProps.areacd;
			eventData.areaType = geoLevelsAllLookup?.[areaProps.areacd.slice(0, 3)]?.label;
		} else if (page.data.pageType === 'indicators' && indicator) {
			eventData.outputSeries = indicator.slug;
			eventData.contentGroup = indicator.topic;
			eventData.contentSubgroup = indicator.subTopic;
		}
		analyticsEvent(eventData);
	});
</script>

<svelte:head>
	<title>{page.data.title}</title>
	<link rel="canonical" href={page.url.origin + page.url.pathname} />
	<meta property="og:title" content={page.data.title} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.origin + page.url.pathname} />
	<meta name="description" content={page.data.description} />
	<meta property="og:description" content={page.data.description} />
	<meta property="og:description" content={page.data.description} />
	<meta property="og:image" content="{page.url.origin}/img/og.png" />
	<meta property="og:image:type" content="image/png" />
</svelte:head>

<AnalyticsBanner {analyticsId} {analyticsProps} pageViewEnabled={false} />
<Header
	headerBorder={!page.data.breadcrumbBackground}
	menuBorder={page.data.breadcrumbBackground === 'var(--ons-color-branded-tint)'}
/>
{#if page.data.breadcrumbLinks}
	<Breadcrumb
		links={page.data.breadcrumbLinks}
		background={page.data.breadcrumbBackground || null}
		cls={page.data.breadcrumbClass || null}
	/>
{/if}
<Main>
	<slot />
</Main>
<Footer theme="dark" />

<style>
	:global(a:focus > svg.logo) {
		outline: auto 5px;
	}
</style>
