<script>
	import { page } from '$app/state';
	import { Header, Main, ErrorPage, Footer } from '@onsvisual/svelte-components';
</script>

<Header />
<Main>
	<ErrorPage {page} />
</Main>
<Footer theme="dark" />
