<script lang="ts">
	import { addToast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let joining = $state(false);

	async function join() {
		joining = true;
		try {
			const res = await fetch('/api/household/join', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: data.code })
			});
			if (!res.ok) throw new Error();
			addToast('Haushalt beigetreten 🎉', 'success');
			goto('/recipes');
		} catch {
			addToast('Beitritt fehlgeschlagen — Link evtl. nicht mehr gültig', 'error');
		} finally {
			joining = false;
		}
	}
</script>

<svelte:head>
	<title>Haushalt beitreten</title>
</svelte:head>

<div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
	<div class="text-6xl mb-4 animate-pop-in">🏠</div>
	<h1 class="font-baloo font-extrabold text-2xl text-stone-900 dark:text-stone-100 mb-2">
		Haushalt „{data.householdName}“ beitreten?
	</h1>
	<p class="text-stone-500 dark:text-stone-400 font-nunito max-w-sm mb-8">
		Du siehst danach dieselben Rezepte und denselben Vorrat wie die anderen Mitglieder. Eigene Rezepte, die du bisher
		alleine angelegt hast, nimmst du automatisch mit.
	</p>
	<button
		onclick={join}
		disabled={joining}
		class="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-baloo font-bold px-8 py-4 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all text-lg cursor-pointer"
	>
		{joining ? '⏳ Wird beigetreten…' : 'Beitreten'}
	</button>
</div>
