/** Approximate centroids for pilot GMC wards (Guwahati) — MVP until GPS is wired. */
const WARD_COORDINATES: Record<number, { lat: number; lng: number }> = {
	15: { lat: 26.1895, lng: 91.7852 },
	24: { lat: 26.1542, lng: 91.7898 },
	28: { lat: 26.1304, lng: 91.7808 },
	29: { lat: 26.1421, lng: 91.7924 },
	30: { lat: 26.1188, lng: 91.7655 }
};

export function pickupLocationForWard(wardNumber: number) {
	return WARD_COORDINATES[wardNumber] ?? { lat: 26.1445, lng: 91.7362 };
}
