import { describe, it, expect } from 'vitest';
import { scaleAmount } from './scaleAmount';

describe('scaleAmount', () => {
	it('skaliert einfache Zahlen', () => {
		expect(scaleAmount('200', 2)).toBe('400');
		expect(scaleAmount('200', 0.5)).toBe('100');
	});

	it('rundet auf eine Nachkommastelle und nutzt Komma', () => {
		expect(scaleAmount('100', 1.5)).toBe('150');
		expect(scaleAmount('1', 1.5)).toBe('1,5');
	});

	it('skaliert Bereiche wie "200-250"', () => {
		expect(scaleAmount('200-250', 2)).toBe('400-500');
	});

	it('behält Komma-Dezimalzahlen bei', () => {
		expect(scaleAmount('1,5', 2)).toBe('3');
	});

	it('lässt Nicht-Zahlen unverändert (fail-safe)', () => {
		expect(scaleAmount('eine Prise', 2)).toBe('eine Prise');
		expect(scaleAmount('1/2', 2)).toBe('1/2');
	});

	it('gibt bei ratio 1 oder leerem Wert unverändert zurück', () => {
		expect(scaleAmount('200', 1)).toBe('200');
		expect(scaleAmount('', 2)).toBe('');
		expect(scaleAmount(undefined, 2)).toBe('');
	});
});
