export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
	id: number;
	message: string;
	tone: ToastTone;
}

export const toast = $state({ current: null as ToastMessage | null });

let nextId = 1;

export function showToast(message: string, tone: ToastTone = 'info', durationMs = 3200): void {
	const id = nextId++;
	toast.current = { id, message, tone };

	window.setTimeout(() => {
		if (toast.current?.id === id) toast.current = null;
	}, durationMs);
}

export function clearToast(): void {
	toast.current = null;
}
