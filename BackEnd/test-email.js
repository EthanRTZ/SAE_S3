/**
 * Script de test pour vérifier l'envoi d'emails avec Resend
 *
 * Pour exécuter ce test :
 * 1. Assurez-vous que votre fichier .env contient RESEND_API_KEY
 * 2. Exécutez : node test-email.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { sendReservationConfirmation } = require('./services/emailService');

// Données de test
const testData = {
  to: 'rietz.ethan@gmail.com', // Changez cette adresse pour vos tests
  userName: 'Jean Dupont',
  reservation: {
    id_reservation: 123,
    quantite: 2,
    date_utilisation: '2024-07-15',
    date_reservation: new Date(),
    prix_total: 89.90,
    transaction_id: 'TEST_TRANS_456',
    statut: 'réservé'
  },
  billet: {
    nom_billet: 'Pass 3 Jours',
    description: 'Accès complet au festival pendant 3 jours'
  }
};

async function testEmail() {
  console.log('🔧 Test d\'envoi d\'email de confirmation de réservation...\n');

  // Vérification de la configuration
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ ERREUR: La variable RESEND_API_KEY n\'est pas définie dans le fichier .env');
    console.log('\nVeuillez ajouter votre clé API Resend dans le fichier .env :');
    console.log('RESEND_API_KEY=re_VotreClefAPI');
    process.exit(1);
  }

  console.log('✓ Clé API Resend configurée');
  console.log(`✓ Email de test : ${testData.to}`);
  console.log(`✓ From : ${process.env.RESEND_FROM_EMAIL || 'Golden Coast <onboarding@resend.dev>'}\n`);

  console.log('📧 Envoi de l\'email...\n');

  try {
    const result = await sendReservationConfirmation(testData);

    if (result.success) {
      console.log('✅ Email envoyé avec succès !');
      console.log('ID de l\'email :', result.id);
      console.log('\n📬 Vérifiez la boîte email de', testData.to);
    } else {
      console.log('❌ Échec de l\'envoi de l\'email');
      console.log('Erreur :', result.error);
    }
  } catch (error) {
    console.error('❌ Erreur lors du test :', error.message);
    process.exit(1);
  }
}

// Exécution du test
testEmail();
