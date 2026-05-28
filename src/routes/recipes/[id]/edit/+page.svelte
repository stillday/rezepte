<script lang="ts">
	import TagChip from '$lib/components/TagChip.svelte';
	import { addToast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	let { data } = $props();
	const recipeId = $derived(data.recipe.id);
	const r = data.recipe;

	let title = $state(r.title ?? '');
	let description = $state(r.description ?? '');
	let servings = $state(r.servings ?? 4);
	let prepTime = $state<number | ''>(r.prepTime ?? '');
	let tags = $state<string[]>([...(r.tags ?? [])]);
	let ingredients = $state<{ name: string; amount: string; unit: string }[]>(
		r.ingredients?.length ? [...r.ingredients] : [{ name: '', amount: '', unit: '' }]
	);
	let steps = $state<string[]>(r.steps?.length ? [...r.steps] : ['']);
	let calories = $state<number | ''>(r.nutrition?.calories ?? '');
	let fat = $state<number | ''>(r.nutrition?.fat ?? '');
	let sugar = $state<number | ''>(r.nutrition?.sugar ?? '');
	let protein = $state<number | ''>(r.nutrition?.protein ?? '');
	let saving = $state(false);

	const availableTags = [
		{ key: 'kids', label: '❤️ Kinder' },
		{ key: 'quick', label: '⚡ Schnell' },
		{ key: 'airfryer', label: '🌡️ Air Fryer' },
		{ key: 'ricecooker', label: '🍚 Reiskocher' },
		{ key: 'lowcal', label: '💧 Wenig Kalorien' },
		{ key: 'lowsugar', label: '🍃 Wenig Zucker' }
	];

	function toggleTag(key: string) {
		tags = tags.includes(key) ? tags.filter((t) => t !== key) : [...tags, key];
	}

	function addIngredient() {
		ingredients = [...ingredients, { name: '', amount: '', unit: '' }];
	}
	function removeIngredient(i: number) {
		ingredients = ingredients.filter((_: unknown, idx: number) => idx !== i);
	}
	function addStep() {
		steps = [...steps, ''];
	}
	function removeStep(i: number) {
		steps = steps.filter((_: unknown, idx: number) => idx !== i);
	}

	async function save() {
		saving = true;
		try {
			const res = await fetch(`/api/recipes/${recipeId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title, description, servings: Number(servings), prepTime: prepTime ? Number(prepTime) : undefined,
					tags,
					ingredients: ingredients.filter((i) => i.name.trim()),
					steps: steps.filter((s) => s.trim()),
					nutrition: {
						calories: calories ? Number(calories) : undefined,
						fat: fat ? Number(fat) : undefined,
						sugar: sugar ? Number(sugar) : undefined,
						protein: protein ? Number(protein) : undefined
					}
				})
			});
			if (!res.ok) throw new Error('Speichern fehlgeschlagen');
			addToast('Rezept gespeichert ✅', 'success');
			goto(`/recipes/${recipeId}`);
		} catch (e) {
			addToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{title || 'Rezept bearbeiten'}</title>
</svelte:head>

<a href="/recipes/{recipeId}" class="inline-flex items-center gap-2 text-stone-400 hover:text-orange-600 font-nunito text-sm mb-6 transition-colors">
	← Zurück
</a>

<div class="space-y-5 pb-10">
	<h1 class="font-baloo font-extrabold text-2xl text-stone-900">Rezept bearbeiten</h1>

	<!-- Basic info -->
	<div class="bg-white rounded-3xl shadow-md p-5 space-y-4">
		<h2 class="font-baloo font-bold text-lg">Grundinfo</h2>
		<div>
			<label class="block text-sm font-semibold text-stone-600 mb-1.5 font-nunito">Titel *</label>
			<input bind:value={title} type="text" placeholder="Spaghetti Bolognese" class="w-full px-4 py-2.5 bg-amber-50 border border-orange-100 rounded-2xl font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300" />
		</div>
		<div>
			<label class="block text-sm font-semibold text-stone-600 mb-1.5 font-nunito">Beschreibung</label>
			<textarea bind:value={description} rows="2" placeholder="Kurze Beschreibung…" class="w-full px-4 py-2.5 bg-amber-50 border border-orange-100 rounded-2xl font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"></textarea>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div>
				<label class="block text-sm font-semibold text-stone-600 mb-1.5 font-nunito">Portionen</label>
				<input bind:value={servings} type="number" min="1" class="w-full px-4 py-2.5 bg-amber-50 border border-orange-100 rounded-2xl font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300" />
			</div>
			<div>
				<label class="block text-sm font-semibold text-stone-600 mb-1.5 font-nunito">⏱️ Zeit (Min)</label>
				<input bind:value={prepTime} type="number" min="1" placeholder="30" class="w-full px-4 py-2.5 bg-amber-50 border border-orange-100 rounded-2xl font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300" />
			</div>
		</div>
	</div>

	<!-- Tags -->
	<div class="bg-white rounded-3xl shadow-md p-5 space-y-3">
		<h2 class="font-baloo font-bold text-lg">Tags</h2>
		<div class="flex flex-wrap gap-2">
			{#each availableTags as t}
				<button
					onclick={() => toggleTag(t.key)}
					class="px-3 py-1.5 rounded-full text-sm font-semibold font-nunito transition-all active:scale-95 cursor-pointer
					{tags.includes(t.key) ? 'bg-orange-500 text-white' : 'bg-amber-50 text-stone-600 border border-orange-100 hover:bg-orange-100'}"
				>
					{t.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Nutrition -->
	<div class="bg-white rounded-3xl shadow-md p-5 space-y-3">
		<h2 class="font-baloo font-bold text-lg">🔥 Nährwerte pro Portion</h2>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
			{#each [['calories', '🔥 kcal', calories], ['fat', '🫒 Fett g', fat], ['sugar', '🍬 Zucker g', sugar], ['protein', '💪 Protein g', protein]] as [key, label, val]}
				<div>
					<label class="block text-xs font-semibold text-stone-500 mb-1 font-nunito">{label}</label>
					<input
						type="number" min="0"
						value={val}
						oninput={(e) => {
							const v = (e.target as HTMLInputElement).value;
							const n: number | '' = v === '' ? '' : Number(v);
							if (key === 'calories') calories = n;
							else if (key === 'fat') fat = n;
							else if (key === 'sugar') sugar = n;
							else if (key === 'protein') protein = n;
						}}
						class="w-full px-3 py-2 bg-amber-50 border border-orange-100 rounded-xl text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300"
					/>
				</div>
			{/each}
		</div>
	</div>

	<!-- Ingredients -->
	<div class="bg-white rounded-3xl shadow-md p-5 space-y-3">
		<h2 class="font-baloo font-bold text-lg">🛒 Zutaten</h2>
		{#each ingredients as ing, i}
			<div class="flex gap-2 items-center">
				<input bind:value={ing.amount} type="text" placeholder="200" class="w-20 px-3 py-2 bg-amber-50 border border-orange-100 rounded-xl text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300" />
				<input bind:value={ing.unit} type="text" placeholder="g" class="w-16 px-3 py-2 bg-amber-50 border border-orange-100 rounded-xl text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300" />
				<input bind:value={ing.name} type="text" placeholder="Mehl" class="flex-1 px-3 py-2 bg-amber-50 border border-orange-100 rounded-xl text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300" />
				<button onclick={() => removeIngredient(i)} class="text-red-300 hover:text-red-500 transition-colors cursor-pointer text-lg">×</button>
			</div>
		{/each}
		<button onclick={addIngredient} class="text-sm text-orange-500 hover:text-orange-600 font-semibold font-nunito cursor-pointer transition-colors">
			+ Zutat hinzufügen
		</button>
	</div>

	<!-- Steps -->
	<div class="bg-white rounded-3xl shadow-md p-5 space-y-3">
		<h2 class="font-baloo font-bold text-lg">👨‍🍳 Zubereitung</h2>
		{#each steps as step, i}
			<div class="flex gap-3 items-start">
				<span class="shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-baloo font-bold text-sm flex items-center justify-center mt-2">{i + 1}</span>
				<textarea
					bind:value={steps[i]}
					rows="2"
					placeholder="Schritt beschreiben…"
					class="flex-1 px-3 py-2 bg-amber-50 border border-orange-100 rounded-xl text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
				></textarea>
				<button onclick={() => removeStep(i)} class="text-red-300 hover:text-red-500 mt-2 cursor-pointer text-lg transition-colors">×</button>
			</div>
		{/each}
		<button onclick={addStep} class="text-sm text-orange-500 hover:text-orange-600 font-semibold font-nunito cursor-pointer transition-colors">
			+ Schritt hinzufügen
		</button>
	</div>

	<!-- Save -->
	<button
		onclick={save}
		disabled={saving || !title.trim()}
		class="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-baloo font-bold py-4 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all text-lg cursor-pointer"
	>
		{saving ? '⏳ Wird gespeichert…' : '✅ Rezept speichern'}
	</button>
</div>
