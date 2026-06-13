<script lang="ts">
	interface Props {
		tag: string;
		removable?: boolean;
		onremove?: () => void;
	}

	const { tag, removable = false, onremove }: Props = $props();

	const tagConfig: Record<string, { classes: string; icon: string; label: string }> = {
		kids: { classes: 'bg-pink-100 text-pink-700', icon: '❤️', label: 'Kinder' },
		quick: { classes: 'bg-yellow-100 text-yellow-700', icon: '⚡', label: 'Schnell' },
		airfryer: { classes: 'bg-orange-100 text-orange-700', icon: '🌡️', label: 'Air Fryer' },
		ricecooker: { classes: 'bg-green-100 text-green-700', icon: '🍚', label: 'Reiskocher' },
		lowcal: { classes: 'bg-blue-100 text-blue-700', icon: '💧', label: 'Wenig Kalorien' },
		lowsugar: { classes: 'bg-teal-100 text-teal-700', icon: '🍃', label: 'Wenig Zucker' }
	};

	const config = $derived(tagConfig[tag] ?? { classes: 'bg-stone-100 text-stone-600', icon: '🏷️', label: tag });
</script>

<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-nunito transition-all duration-150 {config.classes}">
	<span>{config.icon}</span>
	<span>{config.label}</span>
	{#if removable}
		<button
			onclick={onremove}
			class="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
			aria-label="Tag entfernen"
		>
			×
		</button>
	{/if}
</span>
