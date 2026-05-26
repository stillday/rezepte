<script lang="ts">
	interface Props {
		calories?: number;
		fat?: number;
		sugar?: number;
		protein?: number;
		compact?: boolean;
	}

	const { calories, fat, sugar, protein, compact = false }: Props = $props();

	function calColor(cal: number) {
		if (cal < 300) return 'bg-green-100 text-green-700';
		if (cal < 600) return 'bg-yellow-100 text-yellow-700';
		return 'bg-red-100 text-red-700';
	}
</script>

{#if calories || fat || sugar}
	<div class="flex flex-wrap gap-1.5">
		{#if calories}
			<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold {calColor(calories)}">
				🔥 {calories} kcal
			</span>
		{/if}
		{#if !compact}
			{#if fat}
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
					🫒 {fat}g Fett
				</span>
			{/if}
			{#if sugar}
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
					🍬 {sugar}g Zucker
				</span>
			{/if}
			{#if protein}
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
					💪 {protein}g Protein
				</span>
			{/if}
		{/if}
	</div>
{/if}
