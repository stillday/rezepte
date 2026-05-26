<script lang="ts">
	import { addToast } from '$lib/stores/toast.svelte';

	interface Props {
		recipeId: string;
	}

	const { recipeId }: Props = $props();

	let loading = $state(false);
	let bouncing = $state(false);

	async function addToBring() {
		loading = true;
		try {
			const res = await fetch('/api/bring', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recipeId })
			});

			const data = await res.json();

			if (!res.ok) throw new Error(data.error || 'Fehler');

			bouncing = true;
			setTimeout(() => (bouncing = false), 600);

			const count = data.added ?? 0;
			addToast(count > 0 ? `${count} Zutaten zu Bring! hinzugefügt 🛒` : 'Alles schon im Vorrat!', 'success');
		} catch (e) {
			addToast(e instanceof Error ? e.message : 'Fehler beim Hinzufügen', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<button
	onclick={addToBring}
	disabled={loading}
	class="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-baloo font-bold px-6 py-3 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 cursor-pointer"
>
	<span class={bouncing ? 'animate-cart-bounce' : ''}>🛒</span>
	{#if loading}
		<span>Wird hinzugefügt…</span>
	{:else}
		<span>Zu Bring! hinzufügen</span>
	{/if}
</button>
