<script lang="ts">
	import '../app.css';
	import Toast from '$lib/components/Toast.svelte';

	let { children, data } = $props();
	const session = $derived(data.session);
</script>

<div class="min-h-dvh bg-amber-50 font-nunito">
	{#if session}
		<nav class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-sm">
			<div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
				<a href="/recipes" class="font-baloo font-bold text-xl text-orange-600 hover:text-orange-700 transition-colors">
					🍳 Rezepte
				</a>
				<div class="flex items-center gap-4">
					<a href="/recipes" class="text-sm font-semibold text-stone-600 hover:text-orange-600 transition-colors">Meine Rezepte</a>
					<a href="/pantry" class="text-sm font-semibold text-stone-600 hover:text-orange-600 transition-colors">Vorrat</a>
					<form action="/auth/signout" method="post">
						<button type="submit" class="text-sm text-stone-400 hover:text-red-500 transition-colors cursor-pointer">Abmelden</button>
					</form>
				</div>
			</div>
		</nav>
	{/if}

	<main class="max-w-4xl mx-auto px-4 py-6">
		{@render children()}
	</main>

	<Toast />
</div>
