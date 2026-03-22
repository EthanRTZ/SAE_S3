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

    const formatDate = (value) => {
      try {
        return new Date(value).toLocaleDateString('fr-FR');
      } catch (_) {
        return value;
      }
    };

    // Déterminer les jours sélectionnés à afficher dans l'email
    const selectedDays = [];
    if (reservation?.date_utilisation) {
      selectedDays.push(formatDate(reservation.date_utilisation));
    }
    if (reservation?.optionLabel) {
      selectedDays.push(reservation.optionLabel);
    }
    if (Array.isArray(reservation?.jours_selectionnes)) {
      selectedDays.push(...reservation.jours_selectionnes.map(formatDate));
    }
    if (Array.isArray(reservation?.selectedDays)) {
      selectedDays.push(...reservation.selectedDays.map(formatDate));
    }

    const selectedDaysHtml = selectedDays.length
      ? `<div class="detail-row"><span class="detail-label">Jour(s) sélectionné(s) :</span> ${[...new Set(selectedDays)].join(', ')}</div>`
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
              line-height: 1.6;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              background-color: #0b1028;
              margin: 0;
              padding: 0;
            }
            .container {
               max-width: 640px;
               margin: 0 auto;
               padding: 20px;
               background-color: #0b1028;
            }
            .card {
              background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
              border: 1px solid rgba(255, 215, 80, 0.08);
              border-radius: 16px;
              box-shadow: 0 18px 50px rgba(2,6,23,0.65), inset 0 1px 0 rgba(255,255,255,0.02);
              backdrop-filter: blur(8px);
            }
            .header {
               background: linear-gradient(120deg, #6f47c1 0%, #1629bf 50%, #11338a 100%);
              color: #FCDC1E;
              padding: 24px;
               text-align: center;
              border-radius: 16px 16px 0 0;
              text-shadow: 0 2px 8px rgba(0,0,0,0.45);
            }
            .header h1 {
              margin: 0;
              font-size: 1.8rem;
              font-weight: 800;
            }
            .header p {
              margin: 4px 0 0;
              font-size: 1rem;
              color: rgba(255,255,255,0.8);
             }
             .content {
              padding: 24px 30px;
               color: #e8ecff;
            }
            .content h2 {
              color: #f8fafc;
              font-weight: 700;
             }
             .detail-row {
               margin: 12px 0;
               padding: 12px;
              background: rgba(1,4,16,0.4);
              border: 1px solid rgba(255, 215, 80, 0.3);
               border-radius: 10px;
              font-size: 0.95rem;
             }
             .detail-label {
               font-weight: 700;
               color: #fcdc1e;
              margin-right: 8px;
             }
             .total {
               font-size: 1.15em;
               font-weight: 800;
               color: #0b1028;
               margin-top: 24px;
               padding: 16px;
              background: linear-gradient(90deg,#ffd166, #dcb00b);
              border-radius: 10px;
               text-align: center;
              box-shadow: 0 10px 30px rgba(255,120,80,0.18);
             }
             .footer {
               text-align: center;
               padding: 20px;
               color: rgba(232,236,255,0.6);
               font-size: 0.9em;
             }
             a {
               color: #fcdc1e;
              text-decoration: none;
             }
           </style>
         </head>
         <body>
           <div class="container">
             <div class="card">
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

                ${selectedDaysHtml}
                
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
              </div>
             </div>
             <div class="footer">
               <p>Golden Coast Festival - ${new Date().getFullYear()}</p>
               <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
             </div>
           </div>
         </body>
      </html>
    `;

    // Envoi de l'email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Golden Coast <onboarding@resend.dev>',
       to: recipients,
       subject: 'Confirmation de votre réservation - Golden Coast Festival',
       html: emailHtml,
     });

    if (error) {
      console.error('Erreur Resend :', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation :', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendReservationConfirmation };
