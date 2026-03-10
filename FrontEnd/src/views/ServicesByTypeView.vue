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
            class="btn-buy-service"
            :class="'btn-type-' + currentType"
            @click="openModal(service)"
          >
            <span v-if="currentType === 'reservation'">📅 {{ $t('prestataireDetail.bookNow') }}</span>
            <span v-else-if="currentType === 'commande'">🛒 {{ $t('prestataireDetail.orderNow') }}</span>
            <span v-else-if="currentType === 'location'">🔧 {{ $t('prestataireDetail.rentNow') }}</span>
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

          <!-- RÉSERVATION -->
          <div v-if="currentType === 'reservation'" class="modal-form">
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

          <!-- Récapitulatif prix -->
          <div class="modal-price-recap">
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

          <button class="btn-validate-modal" @click="addToCart">
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

// Modal
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

  if (type === 'reservation') {
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

onMounted(() => {
  loadServices().then(() => {
    // Si un service est passé en query param, ouvrir le modal directement
    const serviceId = route.query.service
    if (serviceId && servicesList.value.length) {
      const found = servicesList.value.find(s => String(s.id_service) === String(serviceId))
      if (found) {
        openModal(found)
      }
    }
  })
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
</style>

