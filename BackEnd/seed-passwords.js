/**
 * Script de seed : met à jour les mots de passe en BDD avec de vrais hash bcrypt.
 * Utilise les mots de passe d'origine du fichier users.json.
 *
 * Usage : node seed-passwords.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, Utilisateur } = require('./models');

// Mots de passe d'origine par email
const USERS_PASSWORDS = [
  { email: 'user@abc.fr', password: 'user12' },
  { email: 'admin@abc.fr', password: 'admin12' },
  { email: 'otacos@prestataire.fr', password: 'otacos12' },
  { email: 'free@prestataire.fr', password: 'free12' },
  { email: 'decathlon@prestataire.fr', password: 'decathlon12' },
  { email: 'redbull@prestataire.fr', password: 'redbull12' },
  { email: 'deezer@prestataire.fr', password: 'deezer12' },
  { email: 'poliakov@prestataire.fr', password: 'poliakov12' },
  { email: 'jackdaniels@prestataire.fr', password: 'jackdaniels12' },
  { email: 'heetch@prestataire.fr', password: 'heetch12' },
  { email: 'veolia@prestataire.fr', password: 'veolia12' },
  { email: 'securitas@prestataire.fr', password: 'securitas12' },
  { email: 'happn@prestataire.fr', password: 'happn12' },
  { email: 'allianz@prestataire.fr', password: 'allianz12' },
  { email: 'jeager@prestataire.fr', password: 'jeager12' },
  { email: 'ricard@prestataire.fr', password: 'ricard12' },
  { email: 'jbl@prestataire.fr', password: 'jbl12' },
  { email: 'pepsi@prestataire.fr', password: 'pepsi12' },
  { email: 'lipton@prestataire.fr', password: 'lipton12' },
  { email: 'bagels@prestataire.fr', password: 'bagels12' },
  { email: 'pizza@prestataire.fr', password: 'pizza12' },
  { email: 'ailetfinesherbes@prestataire.fr', password: 'ailetfinesherbes12' },
  { email: 'nouilles@prestataire.fr', password: 'nouilles12' },
  { email: 'coiffure@prestataire.fr', password: 'coiffure12' },
  { email: 'merch@prestataire.fr', password: 'merch12' },
  { email: 'bornedarcade@prestataire.fr', password: 'bornedarcade12' },
  { email: 'basket@prestataire.fr', password: 'basket12' },
];

async function seedPasswords() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion BDD OK\n');

    let updated = 0;
    let skipped = 0;

    for (const { email, password } of USERS_PASSWORDS) {
      const user = await Utilisateur.findOne({ where: { email } });
      if (!user) {
        console.log(`  ⚠️  ${email} — utilisateur non trouvé en BDD, ignoré`);
        skipped++;
        continue;
      }

      const hash = await bcrypt.hash(password, 10);
      await user.update({ mot_de_passe: hash });
      console.log(`  ✅ ${email}  →  mot de passe: ${password}`);
      updated++;
    }

    console.log(`\n🎉 Seed terminé ! ${updated} utilisateur(s) mis à jour, ${skipped} ignoré(s).`);
    console.log('Vous pouvez maintenant vous connecter avec les mots de passe d\'origine.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

seedPasswords();
