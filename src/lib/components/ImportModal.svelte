<script lang="ts">
	import { addToast } from '$lib/stores/toast.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
		onimport: (recipe: object) => void;
	}

	const { open, onclose, onimport }: Props = $props();

	let tab = $state<'url' | 'scan' | 'manual'>('url');
	let url = $state('');
	let loading = $state(false);
	let scanFile = $state<File | null>(null);

	const SOCIAL_RE = /(^|\.)(instagram\.com|tiktok\.com)$/i;

	function isSocialUrl(value: string): boolean {
		try {
			return SOCIAL_RE.test(new URL(value).hostname);
		} catch {
			return false;
		}
	}

	async function importUrl() {
		if (!url.trim()) return;
		loading = true;
		try {
			// Instagram-/TikTok-Links laufen über yt-dlp + KI (Caption), normale Seiten über JSON-LD/KI.
			const endpoint = isSocialUrl(url.trim()) ? '/api/import/social' : '/api/import/url';
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: url.trim() })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Import fehlgeschlagen');
			onimport(data);
			onclose();
		} catch (e) {
			addToast(e instanceof Error ? e.message : 'Fehler beim Import', 'error');
		} finally {
			loading = false;
		}
	}

	async function importScan() {
		if (!scanFile) return;
		loading = true;
		try {
			const reader = new FileReader();
			const base64 = await new Promise<string>((resolve, reject) => {
				reader.onload = () => resolve((reader.result as string).split(',')[1]);
				reader.onerror = reject;
				reader.readAsDataURL(scanFile!);
			});

			const res = await fetch('/api/import/scan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ imageBase64: base64, mediaType: scanFile.type })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Scan fehlgeschlagen');
			onimport(data);
			onclose();
		} catch (e) {
			addToast(e instanceof Error ? e.message : 'Fehler beim Scan', 'error');
		} finally {
			loading = false;
		}
	}

	const tabs = [
		{ key: 'url' as const, label: '🔗 Link', icon: '🔗' },
		{ key: 'scan' as const, label: '📷 Foto', icon: '📷' },
		{ key: 'manual' as const, label: '✏️ Manuell', icon: '✏️' }
	];
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-up"
		onclick={onclose}
		role="presentation"
	></div>

	<div class="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 animate-pop-in">
		<div class="bg-white dark:bg-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
			<div class="flex items-center justify-between p-5 border-b border-orange-100 dark:border-stone-700">
				<h2 class="font-baloo font-bold text-xl text-stone-900 dark:text-stone-100">Rezept hinzufügen</h2>
				<button onclick={onclose} class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-2xl leading-none cursor-pointer transition-colors" aria-label="Schließen">×</button>
			</div>

			<div class="flex border-b border-orange-100 dark:border-stone-700">
				{#each tabs as t}
					<button
						onclick={() => (tab = t.key)}
						class="flex-1 py-3 text-sm font-semibold font-nunito transition-colors cursor-pointer
						{tab === t.key ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}"
					>
						{t.label}
					</button>
				{/each}
			</div>

			<div class="p-5">
				{#if tab === 'url'}
					<div class="space-y-4">
						<p class="text-sm text-stone-500 dark:text-stone-400 font-nunito">Rezept-URL einfügen — auch Instagram-Reels & TikTok. Die KI extrahiert alles automatisch.</p>
						<input
							type="url"
							bind:value={url}
							placeholder="Webseite, Instagram- oder TikTok-Link…"
							class="w-full px-4 py-3 bg-amber-50 dark:bg-stone-700 dark:text-stone-100 dark:placeholder:text-stone-500 border border-orange-100 dark:border-stone-600 rounded-2xl text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-500"
						/>
						<button
							onclick={importUrl}
							disabled={loading || !url.trim()}
							class="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-baloo font-bold py-3 rounded-2xl transition-all active:scale-95 cursor-pointer"
						>
							{loading ? '⏳ Wird importiert…' : '🔗 Rezept importieren'}
						</button>
					</div>

				{:else if tab === 'scan'}
					<div class="space-y-4">
						<p class="text-sm text-stone-500 dark:text-stone-400 font-nunito">Foto deines Kochbuchs — Claude liest das Rezept heraus.</p>
						<label class="block w-full cursor-pointer">
							<input
								type="file"
								accept="image/*"
								capture="environment"
								class="hidden"
								onchange={(e) => { scanFile = (e.target as HTMLInputElement).files?.[0] ?? null; }}
							/>
							<div class="border-2 border-dashed border-orange-200 dark:border-stone-600 rounded-2xl p-8 text-center hover:border-orange-400 dark:hover:border-orange-500 transition-colors bg-amber-50 dark:bg-stone-700">
								{#if scanFile}
									<p class="font-semibold text-orange-600 dark:text-orange-400 font-nunito">📷 {scanFile.name}</p>
								{:else}
									<p class="text-stone-400 dark:text-stone-500 font-nunito">📷 Foto aufnehmen oder auswählen</p>
								{/if}
							</div>
						</label>
						<button
							onclick={importScan}
							disabled={loading || !scanFile}
							class="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-baloo font-bold py-3 rounded-2xl transition-all active:scale-95 cursor-pointer"
						>
							{loading ? '⏳ Wird gescannt…' : '📷 Rezept scannen'}
						</button>
					</div>

				{:else}
					<div class="text-center py-6 text-stone-400 dark:text-stone-500 font-nunito">
						<p class="text-3xl mb-2">✏️</p>
						<p>Du wirst zum Formular weitergeleitet.</p>
						<a href="/recipes/new?manual=1" onclick={onclose} class="mt-3 inline-block bg-orange-500 text-white font-baloo font-bold px-6 py-2.5 rounded-2xl hover:bg-orange-600 transition-colors">
							Manuell eingeben
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
