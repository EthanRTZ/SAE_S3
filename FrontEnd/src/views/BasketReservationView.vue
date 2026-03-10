<template>
  <div class="basket-reservation-page">
    <div class="basket-reservation-container">
      <div class="basket-reservation-card">
        <div class="header-section">
          <router-link to="/prestataire/Terrain%20de%20basket" class="btn-back">
            {{ $t('basketReservation.backToProvider') }}
          </router-link>
          <h1>{{ $t('basketReservation.title') }}</h1>
          <div class="divider"></div>
          <p class="intro-text">
            {{ $t('basketReservation.intro') }}
            <br><strong>{{ festivalDatesText }}</strong> - {{ festivalLocation }}
          </p>
        </div>

        <!-- Sélection de la date -->
        <div class="section">
          <h2 class="section-title">
            <span class="step-number">1</span>
            {{ $t('basketReservation.step1') }}
          </h2>
          <div class="festival-dates-grid">
            <button
              v-for="date in festivalDates"
              :key="date.dateStr"
              type="button"
              class="festival-date-btn"
              :class="{ selected: selectedDate === date.dateStr }"
              @click="selectDate(date.dateStr)"
            >
              <span class="festival-date-day">{{ date.dayName }}</span>
              <span class="festival-date-number">{{ date.dayNumber }}</span>
              <span class="festival-date-month">{{ date.monthName }}</span>
              <span class="festival-date-label">{{ date.label }}</span>
            </button>
          </div>
        </div>

        <!-- Sélection du créneau horaire -->
        <div v-if="selectedDate" class="section">
          <h2 class="section-title">
            <span class="step-number">2</span>
            {{ $t('basketReservation.step2') }}
          </h2>
          <p class="section-subtitle">{{ $t('basketReservation.duration') }}</p>

          <div class="time-periods">
            <div class="time-period">
              <h3 class="period-title">{{ $t('basketReservation.morning') }}</h3>
              <div class="slots-row">
                <button
                  v-for="slot in morningSlots"
                  :key="slot.time"
                  type="button"
                  class="slot-btn"
                  :class="{
                    selected: selectedSlot === slot.time,
                    unavailable: !slot.available
                  }"
                  :disabled="!slot.available"
                  @click="selectSlot(slot.time)"
                >
                  <span class="slot-time">{{ slot.time }}</span>
                  <span class="slot-status">{{ slot.available ? '✓' : '✗' }}</span>
                </button>
              </div>
            </div>

            <div class="time-period">
              <h3 class="period-title">{{ $t('basketReservation.afternoon') }}</h3>
              <div class="slots-row">
                <button
                  v-for="slot in afternoonSlots"
                  :key="slot.time"
                  type="button"
                  class="slot-btn"
                  :class="{
                    selected: selectedSlot === slot.time,
                    unavailable: !slot.available
                  }"
                  :disabled="!slot.available"
                  @click="selectSlot(slot.time)"
                >
                  <span class="slot-time">{{ slot.time }}</span>
                  <span class="slot-status">{{ slot.available ? '✓' : '✗' }}</span>
                </button>
              </div>
            </div>

            <div class="time-period">
              <h3 class="period-title">{{ $t('basketReservation.evening') }}</h3>
              <div class="slots-row">
                <button
                  v-for="slot in eveningSlots"
                  :key="slot.time"
                  type="button"
                  class="slot-btn"
                  :class="{
                    selected: selectedSlot === slot.time,
                    unavailable: !slot.available
                  }"
                  :disabled="!slot.available"
                  @click="selectSlot(slot.time)"
                >
                  <span class="slot-time">{{ slot.time }}</span>
                  <span class="slot-status">{{ slot.available ? '✓' : '✗' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Nombre de joueurs -->
        <div v-if="selectedSlot" class="section">
          <h2 class="section-title">
            <span class="step-number">3</span>
            {{ $t('basketReservation.step3') }}
          </h2>
          <div class="players-selector">
            <button
              type="button"
              class="qty-btn"
              @click="decrementPlayers"
              :disabled="nbPlayers <= 2"
            >−</button>
            <div class="players-display">
              <span class="players-count">{{ nbPlayers }}</span>
              <span class="players-label">{{ $t('basketReservation.players') }}</span>
            </div>
            <button
              type="button"
              class="qty-btn"
              @click="incrementPlayers"
              :disabled="nbPlayers >= 10"
            >+</button>
          </div>
          <p class="players-info">{{ $t('basketReservation.playersInfo') }}</p>
        </div>

        <!-- AJOUT: Infos équipe / contact -->
        <div v-if="selectedSlot" class="section">
          <h2 class="section-title">
            <span class="step-number">4</span>
            Nom / Équipe & contact
          </h2>
          <div class="team-contact-form">
            <div class="form-row">
              <label for="team-name">Nom / Équipe</label>
              <input
                id="team-name"
                type="text"
                class="input"
                v-model="teamName"
                placeholder="Équipe des amis, Nom du groupe..."
              />
            </div>
            <div class="form-row">
              <label for="contact-email">Email de contact</label>
              <input
                id="contact-email"
                type="email"
                class="input"
                v-model="contactEmail"
                placeholder="votre.email@example.com"
              />
            </div>
          </div>
        </div>

        <!-- Récapitulatif -->
        <div v-if="selectedSlot" class="section recap-section">
          <h2 class="section-title">
            <span class="step-number">✓</span>
            {{ $t('basketReservation.step4') }}
          </h2>
          <div class="recap-card">
            <div class="recap-item">
              <span class="recap-icon">📅</span>
              <div class="recap-content">
                <span class="recap-label">{{ $t('basketReservation.recapDate') }}</span>
                <span class="recap-value">{{ formatSelectedDate }}</span>
              </div>
            </div>
            <div class="recap-item">
              <span class="recap-icon">⏰</span>
              <div class="recap-content">
                <span class="recap-label">{{ $t('basketReservation.recapSlot') }}</span>
                <span class="recap-value">{{ selectedSlot }} - {{ getEndTime(selectedSlot) }}</span>
              </div>
            </div>
            <div class="recap-item">
              <span class="recap-icon">👥</span>
              <div class="recap-content">
                <span class="recap-label">{{ $t('basketReservation.recapTeam') }}</span>
                <span class="recap-value">{{ nbPlayers }} {{ $t('basketReservation.players') }}</span>
              </div>
            </div>
            <div class="recap-item recap-location">
              <span class="recap-icon">📍</span>
              <div class="recap-content">
                <span class="recap-label">{{ $t('basketReservation.recapLocation') }}</span>
                <span class="recap-value">{{ basketLocationValue }}</span>
              </div>
            </div>
            <div class="recap-item">
              <span class="recap-icon">🏷️</span>
              <div class="recap-content">
                <span class="recap-label">Nom / Équipe</span>
                <span class="recap-value">{{ teamName || '—' }}</span>
              </div>
            </div>
            <div class="recap-item">
              <span class="recap-icon">📧</span>
              <div class="recap-content">
                <span class="recap-label">Email de contact</span>
                <span class="recap-value">{{ contactEmail || '—' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button
            v-if="selectedSlot"
            type="button"
            class="btn-primary"
            :disabled="!canAddToCart"
            @click="addToCart"
          >
            <span class="btn-icon">🏀</span>
            <!-- MODIF: utiliser le texte calculé au lieu de $t(...) || '...' -->
            {{ confirmReservationText }}
          </button>

          <router-link to="/prestataire" class="btn-secondary">
            {{ $t('basketReservation.viewAllProviders') }}
          </router-link>
        </div>

        <!-- Message de confirmation -->
        <transition name="fade">
          <div v-if="showConfirmation" class="confirmation-message">
            <span class="confirmation-icon">✅</span>
            <span>{{ reservationConfirmedText }}</span>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// État
const selectedDate = ref('')
const selectedSlot = ref('')
const nbPlayers = ref(4)
const showConfirmation = ref(false)

// AJOUT: Nom / Équipe et email de contact
const teamName = ref('')
const contactEmail = ref('')

// Clé localStorage pour les réservations de basket
const BASKET_RESERVATIONS_KEY = 'basketReservations'

// Informations du festival (depuis festival.json)
const festivalDatesText = ref('')
const festivalLocation = ref('')
const basketLocationValue = ref('')
// CORRECTION: Initialiser comme tableau vide
const festivalDates = ref([])

// Charger les informations du festival depuis l'API ou festival.json
const loadFestivalInfo = async () => {
  try {
    const currentLang = locale.value || 'fr'
    let data = null

    // Essayer l'API
    try {
      const token = localStorage.getItem('authToken')
      const resp = await fetch('/api/manifestations', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (resp.ok) {
        const list = await resp.json()
        const festival = Array.isArray(list) ? (list.find(f => f.actif) || list[0]) : null
        if (festival) {
          festivalDatesText.value = `Du ${festival.date_debut} au ${festival.date_fin}`
          festivalLocation.value = festival.lieu_nom || ''
          // Dates fixes depuis la BDD
          const debut = new Date(festival.date_debut)
          const fin = new Date(festival.date_fin)
          const dates = []
          const dayNames = { fr: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'], en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] }
          const monthNames = { fr: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'], en: ['January','February','March','April','May','June','July','August','September','October','November','December'] }
          for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
            dates.push({
              dateStr: d.toISOString().split('T')[0],
              dayName: dayNames[currentLang][d.getDay()],
              dayNumber: d.getDate(),
              monthName: monthNames[currentLang][d.getMonth()],
              label: t(`basketReservation.day${dates.length + 1}`)
            })
          }
          if (dates.length) { festivalDates.value = dates; return; }
        }
      }
    } catch (e) {
      console.error('Erreur chargement festival API:', e)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des informations du festival:', error)
    // Valeurs par défaut en cas d'erreur
    festivalDates.value = [
      {
        dateStr: '2026-08-28',
        dayName: 'Vendredi',
        dayNumber: 28,
        monthName: 'Août',
        label: t('basketReservation.day1')
      },
      {
        dateStr: '2026-08-29',
        dayName: 'Samedi',
        dayNumber: 29,
        monthName: 'Août',
        label: t('basketReservation.day2')
      },
      {
        dateStr: '2026-08-30',
        dayName: 'Dimanche',
        dayNumber: 30,
        monthName: 'Août',
        label: t('basketReservation.day3')
      }
    ]
  }
}

// Charger au montage
loadFestivalInfo()

// Recharger quand la langue change
watch(locale, () => {
  loadFestivalInfo()
})

// Créneaux horaires par période
const morningHours = ['09:00', '10:00', '11:00', '12:00']
const afternoonHours = ['13:00', '14:00', '15:00', '16:00', '17:00']
const eveningHours = ['18:00', '19:00', '20:00', '21:00']

// Charger les réservations existantes
const getExistingReservations = () => {
  try {
    const raw = localStorage.getItem(BASKET_RESERVATIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// AJOUT: Charger les réservations validées des prestataires
const getPrestataireReservations = () => {
  try {
    const raw = localStorage.getItem('reservationsPrestataires')
    const all = raw ? JSON.parse(raw) : []
    // Ne garder que celles qui ne sont PAS annulées
    return Array.isArray(all) ? all.filter(r => r.statut !== 'annulee' && r.statut !== 'annulée') : []
  } catch {
    return []
  }
}

// AJOUT: State pour forcer le recalcul des créneaux
const refreshTrigger = ref(0)

// MODIFICATION: Vérifier si un créneau est disponible (comparaison directe avec "slot")
const isSlotAvailable = (date, time) => {
  refreshTrigger.value // déclenche le recalcul quand cette valeur change

  console.log('===================')
  console.log('🔍 Vérification disponibilité')
  console.log('Date demandée:', date)
  console.log('Time demandé:', time)

  // 1) Vérifier dans basketReservations (réservations locales)
  const basketResas = getExistingReservations()
  console.log('📦 Réservations basket:', basketResas)

  const isInBasket = basketResas.some(r => {
    // Comparaison directe des chaînes
    const dateMatch = String(r.date).trim() === String(date).trim()
    const slotMatch = String(r.slot).trim() === String(time).trim()
    console.log(`  - Basket: date="${r.date}" === "${date}" ? ${dateMatch}, slot="${r.slot}" === "${time}" ? ${slotMatch}`)
    return dateMatch && slotMatch
  })

  if (isInBasket) {
    console.log('❌ BLOQUÉ par basketReservations')
    console.log('===================')
    return false
  }

  // 2) Vérifier dans reservationsPrestataires (réservations validées/en attente)
  const prestataireResas = getPrestataireReservations()
  console.log('🏪 Réservations prestataires:', prestataireResas)

  const isReservedByPrestataire = prestataireResas.some(r => {
    console.log(`  📋 Analyse réservation:`, r)

    if (!r.date || !r.slot) {
      console.log('    ⚠️ Pas de date ou slot')
      return false
    }

    // Comparaison directe des chaînes (trim pour éviter les espaces)
    const dateMatch = String(r.date).trim() === String(date).trim()
    const slotMatch = String(r.slot).trim() === String(time).trim()

    console.log(`    📅 Date: "${r.date}" === "${date}" ? ${dateMatch}`)
    console.log(`    ⏰ Slot: "${r.slot}" === "${time}" ? ${slotMatch}`)

    if (dateMatch && slotMatch) {
      console.log('    ✅ MATCH TROUVÉ!')
      return true
    }

    return false
  })

  const result = !isReservedByPrestataire
  console.log(`\n🎯 Résultat final: ${result ? '✅ DISPONIBLE' : '❌ NON DISPONIBLE'}`)
  console.log('===================\n')

  return result
}

// Créneaux avec disponibilité par période
const getSlotsWithAvailability = (hours) => {
  if (!selectedDate.value) return []
  return hours.map(time => ({
    time,
    available: isSlotAvailable(selectedDate.value, time)
  }))
}

const morningSlots = computed(() => getSlotsWithAvailability(morningHours))
const afternoonSlots = computed(() => getSlotsWithAvailability(afternoonHours))
const eveningSlots = computed(() => getSlotsWithAvailability(eveningHours))

// CORRECTION: Format de la date sélectionnée avec vérification
const formatSelectedDate = computed(() => {
  if (!selectedDate.value || !Array.isArray(festivalDates.value)) return ''
  const found = festivalDates.value.find(d => d.dateStr === selectedDate.value)
  if (found) {
    return `${found.dayName} ${found.dayNumber} ${found.monthName} 2026`
  }
  return ''
})

// Peut confirmer la réservation (créneau + joueurs + email valide minimum)
const canAddToCart = computed(() => {
  if (!selectedDate.value || !selectedSlot.value || nbPlayers.value < 2) return false
  // Email facultatif mais si rempli, on vérifie un minimum de forme
  if (!contactEmail.value) return true
  return /\S+@\S+\.\S+/.test(contactEmail.value)
})

// Sélection
const selectDate = (dateStr) => {
  selectedDate.value = dateStr
  selectedSlot.value = ''
}

const selectSlot = (time) => {
  selectedSlot.value = time
}

// Gestion des joueurs
const incrementPlayers = () => {
  if (nbPlayers.value < 10) nbPlayers.value++
}

const decrementPlayers = () => {
  if (nbPlayers.value > 2) nbPlayers.value--
}

// Calculer l'heure de fin
const getEndTime = (startTime) => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + 1
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Ajouter une réservation GRATUITE (sans panier)
const addToCart = async () => {
  if (!canAddToCart.value) return

  console.log('=== Début de la réservation ===')
  console.log('Date:', selectedDate.value)
  console.log('Créneau:', selectedSlot.value)
  console.log('Nom:', teamName.value)
  console.log('Email:', contactEmail.value)

  // 1) Sauvegarder la réservation via l'API
  const reservations = getExistingReservations()
  const newBasketResa = {
    date: selectedDate.value,
    slot: selectedSlot.value,
    nbPlayers: nbPlayers.value,
    nom: teamName.value || '',
    email: contactEmail.value || ''
  }
  reservations.push(newBasketResa)

  try {
    const token = localStorage.getItem('authToken')
    await fetch('/api/billets/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ type: 'service', prestataire: 'Terrain de basket', ...newBasketResa })
    })
  } catch (e) {
    console.error('Erreur sauvegarde réservation basket:', e)
  }
  console.log('Réservation basket sauvegardée:', newBasketResa)

  // 2) Créer la réservation côté prestataire
  if (typeof window !== 'undefined') {
    if (typeof window.createPrestataireReservation === 'function') {
      const prestataireResa = {
        id: `basket-${Date.now()}`,
        prestataireNom: 'Terrain de basket',
        date: selectedDate.value, // Format "2026-08-28"
        slot: selectedSlot.value, // Format "14:00" (UNIFIÉ)
        nbJoueurs: nbPlayers.value,
        nom: teamName.value || '',
        email: contactEmail.value || ''
      }
      console.log('Appel de createPrestataireReservation avec:', prestataireResa)
      window.createPrestataireReservation(prestataireResa)
      console.log('Réservation prestataire créée')

      setTimeout(() => {
        refreshTrigger.value++
      }, 100)
    } else {
      console.error('window.createPrestataireReservation n\'est pas définie!')
    }
  }

  // 3) Afficher une confirmation
  showConfirmation.value = true
  setTimeout(() => {
    showConfirmation.value = false
  }, 5000)

  // 4) Réinitialiser le créneau sélectionné
  selectedSlot.value = ''
}

// AJOUT: texte du bouton de réservation avec fallback si la clé i18n n'existe pas
const confirmReservationText = computed(() => {
  const key = 'basketReservation.confirmReservation'
  const translated = t(key)
  if (!translated || translated === key) {
    return 'Confirmer la réservation'
  }
  return translated
})

// AJOUT: texte de confirmation avec fallback si la clé i18n n'existe pas
const reservationConfirmedText = computed(() => {
  const key = 'basketReservation.reservationConfirmed'
  const translated = t(key)
  // Si la traduction renvoie encore la clé brute, on met un texte par défaut
  if (!translated || translated === key) {
    return 'Votre réservation de terrain a bien été enregistrée.'
  }
  return translated
})

// Recharger les créneaux dispo si le stockage basketReservations change ailleurs
const handleBasketUpdate = () => {
  // MODIFICATION: incrémenter refreshTrigger pour forcer le recalcul de tous les computed
  refreshTrigger.value++

  // forcer une mise à jour en réassignant selectedDate (déclenche recompute des slots)
  if (selectedDate.value) {
    const current = selectedDate.value
    selectedDate.value = ''
    setTimeout(() => {
      selectedDate.value = current
    }, 10)
  }
}

onMounted(() => {
  loadFestivalInfo()
  // Recharger les créneaux dispo si le stockage basketReservations change ailleurs
  if (typeof window !== 'undefined') {
    window.addEventListener('basket-reservations-updated', handleBasketUpdate)
    // AJOUT: écouter aussi les mises à jour des réservations prestataires
    window.addEventListener('reservations-updated', handleBasketUpdate)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('basket-reservations-updated', handleBasketUpdate)
    window.removeEventListener('reservations-updated', handleBasketUpdate)
  }
})
</script>

<style scoped>
.basket-reservation-page {
  min-height: 100vh;
  padding: 88px 20px 60px;
  background: #11338A;
  color: #fff;
}

.basket-reservation-container {
  max-width: 900px;
  margin: 0 auto;
}

.basket-reservation-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid rgba(252, 220, 30, 0.2);
}

.header-section {
  text-align: center;
  margin-bottom: 32px;
}

.btn-back {
  display: inline-block;
  margin-bottom: 16px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #FCDC1E;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 700;
  border: 1px solid rgba(252, 220, 30, 0.3);
}

h1 {
  color: #FCDC1E;
  font-size: 1.8rem;
  margin: 0 0 12px;
}

.divider {
  width: 80px;
  height: 3px;
  background: #FCDC1E;
  margin: 0 auto 20px;
  border-radius: 2px;
}

.intro-text {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
}

.intro-text strong { color: #FCDC1E; }

.section {
  margin-bottom: 28px;
  padding: 24px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #FCDC1E;
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.step-number {
  width: 36px;
  height: 36px;
  background: #FCDC1E;
  color: #0a0a0a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}

.section-subtitle {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
}

/* Festival Dates */
.festival-dates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.festival-date-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  cursor: pointer;
  color: #fff;
}

.festival-date-btn:hover { border-color: rgba(252, 220, 30, 0.5); }
.festival-date-btn.selected { border-color: #FCDC1E; background: rgba(252, 220, 30, 0.15); }

.festival-date-day { font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); }
.festival-date-number { font-size: 2.5rem; color: #FCDC1E; font-weight: 900; margin: 8px 0; }
.festival-date-month { color: rgba(255, 255, 255, 0.8); }
.festival-date-label {
  margin-top: 10px;
  padding: 6px 14px;
  background: rgba(252, 220, 30, 0.2);
  color: #FCDC1E;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
}

/* Time Periods */
.time-periods { display: flex; flex-direction: column; gap: 20px; }

.time-period {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.period-title { color: #fff; font-size: 1rem; margin-bottom: 12px; }

.slots-row { display: flex; flex-wrap: wrap; gap: 10px; }

.slot-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  cursor: pointer;
  color: #fff;
}

.slot-btn:hover:not(:disabled) { border-color: rgba(252, 220, 30, 0.5); }
.slot-btn.selected { border-color: #FCDC1E; background: rgba(252, 220, 30, 0.15); }
.slot-btn.unavailable { opacity: 0.4; cursor: not-allowed; }

.slot-time { color: #FCDC1E; font-weight: 700; }
.slot-status { font-size: 0.85rem; }
.slot-btn.selected .slot-status { color: #4caf50; }
.slot-btn.unavailable .slot-status { color: #ff5252; }

/* Players Selector */
.players-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 12px;
}

.qty-btn {
  width: 50px;
  height: 50px;
  background: rgba(252, 220, 30, 0.2);
  border: 2px solid rgba(252, 220, 30, 0.5);
  color: #FCDC1E;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.8rem;
}

.qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.players-display { text-align: center; }
.players-count { font-size: 3rem; color: #FCDC1E; font-weight: 900; }
.players-label { color: rgba(255, 255, 255, 0.7); }
.players-info { text-align: center; color: rgba(255, 255, 255, 0.6); }

/* Recap */
.recap-section { border-color: rgba(252, 220, 30, 0.4) !important; }
.recap-card { display: flex; flex-direction: column; gap: 12px; }

.recap-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.recap-icon { font-size: 1.4rem; }
.recap-content { display: flex; flex-direction: column; gap: 2px; }
.recap-label { color: rgba(255, 255, 255, 0.5); font-size: 0.8rem; }
.recap-value { color: #FCDC1E; font-weight: 700; }

/* Actions */
.actions { display: flex; flex-direction: column; gap: 12px; margin-top: 28px; }

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #FCDC1E;
  color: #0a0a0a;
  padding: 18px;
  border-radius: 50px;
  font-weight: 900;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
}

.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon { font-size: 1.3rem; }

.btn-secondary {
  display: block;
  text-align: center;
  color: #fff;
  text-decoration: none;
  padding: 14px;
  border-radius: 50px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  font-weight: 700;
}

/* Confirmation */
.confirmation-message {
  margin-top: 24px;
  padding: 18px;
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid rgba(76, 175, 80, 0.5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.confirmation-icon { font-size: 1.4rem; }
.confirmation-message span { color: #4caf50; font-weight: 700; }

.confirmation-link {
  color: #FCDC1E;
  text-decoration: none;
  padding: 8px 16px;
  background: rgba(252, 220, 30, 0.2);
  border-radius: 20px;
  font-weight: 700;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 600px) {
  .basket-reservation-card { padding: 20px; }
  h1 { font-size: 1.4rem; }
  .festival-date-number { font-size: 2rem; }
  .players-count { font-size: 2.5rem; }
  .qty-btn { width: 44px; height: 44px; font-size: 1.5rem; }
}

.team-contact-form {
  display: grid;
  gap: 16px;
}

.team-contact-form .form-row label {
  display: block;
  margin-bottom: 6px;
  color: #FCDC1E;
  font-weight: 600;
  font-size: 0.9rem;
}

.team-contact-form .input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.4);
  color: #fff;
  font-size: 0.95rem;
}
</style>

