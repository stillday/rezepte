<script lang="ts">
	import { addToast } from '$lib/stores/toast.svelte';
	import { untrack } from 'svelte';

	let { data } = $props();

	interface Slot {
		day: number;
		recipeId: string;
	}

	const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	let slots = $state<Slot[]>(untrack(() => [...data.slots]));
	let picking = $state<number | null>(null);
	let saving = $state(false);
	let creatingList = $state(false);

	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	function titleFor(recipeId: string): string {
		return data.recipes.find((r) => r.id === recipeId)?.title ?? '(gelöschtes Rezept)';
	}

	function addSlot(day: number, recipeId: string) {
		if (!recipeId) return;
		slots = [...slots, { day, recipeId }];
		picking = null;
	}

	function removeSlot(day: number, recipeId: string) {
		const idx = slots.findIndex((s) => s.day === day && s.recipeId === recipeId);
		if (idx !== -1) slots = slots.toSpliced(idx, 1);
	}

	async function savePlan() {
		saving = true;
		try {
			const res = await fetch('/api/planner', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slots })
			});
			if (!res.ok) throw new Error();
			addToast('Wochenplan gespeichert ✅', 'success');
		} catch {
			addToast('Speichern fehlgeschlagen', 'error');
		} finally {
			saving = false;
		}
	}

	async function createShoppingList() {
		creatingList = true;
		try {
			const res = await fetch('/api/planner/shopping-list', { method: 'POST' });
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Fehlgeschlagen');
			const count = data.added ?? 0;
			addToast(count > 0 ? `${count} Zutaten zu Bring! hinzugefügt 🛒` : (data.message ?? 'Alles schon im Vorrat!'), 'success');
		} catch (e) {
			addToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			creatingList = false;
		}
	}
</script>

<svelte:head>
	<title>Wochenplaner</title>
</svelte:head>

<div class="space-y-6 pb-10">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div>
			<h1 class="font-baloo font-extrabold text-3xl text-stone-900 dark:text-stone-100">📅 Wochenplaner</h1>
			<p class="text-stone-400 dark:text-stone-500 font-nunito text-sm">Wiederkehrender Plan — kein festes Datum</p>
		</div>
		<div class="flex gap-2">
			<button
				onclick={createShoppingList}
				disabled={creatingList || slots.length === 0}
				class="bg-white dark:bg-stone-800 border-2 border-orange-200 dark:border-stone-600 hover:border-orange-400 text-stone-700 dark:text-stone-200 font-baloo font-bold px-4 py-2.5 rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
			>
				{creatingList ? '⏳' : '🛒'} Einkaufsliste zu Bring!
			</button>
			<button
				onclick={savePlan}
				disabled={saving}
				class="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-baloo font-bold px-5 py-2.5 rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer"
			>
				{saving ? '⏳' : '💾'} Speichern
			</button>
		</div>
	</div>

	{#if data.recipes.length === 0}
		<div class="bg-amber-50 dark:bg-stone-800 border border-orange-100 dark:border-stone-700 rounded-3xl p-5 text-center text-stone-500 dark:text-stone-400 font-nunito">
			Lege zuerst ein paar Rezepte an, um sie hier einzuplanen.
		</div>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each DAYS as dayLabel, day}
			<div class="bg-white dark:bg-stone-800 rounded-3xl shadow-md p-4 space-y-2">
				<h2 class="font-baloo font-bold text-stone-900 dark:text-stone-100">{dayLabel}</h2>
				{#each slots.filter((s) => s.day === day) as slot}
					<div class="flex items-center justify-between gap-2 bg-amber-50 dark:bg-stone-700 rounded-xl px-3 py-2">
						<span class="text-sm font-nunito text-stone-700 dark:text-stone-300 truncate">{titleFor(slot.recipeId)}</span>
						<button
							onclick={() => removeSlot(day, slot.recipeId)}
							class="text-red-300 hover:text-red-500 transition-colors cursor-pointer shrink-0"
							aria-label="entfernen"
						>×</button>
					</div>
				{/each}

				{#if picking === day}
					<select
						use:focusOnMount
						onchange={(e) => addSlot(day, (e.target as HTMLSelectElement).value)}
						onblur={() => (picking = null)}
						class="w-full px-3 py-2 bg-amber-50 dark:bg-stone-700 dark:text-stone-100 border border-orange-100 dark:border-stone-600 rounded-xl text-sm font-nunito"
					>
						<option value="">Rezept wählen…</option>
						{#each data.recipes as r}
							<option value={r.id}>{r.title}</option>
						{/each}
					</select>
				{:else}
					<button
						onclick={() => (picking = day)}
						disabled={data.recipes.length === 0}
						class="w-full text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 font-semibold font-nunito cursor-pointer transition-colors disabled:opacity-40"
					>
						+ Rezept
					</button>
				{/if}
			</div>
		{/each}
	</div>
</div>
