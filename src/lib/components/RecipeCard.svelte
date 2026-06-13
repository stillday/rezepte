<script lang="ts">
	import TagChip from './TagChip.svelte';
	import NutritionBadge from './NutritionBadge.svelte';

	interface Nutrition {
		calories?: number;
		fat?: number;
		sugar?: number;
	}

	interface Props {
		id: string;
		title: string;
		description?: string;
		prepTime?: number;
		tags?: string[];
		nutrition?: Nutrition;
		imageUrl?: string;
		index?: number;
	}

	const { id, title, description, prepTime, tags = [], nutrition, imageUrl, index = 0 }: Props = $props();

	const staggerClasses = ['recipe-stagger-1', 'recipe-stagger-2', 'recipe-stagger-3', 'recipe-stagger-4', 'recipe-stagger-5', 'recipe-stagger-6'];
	const staggerClass = $derived(staggerClasses[index % 6]);
</script>

<a
	href="/recipes/{id}"
	class="group block bg-white dark:bg-stone-800 rounded-3xl shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden animate-fade-up opacity-0 {staggerClass} cursor-pointer"
>
	<div class="relative h-44 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-stone-700 dark:to-stone-800 overflow-hidden">
		{#if imageUrl}
			<img src={imageUrl} alt={title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
		{:else}
			<div class="w-full h-full flex items-center justify-center">
				<span class="text-6xl opacity-30">🍽️</span>
			</div>
		{/if}
		{#if prepTime}
			<div class="absolute bottom-2 right-2 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 font-nunito">
				⏱️ {prepTime} Min
			</div>
		{/if}
	</div>

	<div class="p-4">
		<h3 class="font-baloo font-bold text-lg text-stone-900 dark:text-stone-100 mb-1 line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{title}</h3>

		{#if description}
			<p class="text-stone-500 dark:text-stone-400 text-sm mb-3 line-clamp-2 font-nunito">{description}</p>
		{/if}

		{#if tags.length > 0}
			<div class="flex flex-wrap gap-1.5 mb-3">
				{#each tags.slice(0, 3) as tag}
					<TagChip {tag} />
				{/each}
			</div>
		{/if}

		{#if nutrition?.calories}
			<NutritionBadge calories={nutrition.calories} compact />
		{/if}
	</div>
</a>
