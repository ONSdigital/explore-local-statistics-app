<script lang="ts">
	import { page } from '$app/stores';

	import { AnalyticsBanner, PhaseBanner, Header, Footer } from '@onsvisual/svelte-components';

	const analyticsId = 'GTM-P8JVL5X5';
	const analyticsProps = {
		contentTitle: 'Explore local statistics',
		releaseDate: '20240326',
		contentType: 'exploratory',
		outputSeries: 'localstatistics'
	};

	$: console.log($page.url);
</script>

<svelte:head>
	<title>{$page.data.title}</title>
	<link rel="canonical" href={$page.url.origin + $page.url.pathname} />
	<meta property="og:title" content={$page.data.title} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$page.url.origin + $page.url.pathname} />
	<meta name="description" content={$page.data.description} />
	<meta property="og:description" content={$page.data.description} />
</svelte:head>

<div class="flex flex-col min-h-screen">
	<div class="flex-grow">
		<AnalyticsBanner {analyticsId} {analyticsProps} />
		<PhaseBanner phase="beta" />
		<Header bilingual={false} />
		<main>
			<slot />
		</main>
	</div>
	<Footer theme="dark" />
</div>
