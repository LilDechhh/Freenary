import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('⏳ Début de l\'importation Trade Republic...');

    // 1. Récupérer un utilisateur par défaut pour l'import (Hugo)
    // On cherche le premier utilisateur de la base pour lui attribuer les transactions
    const user = await prisma.user.findFirst();
    if (!user) {
        throw new Error('❌ Aucun utilisateur trouvé en base de données. Crée d\'abord ton compte ou lance le seed.');
    }
    console.log(`👤 Les transactions seront attribuées à : ${user.email}`);

    // 2. Localiser et lire le fichier CSV
    const filePath = path.join(__dirname, 'trade_republic_transactions.csv');
    const csvData = fs.readFileSync(filePath, 'utf-8');

    // Découper le fichier ligne par ligne (en ignorant l'en-tête)
    const lines = csvData.split('\n').slice(1);
    let successCount = 0;

    for (const line of lines) {
        if (!line.trim()) continue;

        // Extraire les colonnes (timestamp;title;subtitle;amount.value)
        const [timestamp, title, subtitle, amountValue] = line.split(';');

        // Si la colonne du montant est vide, on passe
        if (!amountValue) continue;
        const amount = parseFloat(amountValue.replace(',', '.'));

        // 3. Filtrer uniquement les achats/ventes d'actions ou d'ETF
        if (subtitle === 'Achat' || subtitle === 'Exécution d\'un plan d\'investissement' || subtitle === 'Vente') {
            const isVente = subtitle === 'Vente';
            const typeTransaction = isVente ? 'vente' : 'achat';

            // 4. Gérer l'Actif (Asset) : on le cherche ou on le crée s'il n'existe pas
            let asset = await prisma.asset.findFirst({
                where: {
                    name: title,
                    userId: user.id
                },
            });

            if (!asset) {
                // Si l'actif n'existe pas encore dans ton portefeuille, on le crée avec des valeurs par défaut à 0
                asset = await prisma.asset.create({
                    data: {
                        name: title,        // ex: "Apple"
                        category: 'pea',
                        userId: user.id,
                        totalValue: 0,      // 🌟 NOUVEAU : Valeur par défaut obligatoire réclamée par Prisma

                        // 💡 Note : Si TypeScript te réclame d'autres erreurs après avoir enregistré, 
                        // ajoute-les simplement ici à 0 (ex: quantity: 0, ou totalAmount: 0)
                    },
                });
            }

            // 5. Créer la transaction liée à l'actif et à l'utilisateur
            await prisma.transaction.create({
                data: {
                    date: new Date(timestamp.split('/').reverse().join('-')),
                    category: 'pea',
                    type: typeTransaction,
                    amount: Math.abs(amount), // Toujours positif en BDD, le type fait la différence
                    label: subtitle,          // "Achat" ou "Plan d'investissement"
                    assetId: asset.id,        // Liaison avec l'actif
                    userId: user.id,          // Liaison avec l'utilisateur
                },
            });

            successCount++;
        }
    }

    console.log(`\n🎉 Importation réussie ! ${successCount} transactions liées au PEA ont été ajoutées.`);
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors de l\'importation :', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });