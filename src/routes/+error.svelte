<script>
	import { page } from '$app/state';
	import { Header, Main, ErrorPage, Footer } from '@onsvisual/svelte-components';
</script>

<Header bilingual={false}></Header>
<Main>
	<ErrorPage {page} />
</Main>
<Footer theme="dark" />
