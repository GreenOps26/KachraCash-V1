import type { WardSummary, WardSuspendInput, WardSuspendResponse, WardsResponse } from '@kachracash/types';
import { env } from '$env/dynamic/public';

const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
	return env.PUBLIC_API_URL ?? DEFAULT_API_URL;
}

async function parseJson<T>(response: Response): Promise<T> {
	const body = (await response.json()) as { error?: string };
	if (!response.ok) {
		throw new Error(body.error ?? `Request failed (${response.status})`);
	}
	return body as T;
}

export interface ApiHealth {
	status: string;
	service: string;
	timestamp: string;
	payoutGateway?: { provider: string; mode: string };
}

export async function fetchHealth(): Promise<ApiHealth> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/health`);
	return parseJson<ApiHealth>(response);
}

export async function fetchWards(): Promise<WardSummary[]> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/wards`);
	const payload = await parseJson<WardsResponse>(response);
	return payload.wards;
}

export interface DispatchAssignmentRow {
	id: string;
	status: string;
	wardLabel: string;
	collectorName: string;
	amount: string;
	tone: 'info' | 'warning' | 'success' | 'danger';
}

export interface CollectorWalletRow {
	name: string;
	float: string;
	status: string;
	tone: 'info' | 'warning' | 'success' | 'danger';
}

export interface LedgerEntryRow {
	time: string;
	collector: string;
	type: string;
	amount: string;
	ref: string;
}

export async function fetchDispatchAssignments(): Promise<DispatchAssignmentRow[]> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/admin/dispatch`);
	const payload = await parseJson<{ assignments: DispatchAssignmentRow[] }>(response);
	return payload.assignments;
}

export async function fetchLedgerDesk(): Promise<{
	collectors: CollectorWalletRow[];
	entries: LedgerEntryRow[];
}> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/admin/ledger`);
	return parseJson(response);
}

export async function suspendWard(
	wardId: string,
	input: WardSuspendInput
): Promise<WardSuspendResponse> {
	const response = await fetch(`${getApiBaseUrl()}/api/v1/admin/wards/${wardId}/suspend`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input)
	});
	return parseJson<WardSuspendResponse>(response);
}
