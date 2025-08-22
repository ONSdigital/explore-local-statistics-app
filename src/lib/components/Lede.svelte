<script lang="ts">
	export let marginBottom: boolean = false;
</script>

<p
	class="ons-page__container--narrow page-neutral-intro__content"
	class:margin-bottom={marginBottom}
>
	<slot />
</p>

<style>
	.page-neutral-intro__content {
		position: relative;
		z-index: 1;
		font-size: 22px;
		padding: 2px 0 0;
		line-height: 1.4;
		max-width: 700px;
		margin: -8px auto -12px 0;
	}
	.margin-bottom {
		margin-bottom: 24px;
	}
	.balance {
		text-wrap: balance;
	}
</style>
