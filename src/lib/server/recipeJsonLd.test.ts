import { describe, it, expect } from 'vitest';
import { extractJsonLdRecipe } from './recipeJsonLd';

function withJsonLd(obj: unknown): string {
	return `<html><head><script type="application/ld+json">${JSON.stringify(obj)}</script></head><body></body></html>`;
}

describe('extractJsonLdRecipe', () => {
	it('extrahiert ein einfaches Recipe-Objekt', () => {
		const html = withJsonLd({
			'@type': 'Recipe',
			name: 'Apfelkuchen',
			description: 'Ein Klassiker',
			recipeYield: '4',
			totalTime: 'PT45M',
			recipeIngredient: ['200 g Mehl', '3 Äpfel'],
			recipeInstructions: ['Ofen vorheizen', 'Backen'],
			nutrition: { calories: '350', fatContent: '12g' }
		});
		const result = extractJsonLdRecipe(html);
		expect(result).not.toBeNull();
		expect(result?.title).toBe('Apfelkuchen');
		expect(result?.servings).toBe(4);
		expect(result?.prepTime).toBe(45);
		expect(result?.ingredients).toEqual([
			{ name: 'Mehl', amount: '200', unit: 'g' },
			{ name: 'Äpfel', amount: '3', unit: '' }
		]);
		expect(result?.steps).toEqual(['Ofen vorheizen', 'Backen']);
		expect(result?.nutrition.calories).toBe(350);
	});

	it('findet Recipe innerhalb von @graph', () => {
		const html = withJsonLd({
			'@context': 'https://schema.org',
			'@graph': [
				{ '@type': 'WebSite', name: 'Beispiel' },
				{ '@type': 'Recipe', name: 'Suppe', recipeIngredient: ['1 l Wasser'], recipeInstructions: ['Kochen'] }
			]
		});
		const result = extractJsonLdRecipe(html);
		expect(result?.title).toBe('Suppe');
	});

	it('findet Recipe wenn @type ein Array ist', () => {
		const html = withJsonLd({
			'@type': ['Recipe', 'NewsArticle'],
			name: 'Gemischtes',
			recipeIngredient: ['1 Ei'],
			recipeInstructions: ['Braten']
		});
		const result = extractJsonLdRecipe(html);
		expect(result?.title).toBe('Gemischtes');
	});

	it('dekodiert deutsche HTML-Entities im Titel', () => {
		const html = withJsonLd({
			'@type': 'Recipe',
			name: 'Kn&ouml;del mit S&szlig;e',
			recipeIngredient: ['1 Kartoffel'],
			recipeInstructions: ['Kochen']
		});
		const result = extractJsonLdRecipe(html);
		expect(result?.title).toBe('Knödel mit Sße');
	});

	it('parst HowToSection-verschachtelte Anleitungen', () => {
		const html = withJsonLd({
			'@type': 'Recipe',
			name: 'Mehrstufig',
			recipeIngredient: ['1 Zutat'],
			recipeInstructions: [
				{
					'@type': 'HowToSection',
					itemListElement: [{ text: 'Schritt A' }, { text: 'Schritt B' }]
				}
			]
		});
		const result = extractJsonLdRecipe(html);
		expect(result?.steps).toEqual(['Schritt A', 'Schritt B']);
	});

	it('gibt null zurück wenn kein JSON-LD vorhanden ist', () => {
		expect(extractJsonLdRecipe('<html><body>Keine Rezepte hier</body></html>')).toBeNull();
	});

	it('gibt null zurück bei kaputtem JSON-LD (ignoriert es statt zu crashen)', () => {
		const html = '<script type="application/ld+json">{invalid json</script>';
		expect(extractJsonLdRecipe(html)).toBeNull();
	});

	it('gibt null zurück wenn Recipe weder Zutaten noch Schritte hat', () => {
		const html = withJsonLd({ '@type': 'Recipe', name: 'Leer' });
		expect(extractJsonLdRecipe(html)).toBeNull();
	});

	it('ignoriert Nicht-Recipe-Typen und nimmt das nächste passende Script', () => {
		const html =
			withJsonLd({ '@type': 'Organization', name: 'Firma' }) +
			withJsonLd({ '@type': 'Recipe', name: 'Echt', recipeIngredient: ['1 Ei'], recipeInstructions: ['Kochen'] });
		const result = extractJsonLdRecipe(html);
		expect(result?.title).toBe('Echt');
	});
});
