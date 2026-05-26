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
		{ key: 'lowcal', label: '💧 Wenig Kalorien' }
	];

	const calorieOptions = [
		{ label: 'Alle', value: undefined },
		{ label: 'unter 300 kcal', value: 300 },
		{ label: 'unter 500 kcal', value: 500 },
		{ label: 'unter 700 kcal', value: 700 }
	];
</script>

<div class="bg-white rounded-3xl shadow-sm border border-orange-100 p-4 space-y-4">
	<!-- Search -->
	<div class="relative">
		<span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">🔍</span>
		<input
			type="search"
			value={search}
			oninput={(e) => onsearchchange((e.target as HTMLInputElement).value)}
			placeholder="Rezept suchen…"
			class="w-full pl-10 pr-4 py-2.5 bg-amber-50 border border-orange-100 rounded-2xl text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
		/>
	</div>

	<!-- Tags -->
	<div class="flex flex-wrap gap-2">
		{#each allTags as tag}
			<button
				onclick={() => ontagtoggle(tag.key)}
				class="px-3 py-1.5 rounded-full text-sm font-semibold font-nunito transition-all duration-150 active:scale-95 cursor-pointer
				{activeTags.includes(tag.key)
					? 'bg-orange-500 text-white shadow-sm'
					: 'bg-amber-50 text-stone-600 hover:bg-orange-100 border border-orange-100'}"
			>
				{tag.label}
			</button>
		{/each}
	</div>

	<!-- Calories -->
	<div class="flex flex-wrap gap-2 items-center">
		<span class="text-xs font-semibold text-stone-400 font-nunito uppercase tracking-wide">Kalorien:</span>
		{#each calorieOptions as opt}
			<button
				onclick={() => oncalorieschange(opt.value)}
				class="px-3 py-1 rounded-full text-xs font-semibold font-nunito transition-all duration-150 active:scale-95 cursor-pointer
				{maxCalories === opt.value
					? 'bg-orange-500 text-white'
					: 'bg-amber-50 text-stone-500 hover:bg-orange-100 border border-orange-100'}"
			>
				{opt.label}
			</button>
		{/each}
	</div>
</div>
