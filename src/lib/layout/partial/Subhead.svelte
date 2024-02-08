<script>
	import { getContext } from 'svelte';
	
	export let mode = getContext("mode");
</script>

<p class="{mode == 'neutral' ? 'page-neutral-intro__content' : 'page-intro__content'}">
	<slot/>
</p>