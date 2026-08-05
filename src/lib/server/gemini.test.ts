import { describe, it, expect } from 'vitest';
import { parseRecipeJson } from './gemini';

describe('parseRecipeJson', () => {
	it('parst reines JSON', () => {
		const result = parseRecipeJson('{"title":"Apfelkuchen","servings":4}');
		expect(result).toEqual({ title: 'Apfelkuchen', servings: 4 });
	});

	it('parst JSON mit Markdown-Codefence drumherum', () => {
		const result = parseRecipeJson('```json\n{"title":"Apfelkuchen"}\n```');
		expect(result).toEqual({ title: 'Apfelkuchen' });
	});

	it('parst JSON mit Text davor und danach', () => {
		const result = parseRecipeJson('Hier ist das Rezept:\n{"title":"Kuchen"}\nViel Erfolg!');
		expect(result).toEqual({ title: 'Kuchen' });
	});

	it('wirft bei komplett fehlendem JSON', () => {
		expect(() => parseRecipeJson('Ich konnte kein Rezept erkennen.')).toThrow();
	});

	it('wirft bei kaputtem JSON (nicht abgeschlossen)', () => {
		expect(() => parseRecipeJson('{"title":"Kuchen"')).toThrow();
	});

	it('parst verschachteltes JSON (ingredients/steps Arrays)', () => {
		const input = JSON.stringify({
			title: 'Test',
			ingredients: [{ name: 'Mehl', amount: '200', unit: 'g' }],
			steps: ['Mischen', 'Backen']
		});
		const result = parseRecipeJson(input);
		expect(result).toEqual({
			title: 'Test',
			ingredients: [{ name: 'Mehl', amount: '200', unit: 'g' }],
			steps: ['Mischen', 'Backen']
		});
	});
});
