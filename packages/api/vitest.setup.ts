import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(import.meta.dirname, '../db/.env');

if (existsSync(envPath)) {
	for (const line of readFileSync(envPath, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const separator = trimmed.indexOf('=');
		if (separator === -1) continue;
		const key = trimmed.slice(0, separator);
		const value = trimmed.slice(separator + 1).replace(/^"|"$/g, '');
		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
}
