<script lang="ts">
	import '../app.css';
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

<PhaseBanner phase="beta" />
<Header />

<main>
	<slot />
</main>

<Footer />
