<script lang="ts">
	import TagChip from '$lib/components/TagChip.svelte';
	import NutritionBadge from '$lib/components/NutritionBadge.svelte';
	import BringButton from '$lib/components/BringButton.svelte';
	import { addToast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	const r = $derived(data.recipe);

	async function deleteRecipe() {
		if (!confirm('Rezept wirklich löschen?')) return;
		const res = await fetch(`/api/recipes/${r.id}`, { method: 'DELETE' });
		if (res.ok) {
			addToast('Rezept gelöscht', 'success');
			goto('/recipes');
		} else {
			addToast('Fehler beim Löschen', 'error');
		}
	}
</script>

<svelte:head>
	<title>{r.title}</title>
</svelte:head>

<a href="/recipes" class="inline-flex items-center gap-2 text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 font-nunito text-sm mb-6 transition-colors">
	← Zurück
</a>

<div class="space-y-6">
	<div class="bg-white dark:bg-stone-800 rounded-3xl shadow-md overflow-hidden animate-pop-in">
		{#if r.imageUrl?.startsWith('http')}
			<img src={r.imageUrl} alt={r.title} class="w-full h-56 object-cover" />
		{:else}
			<div class="w-full h-36 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-stone-700 dark:to-stone-800 flex items-center justify-center">
				<span class="text-6xl">🍽️</span>
			</div>
		{/if}

		<div class="p-6">
			<div class="flex items-start justify-between gap-4 mb-3">
				<h1 class="font-baloo font-extrabold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">{r.title}</h1>
				<div class="flex gap-2 shrink-0">
					<a href="/recipes/{r.id}/edit" class="text-xs font-semibold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-stone-700 dark:hover:bg-stone-600 px-3 py-1.5 rounded-xl transition-colors">
						✏️ Bearbeiten
					</a>
					<button onclick={deleteRecipe} class="text-xs font-semibold text-red-400 hover:text-red-500 bg-red-50 dark:bg-stone-700 dark:hover:bg-stone-600 px-3 py-1.5 rounded-xl transition-colors cursor-pointer">
						🗑️
					</button>
				</div>
			</div>

			{#if r.description}
				<p class="text-stone-500 dark:text-stone-400 font-nunito mb-4">{r.description}</p>
			{/if}

			<div class="flex flex-wrap gap-3 mb-4 text-sm text-stone-500 dark:text-stone-400 font-nunito">
				{#if r.prepTime}
					<span class="flex items-center gap-1">⏱️ {r.prepTime} Minuten</span>
				{/if}
				{#if r.servings}
					<span class="flex items-center gap-1">👥 {r.servings} Portionen</span>
				{/if}
				{#if r.sourceUrl?.startsWith('http')}
					<a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
						🔗 Quelle
					</a>
				{/if}
			</div>

			{#if r.tags?.length}
				<div class="flex flex-wrap gap-2 mb-4">
					{#each r.tags as tag}
						<TagChip {tag} />
					{/each}
				</div>
			{/if}

			{#if r.nutrition?.calories}
				<NutritionBadge
					calories={r.nutrition.calories}
					fat={r.nutrition.fat}
					sugar={r.nutrition.sugar}
					protein={r.nutrition.protein}
				/>
			{/if}
		</div>
	</div>

	{#if r.ingredients?.length}
		<div class="bg-white dark:bg-stone-800 rounded-3xl shadow-md p-6 animate-fade-up">
			<h2 class="font-baloo font-bold text-xl mb-4 flex items-center gap-2 text-stone-900 dark:text-stone-100">
				🛒 Zutaten
				<span class="text-sm font-nunito font-normal text-stone-400 dark:text-stone-500">({r.ingredients.length})</span>
			</h2>
			<ul class="space-y-2">
				{#each r.ingredients as ing}
					<li class="flex items-center gap-3 py-1.5 border-b border-stone-50 dark:border-stone-700 last:border-0">
						<span class="w-2 h-2 rounded-full bg-orange-400 shrink-0"></span>
						<span class="font-nunito text-stone-700 dark:text-stone-300">
							{#if ing.amount}<strong>{ing.amount} {ing.unit ?? ''}</strong>{' '}{/if}{ing.name}
						</span>
					</li>
				{/each}
			</ul>

			<div class="mt-5">
				<BringButton recipeId={r.id} />
			</div>
		</div>
	{/if}

	{#if r.steps?.length}
		<div class="bg-white dark:bg-stone-800 rounded-3xl shadow-md p-6 animate-fade-up recipe-stagger-2">
			<h2 class="font-baloo font-bold text-xl mb-4 text-stone-900 dark:text-stone-100">👨‍🍳 Zubereitung</h2>
			<ol class="space-y-4">
				{#each r.steps as step, i}
					<li class="flex gap-4">
						<span class="shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-baloo font-bold text-sm flex items-center justify-center">
							{i + 1}
						</span>
						<p class="font-nunito text-stone-700 dark:text-stone-300 pt-1">{step}</p>
					</li>
				{/each}
			</ol>
		</div>
	{/if}
</div>
