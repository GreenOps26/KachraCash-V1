import { db } from './index.js';

async function main() {
  console.log('🌱 Starting KachraCash Guwahati Data Seeding...');

  // 1. Seed Guwahati Municipal Wards
  const wards = [
    { wardNumber: 28, wardName: 'Beltola' },
    { wardNumber: 24, wardName: 'Jayanagar' },
    { wardNumber: 29, wardName: 'Ganeshguri' },
    { wardNumber: 15, wardName: 'Noonmati' },
    { wardNumber: 30, wardName: 'Wireless / Hatigaon' },
  ];

  for (const ward of wards) {
    await db.$executeRawUnsafe(`
      INSERT INTO "regions" ("id", "wardNumber", "wardName", "geofencePolygon", "isFloodSuspended", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${ward.wardNumber},
        '${ward.wardName}',
        ST_GeomFromText('POLYGON((91.70 26.10, 91.85 26.10, 91.85 26.20, 91.70 26.20, 91.70 26.10))', 4326),
        false,
        NOW()
      )
      ON CONFLICT ("wardNumber") DO NOTHING;
    `);
  }
  console.log('✅ Wards seeded: Beltola, Jayanagar, Ganeshguri, Noonmati, Wireless');

  // 2. Seed 8 Scrap Categories mapped to 3 Visual Tiers & SWM Streams
  const categories = [
    {
      sku: 'PET_RIGID',
      name: 'PET Plastic Bottles & Jars',
      visualTier: 'RIGID_CONTAINERS',
      swmStream: 'DRY_RECYCLABLE',
      description: 'Clear & translucent beverage bottles, water jugs, household jars',
      nationalIndex: 40.0,
      freightOffset: 1.2, // Byrnihat short haul
      handlingOffset: 1.8,
      floorRate: 30.59,
    },
    {
      sku: 'HDPE_RIGID',
      name: 'HDPE Containers & Drums',
      visualTier: 'RIGID_CONTAINERS',
      swmStream: 'DRY_RECYCLABLE',
      description: 'Detergent bottles, shampoo bottles, rigid canisters',
      nationalIndex: 38.0,
      freightOffset: 1.2,
      handlingOffset: 1.8,
      floorRate: 28.84,
    },
    {
      sku: 'ALUMINUM_CANS',
      name: 'Aluminum Beverage Cans',
      visualTier: 'RIGID_CONTAINERS',
      swmStream: 'DRY_RECYCLABLE',
      description: 'Soda cans, food tins, aerosol containers',
      nationalIndex: 110.0,
      freightOffset: 3.5, // Siliguri long haul
      handlingOffset: 4.0,
      floorRate: 88.0,
    },
    {
      sku: 'CARDBOARD_OCC',
      name: 'Old Corrugated Cardboard (OCC)',
      visualTier: 'SOFT_FILMS',
      swmStream: 'DRY_RECYCLABLE',
      description: 'Brown packaging cartons, ecommerce boxes',
      nationalIndex: 14.0,
      freightOffset: 1.0,
      handlingOffset: 1.0,
      floorRate: 10.48,
    },
    {
      sku: 'ONP_NEWSPAPER',
      name: 'Old Newspaper (ONP) & Notebooks',
      visualTier: 'SOFT_FILMS',
      swmStream: 'DRY_RECYCLABLE',
      description: 'Daily print publications, office paper, notebooks',
      nationalIndex: 16.0,
      freightOffset: 1.0,
      handlingOffset: 1.0,
      floorRate: 12.22,
    },
    {
      sku: 'LDPE_FILM',
      name: 'LDPE Plastic Packaging Film',
      visualTier: 'SOFT_FILMS',
      swmStream: 'DRY_RECYCLABLE',
      description: 'Bubble wrap, transparent polybags, shrink wrap',
      nationalIndex: 25.0,
      freightOffset: 3.5,
      handlingOffset: 2.0,
      floorRate: 17.0,
    },
    {
      sku: 'FERROUS_IRON',
      name: 'Iron & Mild Steel Scrap',
      visualTier: 'MIXED_BULKY',
      swmStream: 'DRY_RECYCLABLE',
      description: 'Rods, pipes, bicycle frames, angle bars, tin sheets',
      nationalIndex: 32.0,
      freightOffset: 1.2,
      handlingOffset: 2.0,
      floorRate: 25.0,
    },
    {
      sku: 'COPPER_BRASS',
      name: 'Copper Wire & Brass Utensils',
      visualTier: 'MIXED_BULKY',
      swmStream: 'SPECIAL_CARE',
      description: 'Stripped electrical wire, brass idols, taps, plumbing fittings',
      nationalIndex: 450.0,
      freightOffset: 5.0,
      handlingOffset: 10.0,
      floorRate: 380.0,
    },
  ];

  for (const cat of categories) {
    const createdCat = await db.scrapCategory.upsert({
      where: { sku: cat.sku },
      update: {
        name: cat.name,
        visualTier: cat.visualTier,
        swmStream: cat.swmStream,
        description: cat.description,
      },
      create: {
        sku: cat.sku,
        name: cat.name,
        visualTier: cat.visualTier,
        swmStream: cat.swmStream,
        description: cat.description,
      },
    });

    await db.floorRateCard.create({
      data: {
        categoryId: createdCat.id,
        nationalIndexRate: cat.nationalIndex,
        freightOffset: cat.freightOffset,
        handlingOffset: cat.handlingOffset,
        floorRate: cat.floorRate,
        version: 1,
      },
    });
  }

  console.log('✅ 8 Scrap categories and floor rate cards successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
