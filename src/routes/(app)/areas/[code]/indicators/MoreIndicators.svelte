<script lang="ts">
	import { Icon } from '@onsvisual/svelte-components';

	let {
		id,
		hidden = $bindable(true),
		buttonText = 'Expand',
		onToggle = () => null,
		children
	} = $props();

	function makeObserver(node, callback) {
		function observerFn(entries) {
			for (const entry of entries) callback(entry);
		}
		const observer = new MutationObserver(observerFn);
		observer.observe(node, { attributes: true });
	}
</script>

<div
	{id}
	hidden={hidden ? 'until-found' : null}
	use:makeObserver={(e) => {
		if (hidden && e?.target?.hidden === false) hidden = false;
		else if (!hidden && e?.target?.hidden === 'until-found') hidden = true;
	}}
>
	{@render children?.()}
</div>
<button
	type="button"
	class="ons-btn ons-btn--small ons-btn--secondary"
	aria-controls={id}
	aria-expanded={hidden ? 'false' : 'true'}
	onclick={() => {
		hidden = !hidden;
		onToggle({ hidden });
	}}
>
	<span class="ons-btn__inner">
		<Icon type="carret" rotation={!hidden ? 180 : 0} marginRight />
		<span class="ons-btn__text">{buttonText}</span>
	</span>
</button>
