let dark = $state(false);

function init() {
	if (typeof localStorage === 'undefined') return;
	const stored = localStorage.getItem('theme');
	if (stored === 'dark') {
		dark = true;
	} else if (stored === 'light') {
		dark = false;
	} else {
		dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	}
	applyClass();
}

function applyClass() {
	if (dark) {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}
}

function toggle() {
	dark = !dark;
	localStorage.setItem('theme', dark ? 'dark' : 'light');
	applyClass();
}

export const theme = {
	get dark() { return dark; },
	init,
	toggle
};
