<template>
  <div class="services-type-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <p>{{ $t('servicesByType.loading') }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-container">
      <h2>{{ $t('servicesByType.errorTitle') }}</h2>
      <p>{{ error }}</p>
      <router-link to="/" class="btn-back">{{ $t('servicesByType.backHome') }}</router-link>
    </div>

    <!-- Content -->
    <div v-else class="services-type-content">
      <!-- Header -->
      <div class="type-header">
        <div class="type-header-icon">{{ typeInfo?.icone || '🛠️' }}</div>
        <div class="type-header-text">
          <h1>{{ localizedLabel }}</h1>
          <p class="type-description">{{ localizedDescription }}</p>
        </div>
      </div>

      <!-- Filtre / barre de recherche -->
      <div class="services-toolbar">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('servicesByType.searchPlaceholder')"
          class="search-input"
        />
        <span class="results-count">{{ filteredServices.length }} {{ $t('servicesByType.results') }}</span>
      </div>

      <!-- Liste des services -->
      <div v-if="filteredServices.length" class="services-grid">
        <div v-for="service in filteredServices" :key="service.id_service" class="service-type-card">
          <!-- En-tête du service -->
          <div class="service-type-card-header">
            <div class="service-prestataire-info" v-if="service.prestataire">
              <img
                v-if="service.prestataire.photo_url"
                :src="service.prestataire.photo_url"
                :alt="service.prestataire.nom"
                class="prestataire-thumb"
                @error="$event.target.style.display='none'"
              />
              <div>
                <h3 class="service-name">{{ localizedServiceName(service) }}</h3>
                <router-link
                  :to="`/prestataire/${encodeURIComponent(service.prestataire.nom)}`"
                  class="prestataire-link"
                >
                  {{ service.prestataire.nom }}
                </router-link>
              </div>
            </div>
            <span class="service-price" :class="{ free: parseFloat(service.prix_estime) === 0 }">
              {{ formatPrix(service.prix_estime) }}
            </span>
          </div>

          <!-- Description -->
          <p class="service-description" v-if="localizedServiceDesc(service)">
            {{ localizedServiceDesc(service) }}
          </p>

          <!-- Champs spécifiques selon le type -->
          <div class="service-specific-fields" v-if="service.champs_specifiques && Object.keys(service.champs_specifiques).length">
            <!-- Réservation -->
            <template v-if="currentType === 'reservation'">
              <div class="specific-field" v-if="service.champs_specifiques.nombre_places">
                <span class="field-icon">👥</span>
                <span>{{ $t('servicesByType.fields.seats') }}: <strong>{{ service.champs_specifiques.nombre_places }}</strong></span>
              </div>
              <div class="specific-field" v-if="service.champs_specifiques.lieu">
                <span class="field-icon">📍</span>
                <span>{{ $t('servicesByType.fields.location') }}: <strong>{{ service.champs_specifiques.lieu }}</strong></span>
              </div>
              <div class="specific-field" v-if="service.champs_specifiques.date">
                <span class="field-icon">📅</span>
                <span>{{ $t('servicesByType.fields.date') }}: <strong>{{ service.champs_specifiques.date }}</strong></span>
              </div>
              <div class="specific-field" v-if="service.champs_specifiques.heure_debut">
                <span class="field-icon">🕐</span>
                <span>{{ service.champs_specifiques.heure_debut }} - {{ service.champs_specifiques.heure_fin }}</span>
              </div>
            </template>

            <!-- Commande -->
            <template v-if="currentType === 'commande'">
              <div class="specific-field" v-if="service.champs_specifiques.delai_preparation">
                <span class="field-icon">⏱️</span>
                <span>{{ $t('servicesByType.fields.prepTime') }}: <strong>{{ service.champs_specifiques.delai_preparation }} min</strong></span>
              </div>
              <div class="specific-field" v-if="service.champs_specifiques.disponible !== undefined">
                <span class="field-icon">{{ service.champs_specifiques.disponible ? '✅' : '❌' }}</span>
                <span>{{ service.champs_specifiques.disponible ? $t('servicesByType.fields.available') : $t('servicesByType.fields.unavailable') }}</span>
              </div>
              <div class="specific-field" v-if="service.champs_specifiques.quantite_min">
                <span class="field-icon">📦</span>
                <span>{{ $t('servicesByType.fields.minQty') }}: {{ service.champs_specifiques.quantite_min }}
                  <template v-if="service.champs_specifiques.quantite_max"> - {{ service.champs_specifiques.quantite_max }}</template>
                </span>
              </div>
            </template>

            <!-- Location -->
            <template v-if="currentType === 'location'">
              <div class="specific-field" v-if="service.champs_specifiques.duree_min">
                <span class="field-icon">⏳</span>
                <span>{{ $t('servicesByType.fields.duration') }}: <strong>{{ service.champs_specifiques.duree_min }}h - {{ service.champs_specifiques.duree_max }}h</strong></span>
              </div>
              <div class="specific-field" v-if="service.champs_specifiques.caution !== undefined">
                <span class="field-icon">💳</span>
                <span>{{ $t('servicesByType.fields.deposit') }}: <strong>{{ service.champs_specifiques.caution }}€</strong></span>
              </div>
              <div class="specific-field" v-if="service.champs_specifiques.disponible !== undefined">
                <span class="field-icon">{{ service.champs_specifiques.disponible ? '✅' : '❌' }}</span>
                <span>{{ service.champs_specifiques.disponible ? $t('servicesByType.fields.available') : $t('servicesByType.fields.unavailable') }}</span>
              </div>
            </template>
          </div>

          <!-- Bouton d'achat -->
          <button
            v-if="service.champs_specifiques?.enabled !== false"
            class="btn-buy-service"
            :class="'btn-type-' + currentType"
            @click="openModal(service)"
          >
            <span v-if="currentType === 'reservation'">📅 {{ $t('prestataireDetail.bookNow') }}</span>
            <span v-else-if="currentType === 'commande'">🛒 {{ $t('prestataireDetail.orderNow') }}</span>
            <span v-else-if="currentType === 'location'">🔧 {{ $t('prestataireDetail.rentNow') }}</span>
          </button>
          <button
            v-else
            class="btn-buy-service btn-disabled"
            disabled
          >
            🚫 Non réservable
          </button>
        </div>
      </div>

      <!-- Vide -->
      <div v-else class="empty-state">
        <p>{{ $t('servicesByType.noServices') }}</p>
      </div>
    </div>

    <!-- MODAL d'achat -->
    <Teleport to="body">
      <div v-if="showModal" class="service-modal-overlay" @click.self="closeModal">
        <div class="service-modal">
          <button class="modal-close" @click="closeModal">✕</button>

          <div class="modal-header">
            <span class="modal-type-icon">{{ typeInfo?.icone || '🛒' }}</span>
            <div>
              <h2 class="modal-title">{{ localizedServiceName(selectedService) }}</h2>
              <p class="modal-subtitle">{{ selectedService?.prestataire?.nom }}</p>
            </div>
          </div>

          <!-- ===== RÉSERVATION avec créneaux prédéfinis ===== -->
          <div v-if="currentType === 'reservation' && hasCreneaux" class="reservation-steps-wrapper">

            <!-- Indicateur d'étapes -->
            <div class="steps-indicator">
              <div class="step-dot" :class="{ active: reservationStep >= 1, done: reservationStep > 1 }">1</div>
              <div class="step-line" :class="{ done: reservationStep > 1 }"></div>
              <div class="step-dot" :class="{ active: reservationStep >= 2, done: reservationStep > 2 }">2</div>
              <div class="step-line" :class="{ done: reservationStep > 2 }"></div>
              <div class="step-dot" :class="{ active: reservationStep >= 3 }">3</div>
            </div>

            <!-- Étape 1 : Choisir la date du festival -->
            <div v-if="reservationStep === 1" class="step-section">
              <h3 class="step-title">
                <span class="step-number-badge">1</span>
                Choisir une date
              </h3>
              <div class="festival-dates-grid-modal">
                <button
                  v-for="date in festivalDatesAvailable"
                  :key="date.dateStr"
                  type="button"
                  class="festival-date-btn-modal"
                  :class="{ selected: selectedReservationDate === date.dateStr }"
                  @click="selectedReservationDate = date.dateStr; selectedCreneau = null; reservationStep = 2"
                >
                  <span class="fdb-day">{{ date.dayName }}</span>
                  <span class="fdb-number">{{ date.dayNumber }}</span>
                  <span class="fdb-month">{{ date.monthName }}</span>
                </button>
              </div>
              <p v-if="!festivalDatesAvailable.length" class="step-hint">Aucune date disponible pour ce service.</p>
            </div>

            <!-- Étape 2 : Choisir le créneau -->
            <div v-if="reservationStep === 2" class="step-section">
              <h3 class="step-title">
                <span class="step-number-badge">2</span>
                Choisir un créneau
              </h3>
              <p class="step-hint">📅 {{ selectedReservationDate }}</p>
              <div class="creneaux-grid-modal">
                <button
                  v-for="(creneau, ci) in creneauxForSelectedDate"
                  :key="ci"
                  type="button"
                  class="creneau-btn-modal"
                  :class="{ selected: selectedCreneau === creneau }"
                  @click="selectedCreneau = creneau; reservationStep = 3"
                >
                  <span class="creneau-time-modal">{{ creneau.heure_debut }} → {{ creneau.heure_fin }}</span>
                  <span v-if="creneau.label" class="creneau-label-modal">{{ creneau.label }}</span>
                  <span v-if="creneau.nombre_places" class="creneau-places-modal">{{ creneau.nombre_places }} places</span>
                </button>
              </div>
              <p v-if="!creneauxForSelectedDate.length" class="step-hint">Aucun créneau disponible ce jour.</p>
              <button class="btn-back-step" @click="reservationStep = 1">← Retour</button>
            </div>

            <!-- Étape 3 : Informations -->
            <div v-if="reservationStep === 3" class="step-section">
              <h3 class="step-title">
                <span class="step-number-badge">3</span>
                Vos informations
              </h3>

              <!-- Récap rapide -->
              <div class="quick-recap">
                <span>📅 {{ selectedReservationDate }}</span>
                <span>⏰ {{ selectedCreneau?.heure_debut }} → {{ selectedCreneau?.heure_fin }}</span>
                <span v-if="selectedCreneau?.label">🏷️ {{ selectedCreneau.label }}</span>
              </div>

              <div class="modal-form">
                <div class="form-group">
                  <label>👤 Nom / Équipe</label>
                  <input type="text" v-model="reservationInfo.nom" class="form-input" placeholder="Votre nom ou équipe" />
                </div>
                <div class="form-group">
                  <label>📧 Email de contact</label>
                  <input type="email" v-model="reservationInfo.email" class="form-input" placeholder="votre@email.com" />
                </div>
                <div class="form-group">
                  <label>👥 Nombre de personnes</label>
                  <input
                    type="number"
                    v-model.number="reservationInfo.nombre_personnes"
                    class="form-input"
                    min="1"
                    :max="selectedCreneau?.nombre_places || 99"
                  />
                </div>
              </div>
              <button class="btn-back-step" @click="reservationStep = 2">← Retour</button>
            </div>

            <!-- Récap prix (step 3 seulement) -->
            <div v-if="reservationStep === 3" class="modal-price-recap">
              <div class="price-line">
                <span>{{ localizedServiceName(selectedService) }}</span>
                <span>{{ formatPrix(selectedService?.prix_estime) }}</span>
              </div>
              <div class="price-line price-total">
                <span>{{ $t('prestataireDetail.modal.total') }}</span>
                <span>{{ formatPrix(computedTotal) }}</span>
              </div>
            </div>

            <button
              v-if="reservationStep === 3"
              class="btn-validate-modal"
              :disabled="!canValidateCreneauReservation"
              @click="addToCart"
            >
              🛒 Confirmer la réservation
            </button>
          </div>
          <!-- ===== FIN RÉSERVATION avec créneaux ===== -->

          <!-- RÉSERVATION libre (sans créneaux prédéfinis) -->
          <div v-else-if="currentType === 'reservation'" class="modal-form">
            <div class="form-group">
              <label>📅 {{ $t('prestataireDetail.modal.date') }}</label>
              <input type="date" v-model="modalForm.date" class="form-input" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>🕐 {{ $t('prestataireDetail.modal.startTime') }}</label>
                <input type="time" v-model="modalForm.heure_debut" class="form-input" />
              </div>
              <div class="form-group">
                <label>🕐 {{ $t('prestataireDetail.modal.endTime') }}</label>
                <input type="time" v-model="modalForm.heure_fin" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label>👥 {{ $t('prestataireDetail.modal.nbPersons') }}</label>
              <input type="number" v-model.number="modalForm.nombre_personnes" class="form-input" min="1" />
            </div>
          </div>

          <!-- COMMANDE -->
          <div v-else-if="currentType === 'commande'" class="modal-form">
            <div class="form-group">
              <label>📦 {{ $t('prestataireDetail.modal.quantity') }}</label>
              <input type="number" v-model.number="modalForm.quantite" class="form-input" min="1" max="99" />
            </div>
          </div>

          <!-- LOCATION -->
          <div v-else-if="currentType === 'location'" class="modal-form">
            <div class="form-group">
              <label>⏳ {{ $t('prestataireDetail.modal.duration') }}</label>
              <input type="number" v-model.number="modalForm.duree" class="form-input" min="1" max="24" step="0.5" />
              <span class="form-hint">{{ $t('prestataireDetail.modal.hours') }}</span>
            </div>
            <div class="form-group">
              <label>📅 {{ $t('prestataireDetail.modal.date') }}</label>
              <input type="date" v-model="modalForm.date" class="form-input" />
            </div>
          </div>

          <!-- Récapitulatif prix (commande / location / réservation libre) -->
          <div v-if="!(currentType === 'reservation' && hasCreneaux)" class="modal-price-recap">
            <div class="price-line">
              <span>{{ localizedServiceName(selectedService) }}</span>
              <span>{{ formatPrix(selectedService?.prix_estime) }}</span>
            </div>
            <div v-if="currentType === 'commande' && modalForm.quantite > 1" class="price-line">
              <span>× {{ modalForm.quantite }}</span>
              <span>{{ formatPrix((parseFloat(selectedService?.prix_estime) || 0) * modalForm.quantite) }}</span>
            </div>
            <div v-if="currentType === 'location' && modalForm.duree > 1" class="price-line">
              <span>× {{ modalForm.duree }}h</span>
              <span>{{ formatPrix((parseFloat(selectedService?.prix_estime) || 0) * modalForm.duree) }}</span>
            </div>
            <div class="price-line price-total">
              <span>{{ $t('prestataireDetail.modal.total') }}</span>
              <span>{{ formatPrix(computedTotal) }}</span>
            </div>
          </div>

          <button
            v-if="!(currentType === 'reservation' && hasCreneaux)"
            class="btn-validate-modal"
            @click="addToCart"
          >
            🛒 {{ $t('prestataireDetail.modal.addToCart') }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePanierStore } from '@/stores/panier'

