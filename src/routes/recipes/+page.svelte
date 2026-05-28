<script lang="ts">
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import ImportModal from '$lib/components/ImportModal.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let search = $state('');
	let activeTags = $state<string[]>([]);
	let maxCalories = $state<number | undefined>(undefined);
	let showImportModal = $state(false);

	const filtered = $derived(
		data.recipes.filter((r) => {
			const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
			const matchTags = activeTags.length === 0 || activeTags.every((t) => r.tags?.includes(t));
			const matchCal = !maxCalories || !r.nutrition?.calories || r.nutrition.calories <= maxCalories;
			return matchSearch && matchTags && matchCal;
		})
	);

	function toggleTag(tag: string) {
		if (activeTags.includes(tag)) {
			activeTags = activeTags.filter((t) => t !== tag);
		} else {
			activeTags = [...activeTags, tag];
		}
	}

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

<svelte:head>
	<title>Meine Rezepte</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<div>
		<h1 class="font-baloo font-extrabold text-3xl text-stone-900 dark:text-stone-100">Meine Rezepte</h1>
		<p class="text-stone-400 dark:text-stone-500 font-nunito text-sm">{data.recipes.length} Rezepte gespeichert</p>
	</div>
	<button
		onclick={() => (showImportModal = true)}
		class="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-baloo font-bold px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 cursor-pointer"
	>
		<span class="text-lg">+</span>
		<span>Rezept hinzufügen</span>
	</button>
</div>

<div class="mb-6">
	<FilterBar
		{search}
		{activeTags}
		{maxCalories}
		onsearchchange={(v) => (search = v)}
		ontagtoggle={toggleTag}
		oncalorieschange={(v) => (maxCalories = v)}
	/>
</div>

{#if filtered.length === 0}
	<div class="text-center py-16">
		<div class="text-6xl mb-4">🍽️</div>
		<p class="font-baloo font-bold text-xl text-stone-400 dark:text-stone-500">
			{data.recipes.length === 0 ? 'Noch keine Rezepte' : 'Keine Treffer'}
		</p>
		{#if data.recipes.length === 0}
			<p class="text-stone-400 dark:text-stone-500 font-nunito text-sm mt-2">Füge dein erstes Rezept hinzu!</p>
			<button
				onclick={() => (showImportModal = true)}
				class="mt-4 bg-orange-500 text-white font-baloo font-bold px-6 py-2.5 rounded-2xl hover:bg-orange-600 active:scale-95 transition-all cursor-pointer"
			>
				Erstes Rezept hinzufügen
			</button>
		{/if}
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each filtered as recipe, i}
			<RecipeCard
				id={recipe.id}
				title={recipe.title}
				description={recipe.description}
				prepTime={recipe.prepTime}
				tags={recipe.tags}
				nutrition={recipe.nutrition}
				imageUrl={recipe.imageUrl}
				index={i}
			/>
		{/each}
	</div>
{/if}

<ImportModal open={showImportModal} onclose={() => (showImportModal = false)} onimport={handleImport} />
