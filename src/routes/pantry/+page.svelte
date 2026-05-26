<script lang="ts">
	import { addToast } from '$lib/stores/toast.svelte';

	let { data } = $props();

	type Category = 'spice' | 'oil' | 'basic';

	interface PantryItem {
		name: string;
		category: Category;
	}

	let items = $state<PantryItem[]>(data.items.length ? [...data.items] : []);
	let newName = $state('');
	let newCategory = $state<Category>('basic');
	let saving = $state(false);

	const categoryConfig: Record<Category, { label: string; icon: string; color: string }> = {
		spice: { label: 'Gewürz', icon: '🌶️', color: 'bg-red-100 text-red-700' },
		oil: { label: 'Öl/Fett', icon: '🫒', color: 'bg-yellow-100 text-yellow-700' },
		basic: { label: 'Grundzutat', icon: '🥫', color: 'bg-stone-100 text-stone-600' }
	};

	function addItem() {
		if (!newName.trim()) return;
		items = [...items, { name: newName.trim(), category: newCategory }];
		newName = '';
	}

	function removeItem(i: number) {
		items = items.filter((_, idx) => idx !== i);
	}

	async function savePantry() {
		saving = true;
		try {
			const res = await fetch('/api/pantry', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items })
			});
			if (!res.ok) throw new Error('Speichern fehlgeschlagen');
			addToast('Vorrat gespeichert ✅', 'success');
		} catch (e) {
			addToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			saving = false;
		}
	}

	const byCategory = $derived({
		spice: items.filter((i) => i.category === 'spice'),
		oil: items.filter((i) => i.category === 'oil'),
		basic: items.filter((i) => i.category === 'basic')
	});

	const defaultItems = [
		{ name: 'Salz', category: 'spice' as Category },
		{ name: 'Pfeffer', category: 'spice' as Category },
		{ name: 'Paprikapulver', category: 'spice' as Category },
		{ name: 'Knoblauchpulver', category: 'spice' as Category },
		{ name: 'Olivenöl', category: 'oil' as Category },
		{ name: 'Butter', category: 'oil' as Category },
		{ name: 'Zucker', category: 'basic' as Category },
		{ name: 'Mehl', category: 'basic' as Category }
	];

	function addDefaults() {
		const existing = new Set(items.map((i) => i.name.toLowerCase()));
		const toAdd = defaultItems.filter((d) => !existing.has(d.name.toLowerCase()));
		items = [...items, ...toAdd];
	}
</script>

<svelte:head>
	<title>Mein Vorrat</title>
</svelte:head>

<div class="space-y-6 pb-10">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="font-baloo font-extrabold text-3xl text-stone-900">Mein Vorrat</h1>
			<p class="text-stone-400 font-nunito text-sm">Diese Zutaten kommen nie in die Bring!-Liste</p>
		</div>
		<button
			onclick={savePantry}
			disabled={saving}
			class="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-baloo font-bold px-5 py-2.5 rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer"
		>
			{saving ? '⏳' : '💾'} Speichern
		</button>
	</div>

	<!-- Quick-fill -->
	{#if items.length === 0}
		<div class="bg-amber-50 border border-orange-100 rounded-3xl p-5 text-center">
			<p class="text-stone-500 font-nunito mb-3">Starte mit typischen Grundzutaten:</p>
			<button onclick={addDefaults} class="bg-orange-100 hover:bg-orange-200 text-orange-700 font-baloo font-bold px-5 py-2 rounded-2xl transition-colors cursor-pointer active:scale-95">
				🚀 Standard-Vorrat hinzufügen
			</button>
		</div>
	{/if}

	<!-- Add item -->
	<div class="bg-white rounded-3xl shadow-md p-5 space-y-3">
		<h2 class="font-baloo font-bold text-lg">Zutat hinzufügen</h2>
		<div class="flex gap-2">
			<input
				bind:value={newName}
				type="text"
				placeholder="Kümmel, Kurkuma, …"
				class="flex-1 px-4 py-2.5 bg-amber-50 border border-orange-100 rounded-2xl font-nunito text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
				onkeydown={(e) => e.key === 'Enter' && addItem()}
			/>
			<select
				bind:value={newCategory}
				class="px-3 py-2.5 bg-amber-50 border border-orange-100 rounded-2xl font-nunito text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
			>
				<option value="spice">🌶️ Gewürz</option>
				<option value="oil">🫒 Öl/Fett</option>
				<option value="basic">🥫 Grundzutat</option>
			</select>
			<button onclick={addItem} class="bg-orange-500 hover:bg-orange-600 text-white font-baloo font-bold px-4 py-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer">
				+
			</button>
		</div>
	</div>

	<!-- Categories -->
	{#each (['spice', 'oil', 'basic'] as Category[]) as cat}
		{#if byCategory[cat].length > 0}
			<div class="bg-white rounded-3xl shadow-md p-5">
				<h2 class="font-baloo font-bold text-lg mb-3 flex items-center gap-2">
					<span>{categoryConfig[cat].icon}</span>
					<span>{categoryConfig[cat].label}e</span>
					<span class="text-sm font-nunito font-normal text-stone-400">({byCategory[cat].length})</span>
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each items.filter((i) => i.category === cat) as item}
						{@const globalIdx = items.indexOf(item)}
						<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold font-nunito {categoryConfig[cat].color}">
							{item.name}
							<button onclick={() => removeItem(globalIdx)} class="hover:opacity-70 transition-opacity cursor-pointer">×</button>
						</span>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>