const { t, locale } = useI18n()
const route = useRoute()
const panier = usePanierStore()

const loading = ref(true)
const error = ref(null)
const typeInfo = ref(null)
const servicesList = ref([])
const searchQuery = ref('')

// Modal principal
const showModal = ref(false)
const selectedService = ref(null)
const modalForm = ref({
  date: '2026-08-28',
  heure_debut: '10:00',
  heure_fin: '11:00',
  nombre_personnes: 1,
  quantite: 1,
  duree: 1,
})

// ===== Réservation avec créneaux prédéfinis =====
const festivalDates = ref([])
const reservationStep = ref(1)          // 1=date, 2=créneau, 3=infos
const selectedReservationDate = ref('')
const selectedCreneau = ref(null)
const reservationInfo = ref({ nom: '', email: '', nombre_personnes: 1 })

// true si le service sélectionné est de type réservation ET a des créneaux
const hasCreneaux = computed(() => {
  return currentType.value === 'reservation' &&
    Array.isArray(selectedService.value?.champs_specifiques?.creneaux) &&
    selectedService.value.champs_specifiques.creneaux.length > 0
})

// Clé du jour correspondant à la date sélectionnée (ex: 'vendredi', 'samedi', 'dimanche')
const selectedJourKey = computed(() => {
  if (!selectedReservationDate.value) return ''
  const found = festivalDates.value.find(d => d.dateStr === selectedReservationDate.value)
  return found ? found.dayName.toLowerCase() : ''
})

