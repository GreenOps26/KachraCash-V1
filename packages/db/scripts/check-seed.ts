import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
	const wards = await db.region.count();
	const categories = await db.scrapCategory.count();
	const rates = await db.floorRateCard.count();
	console.log({ wards, categories, rates });
}

main()
	.finally(() => db.$disconnect())
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
