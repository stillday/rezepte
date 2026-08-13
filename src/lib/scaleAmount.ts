// Skaliert eine Zutatenmenge ("200", "1.5", "200-250") proportional zur Portionenanzahl.
// Erkennt das Format nicht (z.B. "1/2", "eine Prise") → Original unverändert zurückgeben,
// statt etwas Falsches zu raten.
const AMOUNT_RE = /^(\d+(?:[.,]\d+)?)(\s*-\s*(\d+(?:[.,]\d+)?))?(.*)$/;

function scaleOne(raw: string, ratio: number): string {
	const num = parseFloat(raw.replace(',', '.')) * ratio;
	const rounded = Math.round(num * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
}

export function scaleAmount(amount: string | undefined | null, ratio: number): string {
	if (!amount || !Number.isFinite(ratio) || ratio <= 0 || ratio === 1) return amount ?? '';

	const trimmed = amount.trim();
	// Brüche wie "1/2" nicht antasten — die simple Regex würde nur den Zähler skalieren
	// ("1/2" × 2 → "2/2" statt "1"), lieber unverändert lassen als falsch rechnen.
	if (/^\d+\s*\/\s*\d+/.test(trimmed)) return amount;

	const match = trimmed.match(AMOUNT_RE);
	if (!match) return amount;

	const [, first, , second, rest] = match;
	const scaledFirst = scaleOne(first, ratio);
	const scaledSecond = second ? scaleOne(second, ratio) : null;
	return scaledSecond ? `${scaledFirst}-${scaledSecond}${rest}` : `${scaledFirst}${rest}`;
}