// Horaires valides par jour (identiques à PrestataireView)
const validSlotsByDay = {
  'vendredi': ['15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','00:00','01:00','02:00'],
  'samedi':   ['13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','00:00','01:00','02:00'],
  'dimanche': ['13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'],
}

// Convertit une heure "HH:MM" en minutes, en traitant 00:00-04:59 comme après minuit (24h+)
const timeToSortMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  // Les heures entre 00:00 et 04:59 sont considérées comme après minuit
  const adjustedH = h < 5 ? h + 24 : h
  return adjustedH * 60 + (m || 0)
}

// Trie les créneaux par heure de début (gère les heures après minuit)
const sortCreneaux = (creneaux) => {
  return [...creneaux].sort((a, b) => timeToSortMinutes(a.heure_debut) - timeToSortMinutes(b.heure_debut))
}

// Créneaux filtrés pour le jour sélectionné
// Supporte l'ancien format (sans 'jour') et le nouveau format (avec 'jour')
const creneauxForSelectedDate = computed(() => {
  const creneaux = selectedService.value?.champs_specifiques?.creneaux
  if (!Array.isArray(creneaux) || !creneaux.length) return []

  const hasJourField = creneaux.some(c => c.jour)

  if (hasJourField) {
    // Nouveau format : filtrer strictement par le jour sélectionné
    if (!selectedJourKey.value) return []
    return sortCreneaux(creneaux.filter(c => c.jour === selectedJourKey.value))
  }

  // Ancien format (pas de champ 'jour') : filtrer par les horaires valides du jour sélectionné
  if (selectedJourKey.value) {
    const validSlots = validSlotsByDay[selectedJourKey.value]
    if (validSlots) {
      const filtered = creneaux.filter(c => validSlots.includes(c.heure_debut))
      if (filtered.length > 0) return sortCreneaux(filtered)
    }
  }

  // Dernier recours : afficher tous les créneaux triés
  return sortCreneaux(creneaux)
})

