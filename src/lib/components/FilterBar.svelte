<script lang="ts">
	interface Props {
		search: string;
		activeTags: string[];
		maxCalories?: number;
		onsearchchange: (v: string) => void;
		ontagtoggle: (tag: string) => void;
		oncalorieschange: (v: number | undefined) => void;
	}

	const { search, activeTags, maxCalories, onsearchchange, ontagtoggle, oncalorieschange }: Props = $props();

	const allTags = [
		{ key: 'kids', label: '❤️ Kinder' },
		{ key: 'quick', label: '⚡ Schnell' },
		{ key: 'airfryer', label: '🌡️ Air Fryer' },
		{ key: 'ricecooker', label: '🍚 Reiskocher' },
		{ key: 'lowcal', label: '💧 Wenig Kalorien' },
		{ key: 'lowsugar', label: '🍃 Wenig Zucker' }
	];

	const calorieOptions = [
		{ label: 'Alle', value: undefined },
		{ label: 'unter 300 kcal', value: 300 },
		{ label: 'unter 500 kcal', value: 500 },
		{ label: 'unter 700 kcal', value: 700 }
	];
</script>

<div class="bg-white dark:bg-stone-800 rounded-3xl shadow-sm border border-orange-100 dark:border-stone-700 p-4 space-y-4">
	<div class="relative">
		<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">🔍</span>
		<input
			type="search"
			value={search}
			oninput={(e) => onsearchchange((e.target as HTMLInputElement).value)}
			placeholder="Rezept suchen…"
			class="w-full pl-10 pr-4 py-2.5 bg-amber-50 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-500 border border-orange-100 dark:border-stone-600 rounded-2xl text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-500 transition-all"
		/>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each allTags as tag}
			<button
				onclick={() => ontagtoggle(tag.key)}
				class="px-3 py-1.5 rounded-full text-sm font-semibold font-nunito transition-all duration-150 active:scale-95 cursor-pointer
				{activeTags.includes(tag.key)
					? 'bg-orange-500 text-white shadow-sm'
					: 'bg-amber-50 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-orange-100 dark:hover:bg-stone-600 border border-orange-100 dark:border-stone-600'}"
			>
				{tag.label}
			</button>
		{/each}
	</div>

	<div class="flex flex-wrap gap-2 items-center">
		<span class="text-xs font-semibold text-stone-400 dark:text-stone-500 font-nunito uppercase tracking-wide">Kalorien:</span>
		{#each calorieOptions as opt}
			<button
				onclick={() => oncalorieschange(opt.value)}
				class="px-3 py-1 rounded-full text-xs font-semibold font-nunito transition-all duration-150 active:scale-95 cursor-pointer
				{maxCalories === opt.value
					? 'bg-orange-500 text-white'
					: 'bg-amber-50 dark:bg-stone-700 text-stone-500 dark:text-stone-400 hover:bg-orange-100 dark:hover:bg-stone-600 border border-orange-100 dark:border-stone-600'}"
			>
				{opt.label}
			</button>
		{/each}
	</div>
</div>
