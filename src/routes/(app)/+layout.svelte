<script lang="ts">
	import { page } from '$app/stores';

	import { PhaseBanner, Header, Footer } from '@onsvisual/svelte-components';
</script>

<svelte:head>
	<title>{$page.data.title}</title>
	<meta property="og:title" content={$page.data.title} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$page.url.toString()} />
	<meta name="description" content={$page.data.description} />
	<meta property="og:description" content={$page.data.description} />
</svelte:head>

<div class="flex flex-col min-h-screen">
	<div class="flex-grow">
		<PhaseBanner phase="beta" />
		<Header bilingual={false} />
		<main>
			<slot />
		</main>
	</div>
	<Footer theme="dark" />
</div>
