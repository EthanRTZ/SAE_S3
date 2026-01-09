import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)

// MODIFICATION: Définir globalement la fonction de création de réservation prestataire
if (typeof window !== 'undefined') {
  window.createPrestataireReservation = (payload) => {
    try {
      const raw = localStorage.getItem('reservationsPrestataires')
      let all = raw ? JSON.parse(raw) : []
      if (!Array.isArray(all)) all = []

      const now = new Date().toISOString()

      const newResa = {
        id: payload.id || `reservation-${Date.now()}`,
        prestataireNom: payload.prestataireNom || 'Terrain de basket',
        date: payload.date || now,
        slot: payload.slot || '', // CORRECTION: Utiliser uniquement "slot"
        nom: payload.nom || payload.name || '',
        email: payload.email || '',
        nbJoueurs: payload.nbJoueurs || payload.players || 0,
        statut: 'en_attente',
        createdAt: now
      }

      console.log('Nouvelle réservation créée:', newResa)

      all.push(newResa)
      localStorage.setItem('reservationsPrestataires', JSON.stringify(all))

      window.dispatchEvent(new Event('reservations-updated'))
    } catch (e) {
      console.error('Erreur createPrestataireReservation', e)
    }
  }
  console.log('window.createPrestataireReservation définie globalement')
}

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
