import { db, OrderStatus } from '@kachracash/db';

export async function listDispatchAssignments() {
	const rows = await db.pickupRequest.findMany({
		where: {
			status: {
				in: [
					OrderStatus.PENDING,
					OrderStatus.ASSIGNED,
					OrderStatus.EN_ROUTE,
					OrderStatus.ARRIVED,
					OrderStatus.WEIGHING
				]
			}
		},
		include: {
			region: true,
			citizen: true,
			assignments: {
				include: { collector: true },
				orderBy: { matchedAt: 'desc' },
				take: 1
			},
			transaction: true
		},
		orderBy: { scheduledSlotStart: 'asc' },
		take: 50
	});

	return rows.map((row) => {
		const assignment = row.assignments[0];

		return {
			id: row.id,
			status: row.status,
			wardLabel: `Ward ${row.region.wardNumber} · ${row.region.wardName}`,
			collectorName: assignment?.collector.fullName ?? 'Unassigned',
			amount: row.transaction ? `₹${Number(row.transaction.grossAmount).toFixed(0)}` : '—',
			tone:
				row.status === OrderStatus.WEIGHING
					? 'warning'
					: row.status === OrderStatus.PENDING
						? 'info'
						: 'success'
		};
	});
}

export async function listCollectorWallets() {
	const wallets = await db.collectorWallet.findMany({
		include: { collector: true },
		orderBy: { floatBalance: 'desc' },
		take: 50
	});

	return wallets.map((wallet) => {
		const balance = Number(wallet.floatBalance);

		return {
			name: wallet.collector.fullName,
			float: `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
			status: balance < 2000 ? 'Low float' : wallet.collector.isOnline ? 'Online' : 'Offline',
			tone: balance < 2000 ? 'warning' : wallet.collector.isOnline ? 'success' : 'info'
		};
	});
}

export async function listRecentLedgerEntries() {
	const entries = await db.walletLedger.findMany({
		include: {
			wallet: { include: { collector: true } }
		},
		orderBy: { createdAt: 'desc' },
		take: 25
	});

	return entries.map((entry) => ({
		time: entry.createdAt.toISOString().slice(11, 16),
		collector: entry.wallet.collector.fullName,
		type: Number(entry.amount) >= 0 ? 'Credit' : 'Debit',
		amount: `${Number(entry.amount) >= 0 ? '+' : ''}₹${Math.abs(Number(entry.amount)).toFixed(2)}`,
		ref: entry.referenceOrderId ?? entry.idempotencyKey
	}));
}
