import crypto from 'node:crypto';
import { db } from '@kachracash/db';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getJwtSecret(): string {
	return process.env.JWT_SECRET ?? 'kachracash-dev-jwt-secret';
}

export interface CollectorAuthResult {
	token: string;
	collectorId: string;
	fullName: string;
}

export async function loginCollectorByPhone(phoneNumber: string): Promise<CollectorAuthResult> {
	const collector = await db.collector.findUnique({ where: { phoneNumber } });

	if (!collector) {
		throw new Error('COLLECTOR_NOT_FOUND');
	}

	return {
		collectorId: collector.id,
		fullName: collector.fullName,
		token: signCollectorToken(collector.id)
	};
}

export async function loginCollectorDev(collectorId: string): Promise<CollectorAuthResult> {
	if (process.env.COLLECTOR_DEV_AUTH !== 'true') {
		throw new Error('DEV_AUTH_DISABLED');
	}

	const collector = await db.collector.findUnique({ where: { id: collectorId } });

	if (!collector) {
		throw new Error('COLLECTOR_NOT_FOUND');
	}

	return {
		collectorId: collector.id,
		fullName: collector.fullName,
		token: signCollectorToken(collector.id)
	};
}

export function signCollectorToken(collectorId: string): string {
	const payload = Buffer.from(
		JSON.stringify({
			sub: collectorId,
			role: 'COLLECTOR',
			exp: Date.now() + TOKEN_TTL_MS
		})
	).toString('base64url');

	const signature = crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('base64url');
	return `${payload}.${signature}`;
}

export function verifyCollectorToken(token: string): { collectorId: string } | null {
	const [payload, signature] = token.split('.');

	if (!payload || !signature) {
		return null;
	}

	const expected = crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('base64url');

	if (signature !== expected) {
		return null;
	}

	try {
		const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
			sub?: string;
			role?: string;
			exp?: number;
		};

		if (decoded.role !== 'COLLECTOR' || !decoded.sub || !decoded.exp || decoded.exp < Date.now()) {
			return null;
		}

		return { collectorId: decoded.sub };
	} catch {
		return null;
	}
}

export function extractBearerToken(authorizationHeader?: string): string | null {
	if (!authorizationHeader?.startsWith('Bearer ')) {
		return null;
	}

	return authorizationHeader.slice('Bearer '.length).trim() || null;
}
