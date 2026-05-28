<script lang="ts">
	import '../app.css';
	import Toast from '$lib/components/Toast.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';

	let { children, data } = $props();
	const session = $derived(data.session);

	onMount(() => {
		theme.init();
	});
</script>

<div class="min-h-dvh bg-amber-50 dark:bg-stone-900 font-nunito transition-colors duration-200">
	{#if session}
		<nav class="sticky top-0 z-30 bg-white/90 dark:bg-stone-800/90 backdrop-blur-md border-b border-orange-100 dark:border-stone-700 shadow-sm">
			<div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
				<a href="/recipes" class="font-baloo font-bold text-xl text-orange-600 hover:text-orange-500 transition-colors">
					🍳 Rezepte
				</a>
				<div class="flex items-center gap-4">
					<a href="/recipes" class="text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Meine Rezepte</a>
					<a href="/pantry" class="text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Vorrat</a>
					<button
						onclick={() => theme.toggle()}
						aria-label={theme.dark ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
						class="w-9 h-9 flex items-center justify-center rounded-xl text-stone-500 dark:text-stone-400 hover:bg-orange-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
					>
						{#if theme.dark}
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
								<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
							</svg>
						{/if}
					</button>
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
