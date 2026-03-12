import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

// Fonction pour traduire le symbole (Ticker) du CSV en nom complet
function getAssetNameFromTicker(ticker: string, accountName: string): string {
  const t = ticker ? ticker.toUpperCase() : '';
  if (t === 'BTC') return 'Bitcoin';
  if (t === 'ETH') return 'Ethereum';
  if (t === 'BNB') return 'Binance Coin';
  if (t === 'SOL') return 'Solana';
  if (t === 'XRP') return 'Ripple';
  if (t === 'ADA') return 'Cardano';
  if (t === 'DOGE') return 'Dogecoin';
  if (t === 'AVAX') return 'Avalanche';
  if (t === 'DOT') return 'Polkadot';
  if (t === 'MATIC') return 'Polygon';
  if (t === 'LTC') return 'Litecoin';
  if (t === 'ATOM') return 'Cosmos';

  return (accountName && accountName.split(' ')[0]) || ticker || 'Inconnu';
}

async function main() {
  console.log("⏳ Début de l'importation multi-actifs...");

  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('❌ Aucun utilisateur trouvé.');
  }

  const results: any[] = [];
  const filePath = 'ledgerwallet-operations-2026.03.11.csv';

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      results.sort(
        (a, b) =>
          new Date(a['Operation Date']).getTime() -
          new Date(b['Operation Date']).getTime(),
      );

      let importedCount = 0;
      const assetCache: Record<string, any> = {};

      for (const row of results) {
        if (row['Status'] !== 'Confirmed') continue;

        const date = new Date(row['Operation Date']);

        // --- CORRECTION 1 : GESTION DES VALEURS VIDES (NaN) ---
        const rawQuantity = row['Operation Amount'];
        const rawAmount = row['Countervalue at Operation Date'];

        // Si Ledger n'a pas mis de valeur, on force à 0 au lieu de faire planter avec NaN
        const quantity = rawQuantity ? parseFloat(rawQuantity) : 0;
        const amount = rawAmount ? parseFloat(rawAmount) : 0;
        const price = quantity > 0 ? amount / quantity : 0;

        const isAchat = row['Operation Type'] === 'IN';
        const ticker = row['Currency Ticker'];
        const accountName = row['Account Name'];

        const assetName = getAssetNameFromTicker(ticker, accountName);

        // 1. Récupérer ou créer l'actif
        if (!assetCache[assetName]) {
          let asset = await prisma.asset.findFirst({
            where: { name: assetName, category: 'crypto', userId: user.id },
          });

          if (!asset) {
            asset = await prisma.asset.create({
              data: {
                name: assetName,
                category: 'crypto',
                quantity: 0,
                totalValue: 0,
                user: { connect: { id: user.id } }, // Utilisation de connect
              },
            });
            console.log(
              `🪙 Nouvel actif détecté et créé en base : ${assetName}`,
            );
          }
          assetCache[assetName] = asset;
        }

        const currentAsset = assetCache[assetName];

        // 2. Vérifier si la transaction existe déjà
        const existingTx = await prisma.transaction.findFirst({
          where: {
            date: date,
            quantity: quantity,
            assetId: currentAsset.id,
          },
        });

        // 3. Création de la transaction
        if (!existingTx) {
          await prisma.transaction.create({
            data: {
              date: date,
              category: 'crypto',
              type: isAchat ? 'achat' : 'vente',
              amount: amount,
              quantity: quantity,
              price: price,
              // --- CORRECTION 2 : SYNTAXE PRISMA CONNECT ---
              asset: { connect: { id: currentAsset.id } },
              user: { connect: { id: user.id } },
            },
          });
          importedCount++;

          // 4. Mise à jour des soldes dans la mémoire
          if (isAchat) {
            currentAsset.quantity += quantity;
            currentAsset.totalValue += amount;
          } else {
            currentAsset.quantity -= quantity;
            currentAsset.totalValue -= amount;
          }
        }
      }

      // 5. Sauvegarde finale
      for (const assetName in assetCache) {
        const asset = assetCache[assetName];
        await prisma.asset.update({
          where: { id: asset.id },
          data: {
            quantity: asset.quantity,
            totalValue: asset.totalValue,
          },
        });
        console.log(
          `📊 Solde à jour pour ${assetName} : ${asset.quantity.toFixed(6)} unités`,
        );
      }

      console.log(
        `\n✅ Import terminé avec succès ! ${importedCount} nouvelles transactions ajoutées.`,
      );
      await prisma.$disconnect();
    });
}

main().catch((e) => {
  console.error("❌ Erreur lors de l'importation:", e);
  prisma.$disconnect();
  process.exit(1);
});
