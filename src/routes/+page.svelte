<script lang="ts">
	let { data } = $props();

	if (data.session) {
		// client-side redirect if already logged in
	}
</script>

<svelte:head>
	<title>Rezepte — Familienrezepte</title>
</svelte:head>

{#if data.session}
	<script>window.location.href = '/recipes'</script>
{:else}
	<div class="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
		<!-- Hero illustration -->
		<div class="text-8xl mb-6 animate-pop-in">🍳</div>

		<h1 class="font-baloo font-extrabold text-4xl sm:text-5xl text-stone-900 mb-3">
			Unsere <span class="text-orange-500">Rezepte</span>
		</h1>
		<p class="text-stone-500 font-nunito text-lg max-w-md mb-8">
			Familienrezepte verwalten, gesund kochen und direkt zur Einkaufsliste hinzufügen.
		</p>

		<!-- Feature pills -->
		<div class="flex flex-wrap justify-center gap-2 mb-10">
			<span class="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">❤️ Kinderfreundlich</span>
			<span class="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">🌡️ Air Fryer</span>
			<span class="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold">🍚 Reiskocher</span>
			<span class="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">⚡ Schnell</span>
			<span class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">💧 Wenig Kalorien</span>
		</div>

		<!-- Login -->
		<form action="/auth/signin/google" method="post">
			<button
				type="submit"
				class="inline-flex items-center gap-3 bg-white border-2 border-orange-200 hover:border-orange-400 text-stone-700 font-baloo font-bold px-8 py-4 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 cursor-pointer text-lg"
			>
				<svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
				</svg>
				Mit Google anmelden
			</button>
		</form>

		<p class="mt-4 text-xs text-stone-400 font-nunito">Jeder Benutzer sieht nur seine eigenen Rezepte.</p>
	</div>
{/if}
