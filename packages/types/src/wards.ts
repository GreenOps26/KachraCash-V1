/** Canonical ward id for API requests, e.g. WARD_BELTOLA_28 */
export function formatWardId(wardNumber: number, wardName: string): string {
	const token = wardName.split('/')[0].trim().split(/\s+/)[0].toUpperCase();
	return `WARD_${token}_${wardNumber}`;
}
