export type ToastType = 'success' | 'error' | 'info';

interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

let nextId = 0;
let toasts = $state<Toast[]>([]);

export function addToast(message: string, type: ToastType = 'success') {
	const id = nextId++;
	toasts.push({ id, message, type });
	setTimeout(() => removeToast(id), 4000);
}

export function removeToast(id: number) {
	const idx = toasts.findIndex((t) => t.id === id);
	if (idx !== -1) toasts.splice(idx, 1);
}

export { toasts };
