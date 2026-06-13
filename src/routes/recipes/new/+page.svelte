<script lang="ts">
	import ImportModal from '$lib/components/ImportModal.svelte';
	import { addToast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const isManual = $derived($page.url.searchParams.get('manual') === '1');
	let creating = $state(false);

	async function createRecipe(recipe: object) {
		// Same-Origin JSON-POST → SvelteKit-Origin-Check + Preflight schützen vor CSRF.
		const res = await fetch('/api/recipes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(recipe)
		});
		const data = await res.json();
		if (data.id) {
			goto(`/recipes/${data.id}/edit`);
		} else {
			addToast(data.message || 'Rezept konnte nicht gespeichert werden', 'error');
			goto('/recipes');
		}
	}

	// Manueller Flow: leeres Rezept clientseitig anlegen (kein State-Change im GET-load,
	// kein eager fetch im SSR-Template — beides war vorher Bug/CSRF-Risiko).
	$effect(() => {
		if (isManual && !creating) {
			creating = true;
			createRecipe({ title: 'Neues Rezept' });
		}
	});
</script>

{#if isManual}
	<div class="min-h-[60vh] flex flex-col items-center justify-center text-center text-stone-400 dark:text-stone-500 font-nunito">
		<div class="text-5xl mb-4 animate-pop-in">🍳</div>
		<p>Neues Rezept wird angelegt…</p>
	</div>
{:else}
	<ImportModal open={true} onclose={() => goto('/recipes')} onimport={createRecipe} />
{/if}
