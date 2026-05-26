<script lang="ts">
	import { toasts, removeToast } from '$lib/stores/toast.svelte';
</script>

<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
	{#each toasts as toast (toast.id)}
		<div
			class="pointer-events-auto animate-toast-in flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl font-nunito font-semibold text-sm min-w-[220px] max-w-sm
			{toast.type === 'success' ? 'bg-green-500 text-white' : ''}
			{toast.type === 'error' ? 'bg-red-500 text-white' : ''}
			{toast.type === 'info' ? 'bg-orange-500 text-white' : ''}"
		>
			<span>
				{#if toast.type === 'success'}✅{:else if toast.type === 'error'}❌{:else}ℹ️{/if}
			</span>
			<span class="flex-1">{toast.message}</span>
			<button
				onclick={() => removeToast(toast.id)}
				class="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
				aria-label="Schließen"
			>
				×
			</button>
		</div>
	{/each}
</div>
