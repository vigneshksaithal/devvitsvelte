<script lang="ts">
	const title = $state('Devvit + Svelte')
</script>

<main>
	<h1>{title}</h1>
	{#if title === 'Devvit + Svelte'}
		<p>This is a test</p>
	{:else}
		<p>This is not a test</p>
	{/if}
</main>
