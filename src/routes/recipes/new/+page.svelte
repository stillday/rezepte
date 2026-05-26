<script lang="ts">
	import ImportModal from '$lib/components/ImportModal.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const isManual = $derived($page.url.searchParams.get('manual') === '1');
	let showModal = $state(!isManual);

	async function handleImport(recipe: object) {
		const res = await fetch('/api/recipes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(recipe)
		});
		const data = await res.json();
		if (data.id) goto(`/recipes/${data.id}/edit`);
	}
</script>

{#if isManual}
	{@const emptyRecipe = {
		title: '', description: '', servings: 4, prepTime: undefined,
		tags: [], ingredients: [], steps: [], nutrition: {}
	}}
	<script>
		// redirect to edit with empty recipe
	</script>
	<!-- Redirect to create empty recipe then edit -->
	{#await fetch('/api/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Neues Rezept' }) }).then(r => r.json()) then data}
		{#if data.id}
			{@const _ = goto(`/recipes/${data.id}/edit`)}
		{/if}
	{/await}
{/if}

<ImportModal open={showModal} onclose={() => goto('/recipes')} onimport={handleImport} />
