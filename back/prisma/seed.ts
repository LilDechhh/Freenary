import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding...');

  // 1. Nettoyage de la base (pour éviter les doublons si tu relances le script)
  await prisma.transaction.deleteMany();
  await prisma.historicalData.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();

  // 2. Création de ton utilisateur principal
  const user = await prisma.user.create({
    data: {
      email: 'hugo@dechaux.com',
      password: 'password123', // À hasher en prod !
      name: 'Hugo Dechaux',
    },
  });

  console.log(`Utilisateur créé : ${user.name}`);

  // 3. Tes données Mock (Version simplifiée pour le script)
  const assetsToCreate = [
    {
      name: 'Bitcoin (BTC)',
      category: 'crypto',
      quantity: 0.5,
      totalValue: 42500,
    }, // currentPrice supprimé
    {
      name: 'Ethereum (ETH)',
      category: 'crypto',
      quantity: 5,
      totalValue: 16000,
    },
    { name: 'MSCI World', category: 'pea', quantity: 50, totalValue: 24250 },
    { name: 'Livret A', category: 'epargne', totalValue: 22950 },
  ];

  for (const assetData of assetsToCreate) {
    const asset = await prisma.asset.create({
      data: {
        ...assetData,
        userId: user.id,
      },
    });

    // Ajout de données historiques fictives pour chaque actif
    await prisma.historicalData.createMany({
      data: [
        { assetId: asset.id, date: 'Jan', value: assetData.totalValue * 0.9 },
        { assetId: asset.id, date: 'Fév', value: assetData.totalValue * 0.95 },
        { assetId: asset.id, date: 'Mar', value: assetData.totalValue },
      ],
    });
  }

  // 4. Ajout d'une transaction de test
  await prisma.transaction.create({
    data: {
      date: new Date(),
      category: 'crypto',
      type: 'achat', // Cohérence avec le frontend
      amount: 16400,
      assetId: (await prisma.asset.findFirst({
        where: { name: 'Bitcoin (BTC)' },
      }))!.id,
      userId: user.id,
    },
  });

  console.log('Seeding terminé avec succès ! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