// Dates du festival sur lesquelles le service a au moins un créneau
const festivalDatesAvailable = computed(() => {
  if (!hasCreneaux.value) return festivalDates.value
  const creneaux = selectedService.value?.champs_specifiques?.creneaux || []
  // Si aucun créneau n'a de champ 'jour' (ancien format) → afficher tous les jours
  const hasJourField = creneaux.some(c => c.jour)
  if (!hasJourField) return festivalDates.value
  // Nouveau format : afficher uniquement les jours ayant des créneaux
  const filtered = festivalDates.value.filter(d => {
    const jourKey = d.dayName.toLowerCase()
    return creneaux.some(c => c.jour === jourKey)
  })
  // Sécurité : si le filtre vide tout, afficher quand même tous les jours
  return filtered.length > 0 ? filtered : festivalDates.value
})

// Le bouton "Confirmer" de l'étape 3 n'est actif que si date + créneau sont sélectionnés
const canValidateCreneauReservation = computed(() => {
  return !!selectedReservationDate.value && !!selectedCreneau.value
})

// Charger les dates du festival depuis l'API
const loadFestivalDates = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const resp = await fetch('/api/manifestations', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (resp.ok) {
      const list = await resp.json()
      const festival = Array.isArray(list) ? (list.find(f => f.actif) || list[0]) : null
      if (festival) {
        const debut = new Date(festival.date_debut)
        const fin = new Date(festival.date_fin)
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
        const dates = []
        for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
          dates.push({
            dateStr: d.toISOString().split('T')[0],
            dayName: dayNames[d.getDay()],
            dayNumber: d.getDate(),
            monthName: monthNames[d.getMonth()],
          })
        }
        festivalDates.value = dates
        return
      }
    }
  } catch (e) {
    console.error('Erreur chargement festival dates:', e)
  }
  // Fallback
  festivalDates.value = [
    { dateStr: '2026-08-28', dayName: 'Vendredi', dayNumber: 28, monthName: 'Août' },
    { dateStr: '2026-08-29', dayName: 'Samedi',   dayNumber: 29, monthName: 'Août' },
    { dateStr: '2026-08-30', dayName: 'Dimanche', dayNumber: 30, monthName: 'Août' },
  ]
}
// ===== FIN Réservation avec créneaux =====

