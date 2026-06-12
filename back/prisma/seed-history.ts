import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du script de génération d\'historique...');

  // 1. Récupérer le premier utilisateur (ou tous)
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé dans la base de données. Exécutez d\'abord le seed initial ou inscrivez-vous.');
    return;
  }

  for (const user of users) {
    console.log(`👤 Génération pour l'utilisateur ${user.email} (${user.id})`);

    // 1.5 Ajouter des transactions de démonstration s'ils n'ont rien (ou peu)
    const existingTransactions = await prisma.transaction.count({ where: { userId: user.id } });
    if (existingTransactions < 3) {
      console.log(`📊 Ajout de données de démonstration pour ${user.email}...`);

      const dateNow = new Date();
      
      // Compte courant
      const ccAsset = await prisma.asset.create({
        data: { name: 'BNP Paribas', category: 'compte-courant', totalValue: 2500, quantity: 0, userId: user.id }
      });
      await prisma.transaction.create({
        data: { type: 'dépôt', category: 'compte-courant', amount: 2500, quantity: 0, date: new Date(dateNow.getTime() - 86400000 * 60), label: 'Salaire', assetId: ccAsset.id, userId: user.id }
      });

      // Livret A
      const epAsset = await prisma.asset.create({
        data: { name: 'Livret A', category: 'epargne', totalValue: 5000, quantity: 0, userId: user.id }
      });
      await prisma.transaction.create({
        data: { type: 'dépôt', category: 'epargne', amount: 5000, quantity: 0, date: new Date(dateNow.getTime() - 86400000 * 45), label: 'Virement', assetId: epAsset.id, userId: user.id }
      });

      // Crypto (BTC)
      const btcAsset = await prisma.asset.create({
        data: { name: 'BTC', category: 'crypto', totalValue: 1000, quantity: 0.015, userId: user.id }
      });
      await prisma.transaction.create({
        data: { type: 'achat', category: 'crypto', amount: 1000, quantity: 0.015, date: new Date(dateNow.getTime() - 86400000 * 30), label: 'DCA Crypto', assetId: btcAsset.id, userId: user.id }
      });

      // PEA (LVMH)
      const peaAsset = await prisma.asset.create({
        data: { name: 'MC.PA', category: 'pea', totalValue: 800, quantity: 1, userId: user.id }
      });
      await prisma.transaction.create({
        data: { type: 'achat', category: 'pea', amount: 800, quantity: 1, date: new Date(dateNow.getTime() - 86400000 * 15), label: 'Achat', assetId: peaAsset.id, userId: user.id }
      });
    }

    // 2. Calculer une valeur de base "actuelle" approximative pour créer un historique cohérent
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
    });
    
    const currentWealth = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
    const baseValue = currentWealth > 0 ? currentWealth : 10000;

    const categoriesMap = new Map<string, number>();
    for (const asset of assets) {
      const cat = asset.category.toLowerCase();
      categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + asset.totalValue);
    }
    
    const previousValues = new Map<string, number>();
    for (const [cat, val] of categoriesMap.entries()) {
      previousValues.set(cat, val * 0.8); // 20% plus bas il y a 3 mois
    }

    // 3. Générer 90 jours d'historique (environ 3 mois)
    const today = new Date();
    
    // On nettoie l'ancien historique pour cet utilisateur
    await prisma.historicalData.deleteMany({
      where: { userId: user.id }
    });

    let previousGlobalValue = baseValue * 0.8;

    for (let i = 90; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Simuler une variation quotidienne (entre -1% et +1.2%) globale
      const variation = (Math.random() * 2.2 - 1) / 100; 
      previousGlobalValue = previousGlobalValue * (1 + variation);
      
      if (i === 0) {
        previousGlobalValue = currentWealth > 0 ? currentWealth : previousGlobalValue;
      }

      await prisma.historicalData.create({
        data: {
          date: dateStr,
          value: parseFloat(previousGlobalValue.toFixed(2)),
          userId: user.id,
          category: null
        }
      });

      for (const [cat, val] of previousValues.entries()) {
         const catVariation = (Math.random() * 3 - 1.2) / 100; // Catégorie un peu plus volatile
         let nextVal = val * (1 + catVariation);
         if (i === 0) nextVal = categoriesMap.get(cat) || nextVal;
         previousValues.set(cat, nextVal);
         await prisma.historicalData.create({
           data: { 
             date: dateStr, 
             value: parseFloat(nextVal.toFixed(2)), 
             userId: user.id, 
             category: cat 
           }
         });
      }
    }
    console.log(`✅ 90 jours d'historique (Global + ${categoriesMap.size} Catégories) générés pour ${user.email}`);
  }

  console.log('🎉 Seed d\'historique terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
