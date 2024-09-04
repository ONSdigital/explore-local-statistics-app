<script>
	import { onMount, getContext } from 'svelte';
	import { slugify } from '$lib/util/url/slugify';

	/**
	 * A title for the element
	 * @type {string}
	 */
	export let title = 'Title';
	/**
	 * A unique for the element (optional)
	 * @type {string}
	 */
	export let id = slugify(title);
	/**
	 * Option for element to be open/expanded by default
	 * @type {boolean}
	 */
	export let open = false;

	let el;

	const elements = getContext('elements');
	const allOpen = getContext('allOpen');

	function updateAllOpen(e) {
		if (el && $elements) {
			$allOpen = e.newState === 'open' ? [...$elements].every((el) => el.open) : false;
		}
	}

	onMount(() => {
		$elements.add(el);
		return () => $elements.delete(el);
	});
</script>

<details
	id="accordion-1"
	class="ons-collapsible ons-js-collapsible ons-details--accordion"
	data-group="accordion"
	bind:this={el}
	bind:open
	on:toggle={updateAllOpen}
>
	<summary class="ons-collapsible__heading ons-js-collapsible-heading ons-details__heading">
		<h2 class="ons-collapsible__title">{title}</h2>
		<span class="ons-collapsible__icon">
			<svg
				class="ons-icon"
				viewBox="0 0 8 13"
				xmlns="http://www.w3.org/2000/svg"
				focusable="false"
				fill="currentColor"
				><path
					d="M5.74,14.28l-.57-.56a.5.5,0,0,1,0-.71h0l5-5-5-5a.5.5,0,0,1,0-.71h0l.57-.56a.5.5,0,0,1,.71,0h0l5.93,5.93a.5.5,0,0,1,0,.7L6.45,14.28a.5.5,0,0,1-.71,0Z"
					transform="translate(-5.02 -1.59)"
				></path></svg
			>
		</span>
	</summary>
	<div id="{id}-content" class="ons-details__content ons-js-details-content">
		<slot />
	</div>
</details>

<style>
	.ons-details__heading {
		color: var(--link, --ons-color-text-link);
	}
	.ons-details__heading:hover {
		color: var(--link, --ons-color-text-link-hover);
	}
	.ons-svg-icon {
		color: var(--link, --ons-color-text-link);
		fill: var(--link, --ons-color-text-link);
	}
	.ons-details__heading:hover:not(:focus) .ons-details__title {
		text-decoration: underline solid var(--link-hover, --ons-color-text-link-hover) 2px;
	}
	.ons-collapsible .ons-collapsible__icon {
		top: 0.8rem;
	}
	.ons-collapsible[open] .ons-collapsible__icon {
		top: 1.2rem;
	}
</style>
