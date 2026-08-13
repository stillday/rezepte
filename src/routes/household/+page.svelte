<script lang="ts">
	import { addToast } from '$lib/stores/toast.svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	let regenerating = $state(false);
	const inviteUrl = $derived(`${$page.url.origin}/household/join/${data.household.inviteCode}`);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(inviteUrl);
			addToast('Link kopiert 📋', 'success');
		} catch {
			addToast('Kopieren nicht möglich — Link manuell markieren', 'error');
		}
	}

	async function regenerateCode() {
		if (!confirm('Neuen Einladungslink erzeugen? Der alte Link funktioniert danach nicht mehr.')) return;
		regenerating = true;
		try {
			const res = await fetch('/api/household/invite', { method: 'POST' });
			if (!res.ok) throw new Error();
			await invalidateAll();
			addToast('Neuer Einladungslink erzeugt', 'success');
		} catch {
			addToast('Fehler beim Erzeugen', 'error');
		} finally {
			regenerating = false;
		}
	}
</script>

<svelte:head>
	<title>Haushalt</title>
</svelte:head>

<h1 class="font-baloo font-extrabold text-2xl text-stone-900 dark:text-stone-100 mb-6">🏠 {data.household.name}</h1>

<div class="bg-white dark:bg-stone-800 rounded-3xl shadow-md p-5 space-y-3 mb-5">
	<h2 class="font-baloo font-bold text-lg text-stone-900 dark:text-stone-100">Mitglieder</h2>
	<ul class="space-y-2">
		{#each data.members as member}
			<li class="flex items-center gap-3">
				{#if member.image}
					<img src={member.image} alt="" class="w-8 h-8 rounded-full" />
				{:else}
					<div class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-sm">👤</div>
				{/if}
				<div>
					<p class="font-nunito font-semibold text-sm text-stone-800 dark:text-stone-200">{member.name}</p>
					{#if member.email}
						<p class="font-nunito text-xs text-stone-400 dark:text-stone-500">{member.email}</p>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>

<div class="bg-white dark:bg-stone-800 rounded-3xl shadow-md p-5 space-y-3">
	<h2 class="font-baloo font-bold text-lg text-stone-900 dark:text-stone-100">Familie einladen</h2>
	<p class="text-sm text-stone-500 dark:text-stone-400 font-nunito">
		Wer diesen Link öffnet und sich mit Google anmeldet, sieht danach dieselben Rezepte und denselben Vorrat wie du.
	</p>
	<div class="flex flex-wrap gap-2">
		<input
			readonly
			value={inviteUrl}
			onclick={(e) => (e.target as HTMLInputElement).select()}
			class="flex-1 min-w-0 px-4 py-2.5 bg-amber-50 dark:bg-stone-700 dark:text-stone-100 border border-orange-100 dark:border-stone-600 rounded-2xl text-sm font-nunito"
		/>
		<button
			onclick={copyLink}
			class="bg-orange-500 hover:bg-orange-600 text-white font-baloo font-bold px-5 py-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer"
		>
			📋 Kopieren
		</button>
	</div>
	<button
		onclick={regenerateCode}
		disabled={regenerating}
		class="text-sm text-stone-400 hover:text-red-500 dark:hover:text-red-400 font-nunito cursor-pointer transition-colors disabled:opacity-50"
	>
		Link zurückziehen &amp; neuen erzeugen
	</button>
</div>
