import type {
	CreatePickupInput,
	CreatePickupResponse,
	PickupDetailResponse,
	RatesResponse,
	VisualTier,
	WardsResponse
} from '@kachracash/types';

const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
	return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

export function getDevCitizenId(): string {
	return process.env.EXPO_PUBLIC_DEV_CITIZEN_ID ?? '00000000-0000-4000-8000-000000000001';
}

async function parseJson<T>(response: Response): Promise<T> {
	const body = (await response.json()) as { error?: string };
	if (!response.ok) {
		throw new Error(body.error ?? `Request failed (${response.status})`);
	}
	return body as T;
}

export async function fetchRatesForTier(tier: VisualTier): Promise<RatesResponse> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/rates?tier=${tier}`);
	return parseJson<RatesResponse>(response);
}

export async function fetchAllTierRates(): Promise<Record<VisualTier, RatesResponse>> {
	const tiers: VisualTier[] = ['RIGID_CONTAINERS', 'SOFT_FILMS', 'MIXED_BULKY'];
	const results = await Promise.all(tiers.map((tier) => fetchRatesForTier(tier)));

	return {
		RIGID_CONTAINERS: results[0],
		SOFT_FILMS: results[1],
		MIXED_BULKY: results[2]
	};
}

export async function fetchWards(): Promise<WardsResponse> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/wards`);
	return parseJson<WardsResponse>(response);
}

export async function createPickup(input: CreatePickupInput): Promise<CreatePickupResponse> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/pickups`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input)
	});
	return parseJson<CreatePickupResponse>(response);
}

export async function fetchPickupDetail(
	requestId: string,
	citizenId: string
): Promise<PickupDetailResponse> {
	const response = await fetch(
		`${getApiBaseUrl()}/api/v1/pickups/${requestId}?citizenId=${encodeURIComponent(citizenId)}`
	);
	return parseJson<PickupDetailResponse>(response);
}
