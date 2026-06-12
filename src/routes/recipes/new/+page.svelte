<script lang="ts">
	import ImportModal from '$lib/components/ImportModal.svelte';
	import { addToast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';

	// Der ?manual=1-Fall wird serverseitig (+page.server.ts) per Redirect erledigt.
	// Hier landet nur der Import-Flow (Link/Foto).
	let showModal = $state(true);

	async function handleImport(recipe: object) {
		const res = await fetch('/api/recipes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(recipe)
		});
		const data = await res.json();
		if (data.id) {
			goto(`/recipes/${data.id}/edit`);
		} else {
			addToast(data.message || 'Rezept konnte nicht gespeichert werden', 'error');
		}
	}
</script>

<ImportModal open={showModal} onclose={() => goto('/recipes')} onimport={handleImport} />
