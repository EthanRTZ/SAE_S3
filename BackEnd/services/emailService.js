const { Resend } = require('resend');

// Initialiser Resend avec la clé API depuis les variables d'environnement
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Envoie un email de confirmation de réservation
 * @param {Object} options - Options de l'email
 * @param {string} options.to - Email du destinataire
 * @param {string} options.userName - Nom de l'utilisateur
 * @param {Object} options.reservation - Détails de la réservation
 * @param {Object} options.billet - Détails du billet
 * @returns {Promise} - Résultat de l'envoi
 */
async function sendReservationConfirmation({ to, userName, reservation, billet }) {
  try {
    if (!resendApiKey || !resend) {
      console.error('RESEND_API_KEY manquante : email non envoyé');
      return { success: false, error: 'RESEND_API_KEY missing' };
    }

    const recipients = Array.isArray(to) ? to : [to].filter(Boolean);
    if (!recipients.length) {
      return { success: false, error: 'Destinataire manquant' };
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .detail-row {
              margin: 10px 0;
              padding: 10px;
              background-color: #f5f5f5;
              border-radius: 3px;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
            }
            .total {
              font-size: 1.2em;
              font-weight: bold;
              color: #4CAF50;
              margin-top: 20px;
              padding: 15px;
              background-color: #e8f5e9;
              border-radius: 5px;
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #777;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Confirmation de Réservation</h1>
              <p>Golden Coast Festival</p>
            </div>
            <div class="content">
              <h2>Bonjour ${userName},</h2>
              <p>Votre réservation a été confirmée avec succès !</p>
              
              <h3>Détails de votre réservation :</h3>
              
              <div class="detail-row">
                <span class="detail-label">Numéro de réservation :</span> #${reservation.id_reservation}
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Billet :</span> ${billet.nom_billet || billet.label_fr || billet.label_en || ''}
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Quantité :</span> ${reservation.quantite}
              </div>
              
              ${reservation.date_utilisation ? `
              <div class="detail-row">
                <span class="detail-label">Date d'utilisation :</span> ${new Date(reservation.date_utilisation).toLocaleDateString('fr-FR')}
              </div>
              ` : ''}
              
              <div class="detail-row">
                <span class="detail-label">Date de réservation :</span> ${new Date(reservation.date_reservation).toLocaleString('fr-FR')}
              </div>
              
              ${reservation.transaction_id ? `
              <div class="detail-row">
                <span class="detail-label">Transaction ID :</span> ${reservation.transaction_id}
              </div>
              ` : ''}
              
              <div class="total">
                Total payé : ${parseFloat(reservation.prix_total).toFixed(2)} €
              </div>
              
              <p style="margin-top: 30px;">
                Nous vous attendons au Golden Coast Festival ! N'oubliez pas d'apporter cette confirmation.
              </p>
              
              <p style="margin-top: 20px; font-style: italic; color: #666;">
                Pour toute question, n'hésitez pas à nous contacter.
              </p>
            </div>
            <div class="footer">
              <p>Golden Coast Festival - ${new Date().getFullYear()}</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Golden Coast <onboarding@resend.dev>',
      to: recipients,
      subject: `Confirmation de réservation #${reservation.id_reservation} - Golden Coast Festival`,
      html: emailHtml
    });

    console.log('Email envoyé avec succès:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendReservationConfirmation
};
