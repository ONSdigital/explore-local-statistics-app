<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { Header, Main, ErrorPage, Footer, analyticsEvent } from '@onsvisual/svelte-components';

	onMount(() =>
		analyticsEvent({
			product: 'explore-local-statistics',
			contentType: '404-pages',
			countentGroup: '404-pages'
		})
	);
</script>

<Header {page} />
<Main>
	<ErrorPage {page} />
</Main>
<Footer theme="dark" />
