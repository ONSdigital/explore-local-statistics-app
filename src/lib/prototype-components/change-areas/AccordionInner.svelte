<script>
	import { Twisty } from '@onsvisual/svelte-components';

	export let title;
</script>

{#if title}
	<Twisty {title}><slot /></Twisty>
{:else}
	<slot />
{/if}