const currentType = computed(() => route.params.type || '')

const localizedLabel = computed(() => {
  if (!typeInfo.value) return ''
  return locale.value === 'en' ? (typeInfo.value.label_en || typeInfo.value.label_fr) : typeInfo.value.label_fr
})

const localizedDescription = computed(() => {
  if (!typeInfo.value) return ''
  return locale.value === 'en' ? (typeInfo.value.description_en || typeInfo.value.description_fr) : typeInfo.value.description_fr
})

const localizedServiceName = (service) => {
  return locale.value === 'en' ? (service.nom_service_en || service.nom_service_fr) : service.nom_service_fr
}

const localizedServiceDesc = (service) => {
  return locale.value === 'en' ? (service.description_en || service.description_fr) : service.description_fr
}

const filteredServices = computed(() => {
  if (!searchQuery.value.trim()) return servicesList.value
  const q = searchQuery.value.trim().toLowerCase()
  return servicesList.value.filter(s => {
    const name = localizedServiceName(s).toLowerCase()
    const desc = (localizedServiceDesc(s) || '').toLowerCase()
    const presta = (s.prestataire?.nom || '').toLowerCase()
    return name.includes(q) || desc.includes(q) || presta.includes(q)
  })
})

const formatPrix = (val) => {
  if (!val || parseFloat(val) === 0) return t('servicesByType.free')
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val)
}

