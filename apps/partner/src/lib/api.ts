import type {
	AcceptPickupResponse,
	CollectorLoginResponse,
	CompleteOrderInput,
	PickupListResponse,
	RatesResponse,
	VisualTier
} from '@kachracash/types';

const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
	return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

export function getDevCollectorId(): string {
	return process.env.EXPO_PUBLIC_DEV_COLLECTOR_ID ?? '00000000-0000-4000-8000-000000000002';
}

let authToken: string | null = null;

async function parseJson<T>(response: Response): Promise<T> {
	const body = (await response.json()) as { error?: string };
	if (!response.ok) {
		throw new Error(body.error ?? `Request failed (${response.status})`);
	}
	return body as T;
}

export async function ensureCollectorAuth(): Promise<string> {
	if (authToken) {
		return authToken;
	}

	const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/collector/dev-login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ collectorId: getDevCollectorId() })
	});

	const payload = await parseJson<CollectorLoginResponse>(response);
	authToken = payload.token;
	return authToken;
}

async function authHeaders(): Promise<Record<string, string>> {
	const token = await ensureCollectorAuth();
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};
}

export async function fetchPendingPickups(): Promise<PickupListResponse> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/pickups?status=PENDING`);
	return parseJson<PickupListResponse>(response);
}

export async function acceptPickup(
	requestId: string,
	collectorId: string
): Promise<AcceptPickupResponse> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/pickups/${requestId}/accept`, {
		method: 'POST',
		headers: await authHeaders(),
		body: JSON.stringify({ collectorId })
	});
	return parseJson<AcceptPickupResponse>(response);
}

export async function fetchRatesForTier(tier: VisualTier): Promise<RatesResponse> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/rates?tier=${tier}`);
	return parseJson<RatesResponse>(response);
}

export async function completeOrder(
	requestId: string,
	input: CompleteOrderInput
): Promise<unknown> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/orders/${requestId}/complete`, {
		method: 'POST',
		headers: await authHeaders(),
		body: JSON.stringify(input)
	});
	return parseJson(response);
}
