import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		external: ['mongoose', 'mongodb']
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
