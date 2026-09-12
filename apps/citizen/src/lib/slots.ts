export interface PickupSlot {
	id: string;
	label: string;
	start: Date;
	end: Date;
}

/** Next three 2-hour slots from the upcoming even hour block (MVP static generator). */
export function getUpcomingPickupSlots(now = new Date()): PickupSlot[] {
	const slots: PickupSlot[] = [];
	const base = new Date(now);
	base.setMinutes(0, 0, 0);
	base.setHours(base.getHours() + (base.getHours() % 2 === 0 ? 2 : 1));

	for (let index = 0; index < 3; index += 1) {
		const start = new Date(base.getTime() + index * 2 * 60 * 60 * 1000);
		const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
		const label = `${formatTime(start)} – ${formatTime(end)}`;
		slots.push({ id: `slot-${index}`, label, start, end });
	}

	return slots;
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}
