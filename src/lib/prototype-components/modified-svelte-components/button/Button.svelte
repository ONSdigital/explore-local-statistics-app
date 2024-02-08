<script>
	import { createEventDispatcher } from 'svelte';
	import Icon from './Icon.svelte';

	const dispatch = createEventDispatcher();

	/**
	 * Type of button
	 * @type {"button"|"sumbit"|"reset"}
	 */
	export let type = 'button';
	/**
	 * Style variant of button
	 * @type {"primary"|"secondary"|"ghost"}
	 */
	export let variant = 'primary';
	/**
	 * Href of button (renders button as a link)
	 * @type {string}
	 */
	export let href = '';
	/**
	 * Make button smaller
	 * @type {boolean}
	 */
	export let small = false;
	/**
	 * Icon on button, eg. "arrow", "search"
	 * @type {string}
	 */
	export let icon = '';
	/**
	 * Position of icon
	 * @type {"before"|"after"}
	 */
	export let iconPosition = 'before';
	/**
	 * Show button as disabled
	 * @type {boolean}
	 */
	export let disabled = false;

	export let stroke = null,
		strokeWidth = null,
		fill = null;
</script>

{#if href}
	<a
		href={!disabled ? href : null}
		role="button"
		class="ons-btn ons-btn--link ons-js-submit-btn"
		class:ons-btn--small={small}
		class:ons-btn--secondary={variant === 'secondary'}
		class:ons-btn--ghost={variant === 'ghost'}
		class:ons-btn--disabled={disabled}
		{disabled}
		on:click={(e) => dispatch('click', e)}
	>
		<span class="ons-btn__inner">
			{#if icon && iconPosition === 'before'}
				<Icon type={icon} marginRight {stroke} {strokeWidth} {fill} />
			{/if}
			<span class="ons-btn__text"><slot /></span>
			{#if icon && iconPosition === 'after'}
				<Icon type={icon} marginLeft {stroke} {strokeWidth} {fill} />
			{/if}
		</span>
	</a>
{:else}
	<button
		{type}
		class="ons-btn"
		class:ons-btn--small={small}
		class:ons-btn--secondary={variant === 'secondary'}
		class:ons-btn--ghost={variant === 'ghost'}
		class:ons-btn--disabled={disabled}
		{disabled}
		on:click={(e) => dispatch('click', e)}
	>
		<span class="ons-btn__inner">
			{#if icon && iconPosition === 'before'}
				<Icon type={icon} marginRight {stroke} {strokeWidth} {fill} />
			{/if}
			<span class="ons-btn__text"><slot /></span>
			{#if icon && iconPosition === 'after'}
				<Icon type={icon} marginLeft {stroke} {strokeWidth} {fill} />
			{/if}
		</span>
	</button>
{/if}