const loadServices = async () => {
  loading.value = true
  error.value = null
  try {
    const token = localStorage.getItem('authToken')
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }

    const resp = await fetch(`/api/types-service/nom/${currentType.value}/services`, { headers })
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`)
    }
    const data = await resp.json()
    typeInfo.value = data.type
    servicesList.value = data.services || []
  } catch (e) {
    console.error('Erreur chargement services par type:', e)
    error.value = t('servicesByType.loadError')
  } finally {
    loading.value = false
  }
}

// ---- Modal d'achat ----
const openModal = (service) => {
  selectedService.value = service
  modalForm.value = {
    date: '2026-08-28',
    heure_debut: '10:00',
    heure_fin: '11:00',
    nombre_personnes: 1,
    quantite: 1,
    duree: 1,
  }
  // Reset du formulaire étape par étape
  reservationStep.value = 1
  selectedReservationDate.value = ''
  selectedCreneau.value = null
  reservationInfo.value = { nom: '', email: '', nombre_personnes: 1 }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedService.value = null
}

const computedTotal = computed(() => {
  if (!selectedService.value) return 0
  const prix = parseFloat(selectedService.value.prix_estime) || 0
  const type = currentType.value
  if (type === 'commande') return prix * (modalForm.value.quantite || 1)
  if (type === 'location') return prix * (modalForm.value.duree || 1)
  return prix
})

const addToCart = () => {
  if (!selectedService.value) return
  const service = selectedService.value
  const type = currentType.value
  const nom = localizedServiceName(service)
  const prestaNom = service.prestataire?.nom || ''

  let label = ''
  let details = {}

  if (type === 'reservation' && hasCreneaux.value) {
    // Réservation avec créneau prédéfini
    const creneau = selectedCreneau.value
    label = `${nom} — ${selectedReservationDate.value} ${creneau.heure_debut}-${creneau.heure_fin}`
    details = {
      date: selectedReservationDate.value,
      heure_debut: creneau.heure_debut,
      heure_fin: creneau.heure_fin,
      label_creneau: creneau.label || '',
      nombre_personnes: reservationInfo.value.nombre_personnes,
      nom: reservationInfo.value.nom,
      email: reservationInfo.value.email,
    }
  } else if (type === 'reservation') {
    label = `${nom} — ${modalForm.value.date} ${modalForm.value.heure_debut}-${modalForm.value.heure_fin}`
    details = {
      date: modalForm.value.date,
      heure_debut: modalForm.value.heure_debut,
      heure_fin: modalForm.value.heure_fin,
      nombre_personnes: modalForm.value.nombre_personnes,
    }
  } else if (type === 'location') {
    label = `${nom} — ${modalForm.value.duree}h le ${modalForm.value.date}`
    details = { duree: modalForm.value.duree, date: modalForm.value.date }
  } else {
    label = `${nom} × ${modalForm.value.quantite}`
    details = { quantite: modalForm.value.quantite }
  }

  panier.addItem({
    type: 'service',
    serviceType: type,
    id_service: service.id_service || null,
    id_prestataire: service.prestataire?.id_prestataire || service.id_prestataire || null,
    label,
    nom,
    prestataire: prestaNom,
    prix: computedTotal.value,
    quantity: type === 'commande' ? modalForm.value.quantite : 1,
    details,
  })

  closeModal()
  alert(t('prestataireDetail.modal.addedToCart'))
}

onMounted(async () => {
  // Charger festival dates ET services en parallèle, attendre les deux
  // avant d'ouvrir le modal (évite la race condition sur festivalDates)
  await Promise.all([loadFestivalDates(), loadServices()])

  // Si un service est passé en query param, ouvrir le modal directement
  const serviceId = route.query.service
  if (serviceId && servicesList.value.length) {
    const found = servicesList.value.find(s => String(s.id_service) === String(serviceId))
    if (found) {
      openModal(found)
    }
  }
})
</script>


<style scoped>
.services-type-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 40px 20px;
  color: #fff;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
}

.btn-back {
  background: #FCDC1E;
  color: #000;
  padding: 10px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}

.services-type-content {
  max-width: 1200px;
  margin: 0 auto;
}

.type-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 40px;
  padding: 32px;
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.2);
}

.type-header-icon {
  font-size: 3rem;
  background: rgba(252, 220, 30, 0.15);
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  flex-shrink: 0;
}

.type-header-text h1 {
  font-size: 2rem;
  color: #FCDC1E;
  margin: 0 0 8px 0;
}

.type-description {
  color: rgba(255,255,255,0.7);
  font-size: 1.1rem;
  margin: 0;
}

.services-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: #fff;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #FCDC1E;
}

.search-input::placeholder {
  color: rgba(255,255,255,0.4);
}

.results-count {
  color: rgba(255,255,255,0.5);
  font-size: 0.9rem;
  white-space: nowrap;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.service-type-card {
  background: rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.1);
  transition: transform 0.2s, border-color 0.2s;
}

.service-type-card:hover {
  transform: translateY(-2px);
  border-color: rgba(252, 220, 30, 0.4);
}

.service-type-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.service-prestataire-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.prestataire-thumb {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  background: rgba(255,255,255,0.1);
}

.service-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px 0;
}

.prestataire-link {
  color: #FCDC1E;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
}

.prestataire-link:hover {
  text-decoration: underline;
}

.service-price {
  background: #FCDC1E;
  color: #000;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
}

.service-price.free {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.service-description {
  color: rgba(255,255,255,0.65);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.service-specific-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.specific-field {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.06);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.8);
}

.field-icon {
  font-size: 1rem;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255,255,255,0.5);
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .type-header {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }

  .services-toolbar {
    flex-direction: column;
  }
}

/* Bouton d'achat */
.btn-buy-service {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.btn-buy-service:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}
.btn-type-reservation {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #1a1a2e;
}
.btn-type-commande {
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  color: #fff;
}
.btn-type-location {
  background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%);
  color: #fff;
}
.btn-buy-service.btn-disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  opacity: 0.6;
}
.btn-buy-service.btn-disabled:hover {
  transform: none;
  box-shadow: none;
}

/* Modal */
.service-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}
.service-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(252,220,30,0.3);
  border-radius: 20px;
  padding: 32px;
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: modalIn 0.25s ease;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-close {
  position: absolute;
  top: 16px; right: 16px;
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  font-size: 1.2rem;
  width: 36px; height: 36px;
  border-radius: 50%;
  cursor: pointer;
}
.modal-close:hover { background: rgba(255,255,255,0.2); }
.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(252,220,30,0.2);
}
.modal-type-icon {
  font-size: 2.5rem;
  background: rgba(252,220,30,0.1);
  width: 64px; height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  flex-shrink: 0;
}
.modal-title {
  color: #FCDC1E;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
}
.modal-subtitle {
  color: rgba(255,255,255,0.6);
  font-size: 0.9rem;
  margin: 4px 0 0;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 24px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(0,0,0,0.3);
  color: #fff;
  font-size: 1rem;
  font-family: inherit;
}
.form-input:focus {
  outline: none;
  border-color: #FCDC1E;
  box-shadow: 0 0 0 3px rgba(252,220,30,0.1);
}
.form-hint {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.45);
}
.modal-price-recap {
  background: rgba(0,0,0,0.25);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(255,255,255,0.08);
}
.price-line {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  color: rgba(255,255,255,0.7);
  font-size: 0.95rem;
}
.price-total {
  border-top: 1px solid rgba(252,220,30,0.3);
  margin-top: 8px;
  padding-top: 12px;
  color: #FCDC1E;
  font-weight: 800;
  font-size: 1.15rem;
}
.btn-validate-modal {
  display: block;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #1a1a2e;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-validate-modal:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(252,220,30,0.4);
}
.btn-validate-modal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ===== Formulaire étape par étape (créneaux) ===== */
.reservation-steps-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Indicateur d'étapes */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 4px;
}
.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  border: 2px solid rgba(255,255,255,0.25);
  color: rgba(255,255,255,0.5);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}
.step-dot.active {
  background: #FCDC1E;
  border-color: #FCDC1E;
  color: #1a1a2e;
}
.step-dot.done {
  background: rgba(252,220,30,0.3);
  border-color: #FCDC1E;
  color: #FCDC1E;
}
.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255,255,255,0.15);
  max-width: 60px;
  transition: background 0.3s ease;
}
.step-line.done {
  background: #FCDC1E;
}

/* Section d'une étape */
.step-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.step-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
}
.step-number-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #FCDC1E;
  color: #1a1a2e;
  font-weight: 900;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.step-hint {
  color: rgba(255,255,255,0.55);
  font-size: 0.9rem;
  margin: 0;
}

/* Grille des dates du festival */
.festival-dates-grid-modal {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}
.festival-date-btn-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  background: rgba(255,255,255,0.06);
  border: 2px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s ease;
  font-family: inherit;
  gap: 4px;
}
.festival-date-btn-modal:hover {
  border-color: rgba(252,220,30,0.6);
  background: rgba(252,220,30,0.08);
}
.festival-date-btn-modal.selected {
  border-color: #FCDC1E;
  background: rgba(252,220,30,0.2);
}
.fdb-day {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.6);
}
.fdb-number {
  font-size: 1.8rem;
  font-weight: 900;
  color: #FCDC1E;
  line-height: 1;
}
.fdb-month {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.8);
}

/* Grille des créneaux */
.creneaux-grid-modal {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.creneau-btn-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  background: rgba(255,255,255,0.06);
  border: 2px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s ease;
  font-family: inherit;
}
.creneau-btn-modal:hover {
  border-color: rgba(252,220,30,0.6);
  background: rgba(252,220,30,0.08);
}
.creneau-btn-modal.selected {
  border-color: #FCDC1E;
  background: rgba(252,220,30,0.2);
}
.creneau-time-modal {
  font-size: 1rem;
  font-weight: 800;
  color: #FCDC1E;
}
.creneau-label-modal {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.7);
}
.creneau-places-modal {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.08);
  padding: 2px 8px;
  border-radius: 10px;
}

/* Récap rapide (étape 3) */
.quick-recap {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: rgba(252,220,30,0.1);
  border: 1px solid rgba(252,220,30,0.25);
  border-radius: 10px;
  font-size: 0.88rem;
  color: rgba(255,255,255,0.85);
}

/* Bouton retour */
.btn-back-step {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.7);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  transition: all 0.2s ease;
  align-self: flex-start;
  font-family: inherit;
}
.btn-back-step:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
}
/* ===== FIN formulaire créneaux ===== */
</style>

