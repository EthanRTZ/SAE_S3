<template>
  <div class="prestataire-detail-page">
    <div v-if="loading" class="loading-container">
      <p>{{ $t('prestataire.loading') }}</p>
    </div>
    
    <div v-else-if="!prestataire" class="error-container">
      <h2>{{ $t('prestataireDetail.notFound') }}</h2>
      <p>{{ $t('prestataireDetail.notFoundDesc') }}</p>
      <router-link to="/prestataire" class="btn-back">{{ $t('prestataireDetail.backToList') }}</router-link>
    </div>

    <div v-else class="detail-container">
      <!-- Header avec image -->
      <div class="detail-header">
        <div class="header-background" :style="{ backgroundImage: prestataire.image ? `url(${prestataire.image})` : 'none' }"></div>
        <div class="header-overlay"></div>
        <div class="header-content">
          <router-link to="/prestataire" class="btn-back-header">
            ← {{ $t('prestataireDetail.back') }}
          </router-link>
          <div class="prestataire-main-info">
            <div v-if="prestataire.image" class="prestataire-image-wrapper">
              <img :src="prestataire.image" :alt="prestataire.nom" class="prestataire-image-large" @error="handleImageError" />
            </div>
            <div class="prestataire-title-section">
              <h1 class="prestataire-title">{{ prestataire.nom }}</h1>
              <span class="prestataire-type-badge">{{ prestataire.type }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="detail-content">

        <!-- Description WYSIWYG -->
        <section v-if="prestataire.description" class="detail-section">
          <h2 class="section-title">{{ $t('prestataireDetail.presentation') }}</h2>
          <div class="description-content" v-html="prestataire.description"></div>
        </section>

        <!-- Services -->
        <section v-if="publicServices.length > 0" class="detail-section">
          <h2 class="section-title">{{ $t('prestataireDetail.services') }}</h2>
          <div class="services-grid">
            <div v-for="(service, idx) in publicServices" :key="idx" class="service-card">
              <div class="service-header">
                <div class="service-header-left">
                  <h3 class="service-name">{{ service.nom }}</h3>
                  <span v-if="service.typeName" class="service-type-badge">
                    {{ service.typeIcon }} {{ service.typeLabel }}
                  </span>
                </div>
                <span class="service-price-badge" :class="{ 'price-free': (service.prix || 0) === 0 }">
                  {{ formatServicePrix(service.prix) }}
                </span>
              </div>
              <p v-if="service.description" class="service-description">{{ service.description }}</p>

              <!-- Bouton d'achat adapté au type -->
              <button
                v-if="service.champs_specifiques?.enabled !== false"
                class="btn-buy-service"
                :class="service.typeName ? 'btn-type-' + service.typeName : 'btn-type-default'"
                @click="goToServicePage(service)"
              >
                <span v-if="service.typeName === 'reservation'">📅 {{ $t('prestataireDetail.bookNow') }}</span>
                <span v-else-if="service.typeName === 'commande'">🛒 {{ $t('prestataireDetail.orderNow') }}</span>
                <span v-else-if="service.typeName === 'location'">🔧 {{ $t('prestataireDetail.rentNow') }}</span>
                <span v-else>🛒 {{ $t('prestataireDetail.orderNow') }}</span>
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
        </section>


        <!-- Informations de contact -->
        <section class="detail-section">
          <h2 class="section-title">{{ $t('prestataireDetail.contactInfo') }}</h2>
          <div class="contact-info">
            <div v-if="prestataire.email" class="contact-item">
              <span class="contact-icon">📧</span>
              <div class="contact-details">
                <span class="contact-label">{{ $t('prestataireDetail.email') }}</span>
                <a :href="`mailto:${prestataire.email}`" class="contact-value">{{ prestataire.email }}</a>
              </div>
            </div>
            <div v-if="prestataire.tel" class="contact-item">
              <span class="contact-icon">📞</span>
              <div class="contact-details">
                <span class="contact-label">{{ $t('prestataireDetail.phone') }}</span>
                <a :href="`tel:${prestataire.tel}`" class="contact-value">{{ prestataire.tel }}</a>
              </div>
            </div>
            <div v-if="prestataire.site" class="contact-item">
              <span class="contact-icon">🌐</span>
              <div class="contact-details">
                <span class="contact-label">{{ $t('prestataireDetail.website') }}</span>
                <a :href="prestataire.site" target="_blank" rel="noopener" class="contact-value link-external">{{ prestataire.site }}</a>
              </div>
            </div>
          </div>
        </section>

        <!-- Localisation sur la carte -->
        <section v-if="prestataire.coordone" class="detail-section">
          <h2 class="section-title">{{ $t('prestataireDetail.location') }}</h2>
          <p class="location-text">{{ $t('prestataireDetail.onSite') }}</p>
          <router-link to="/carte" class="btn-map">
            {{ $t('prestataireDetail.seeOnMap') }}
          </router-link>
        </section>

       
        <section class="detail-section">
          <h2 class="section-title">{{ $t('prestataireDetail.reviews') }}</h2>

          <!-- Stats globales -->
          <div v-if="noteStats.nbAvis > 0" class="avis-stats">
            <div class="avis-note-moyenne">
              <div class="note-moyenne-val">{{ noteStats.moyenne.toFixed(1) }}</div>
              <div class="note-moyenne-stars">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="star"
                  :class="{ filled: i <= Math.round(noteStats.moyenne) }"
                >
                  ★
                </span>
              </div>
              <div class="note-moyenne-meta">
                {{ noteStats.nbAvis }} {{ $t('prestataireDetail.reviewsTotal') }}
              </div>
            </div>
            <div class="avis-repartition">
              <div
                v-for="i in [5,4,3,2,1]"
                :key="i"
                class="avis-repartition-row"
              >
                <span class="avis-repartition-label">{{ i }}★</span>
                <div class="avis-repartition-bar">
                  <div
                    class="avis-repartition-fill"
                    :style="{ width: noteStats.nbAvis ? (noteStats.parNote[i] / noteStats.nbAvis) * 100 + '%' : '0%' }"
                  ></div>
                </div>
                <span class="avis-repartition-count">{{ noteStats.parNote[i] || 0 }}</span>
              </div>
            </div>
          </div>

          <div v-else class="empty-avis">
            {{ $t('prestataireDetail.noReviews') }}
          </div>

          <!-- Liste des avis (derniers avis) -->
          <div v-if="avisList.length" class="avis-list">
            <h3 class="avis-list-title">{{ $t('prestataireDetail.lastReviews') }}</h3>
            <div
              v-for="avis in avisList.slice().reverse()"
              :key="avis.id"
              class="avis-item"
            >
              <div class="avis-item-header">
                <div class="avis-item-note">
                  <span class="avis-stars">
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="star"
                      :class="{ filled: i <= avis.note }"
                    >
                      ★
                    </span>
                  </span>
                  <span class="avis-date">
                    {{ new Date(avis.date).toLocaleString('fr-FR') }}
                  </span>
                </div>
              </div>
              <p class="avis-commentaire">{{ avis.commentaire }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePanierStore } from '@/stores/panier'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const panier = usePanierStore()
const prestataire = ref(null)
const loading = ref(true)


// ================================
// ÉTAT POUR LES AVIS / STATISTIQUES
// ================================
const avisList = ref([])
const noteStats = ref({
  moyenne: 0,
  nbAvis: 0,
  parNote: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
})

// --------- AVIS : chargement / sauvegarde / calcul ---------
const loadAvisFromStorage = async (prestataireNom) => {
  try {
    // Charger les avis depuis l'API
    try {
      const token = localStorage.getItem('authToken')
      const resp = await fetch(`/api/avis/prestataire/${encodeURIComponent(prestataireNom)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (resp.ok) {
        const data = await resp.json()
        const list = data.avis || []
        avisList.value = list.map(a => ({
          id: `api-${a.id_avis}`,
          note: a.note,
          nom: a.utilisateur?.nom_utilisateur || 'Anonyme',
          commentaire: a.commentaire,
          date: a.date_avis,
          source: 'api'
        }))
      }
    } catch (e) {
      console.error('Erreur chargement avis API:', e)
    }

    avisList.value.sort((a, b) => new Date(b.date || b.date_avis) - new Date(a.date || a.date_avis))
    computeNoteStats()
  } catch (e) {
    console.error('Erreur chargement avis', e)
    avisList.value = []
    computeNoteStats()
  }
}

const computeNoteStats = () => {
  const stats = {
    moyenne: 0,
    nbAvis: avisList.value.length,
    parNote: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  }

  if (!stats.nbAvis) {
    noteStats.value = stats
    return
  }

  let total = 0
  avisList.value.forEach(a => {
    const n = a.note || 0
    if (stats.parNote[n] !== undefined) {
      stats.parNote[n]++
    }
    total += n
  })
  stats.moyenne = total / stats.nbAvis
  noteStats.value = stats
}

// --------- Chargement des types de service ---------
const loadTypesService = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const resp = await fetch('/api/types-service', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (resp.ok) {
      typesServiceList.value = await resp.json()
    }
  } catch (e) {
    console.warn('Types de service indisponibles', e)
  }
}

// Enrichir un service avec les infos du type à partir de id_type_service
const enrichService = (s, lang) => {
  if (s.typeName) return s
  if (s.id_type_service && typesServiceList.value.length > 0) {
    const type = typesServiceList.value.find(t => t.id_type_service === s.id_type_service)
    if (type) {
      s.typeName = type.nom
      s.typeLabel = lang === 'en' ? (type.label_en || type.label_fr) : type.label_fr
      s.typeIcon = type.icone || ''
    }
  }
  return s
}

// --------- Chargement du prestataire + avis ---------
const loadPrestataire = async () => {
  loading.value = true
  try {
    const prestataireNom = decodeURIComponent(route.params.nom)
    const currentLang = locale.value || 'fr'

    let found = null

    // 1. Essayer l'API
    try {
      const token = localStorage.getItem('authToken')
      const resp = await fetch('/api/prestataires', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (resp.ok) {
        const list = await resp.json()
        const p = Array.isArray(list) ? list.find(p => p.nom === prestataireNom) : null
        if (p) {
          found = {
            ...p,
            description: p.description_fr ? (currentLang === 'en' ? (p.description_en || p.description_fr) : p.description_fr) : '',
            image: p.photo_url,
            email: p.contact_email,
            tel: p.contact_tel,
            site: p.site_web,
            type: p.type_prestataire,
            services: (p.services || []).map(s => ({
              id_service: s.id_service,
              nom: currentLang === 'en' ? (s.nom_service_en || s.nom_service_fr) : s.nom_service_fr,
              description: currentLang === 'en' ? (s.description_en || s.description_fr) : s.description_fr,
              prix: parseFloat(s.prix_estime) || 0,
              champs_specifiques: s.champs_specifiques || {},
              id_type_service: s.id_type_service,
              typeName: s.typeService?.nom || null,
              typeLabel: s.typeService ? (currentLang === 'en' ? (s.typeService.label_en || s.typeService.label_fr) : s.typeService.label_fr) : '',
              typeIcon: s.typeService?.icone || '',
              actif: true
            }))
          }
        }
      }
    } catch (e) {
      console.error('Erreur chargement prestataire API:', e)
    }

    if (!found) {
      prestataire.value = null
      loading.value = false
      return
    }

    prestataire.value = found

    if (prestataire.value?.nom) {
      await loadAvisFromStorage(prestataire.value.nom)
    }
  } catch (error) {
    console.error('Erreur lors du chargement du prestataire:', error)
    prestataire.value = null
    avisList.value = []
    computeNoteStats()
  } finally {
    loading.value = false
  }
}

const formatServicePrix = (prix) => {
  if (prix === undefined || prix === null) return t('home.free')
  if (prix === 0) return t('home.free')
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(prix)
}

const cleanHtml = (html) => {
  if (!html) return ''
  if (!html.includes('<')) return html
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  return tempDiv.textContent || tempDiv.innerText || ''
}

const handleImageError = (e) => {
  e.target.src = '/media/placeholder-prestataire.png'
}

// Watch pour recharger quand la langue change
watch(() => locale.value, () => {
  loadPrestataire()
})

onMounted(async () => {
  await loadTypesService()
  loadPrestataire()
  window.addEventListener('prestataire-updated', updateHandler)
})

// Écouter les mises à jour
const updateHandler = () => loadPrestataire()

onBeforeUnmount(() => {
  window.removeEventListener('prestataire-updated', updateHandler)
})

const publicServices = computed(() => {
  if (!prestataire.value?.services) return []
  return prestataire.value.services.filter(s => s.actif !== false)
})

// Formater la clé d'un champ spécifique pour l'affichage
const formatFieldKey = (key) => {
  const labels = {
    date: '📅 Date',
    heure_debut: '🕐 Début',
    heure_fin: '🕐 Fin',
    nombre_places: '👥 Places',
    lieu: '📍 Lieu',
    quantite_min: '📦 Qté min',
    quantite_max: '📦 Qté max',
    delai_preparation: '⏱️ Préparation',
    disponible: '✅ Disponibilité',
    duree_min: '⏳ Durée min',
    duree_max: '⏳ Durée max',
    caution: '💳 Caution',
  }
  return labels[key] || key
}

// Formater la valeur d'un champ spécifique
const formatFieldValue = (val) => {
  if (typeof val === 'boolean') return val ? '✅ Oui' : '❌ Non'
  if (typeof val === 'number') return val.toString()
  return val
}

// ---- Modal d'achat ----
// Redirigé vers ServicesByTypeView via goToServicePage()

// Rediriger vers la page du type de service
const goToServicePage = (service) => {
  const type = service.typeName || 'commande'
  router.push({
    path: `/services/${type}`,
    query: {
      service: service.id_service || '',
      prestataire: prestataire.value?.nom || ''
    }
  })
}
</script>

<style scoped>
.prestataire-detail-page {
  min-height: calc(100vh - 64px);
  padding-top: 64px;
  background: linear-gradient(to bottom, #6f47c1 0%, #1629bf 50%, #11338A 100%);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  padding: 40px;
  color: #FCDC1E;
  text-align: center;
}

.error-container h2 {
  font-size: 2rem;
  margin-bottom: 16px;
}

.error-container p {
  font-size: 1.1rem;
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.8);
}

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: flex-end;
  padding: 40px 20px;
  margin-bottom: 40px;
  overflow: hidden;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  filter: blur(8px);
  transform: scale(1.1);
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(17, 51, 138, 0.7) 50%, rgba(17, 51, 138, 0.95) 100%);
}

.header-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.btn-back-header {
  display: inline-block;
  margin-bottom: 20px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #FCDC1E;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: background 0.2s ease;
  border: 1px solid rgba(252, 220, 30, 0.3);
}

.btn-back-header:hover {
  background: rgba(255, 255, 255, 0.2);
}

.prestataire-main-info {
  display: flex;
  gap: 24px;
  align-items: flex-end;
}

.prestataire-image-wrapper {
  flex-shrink: 0;
}

.prestataire-image-large {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 16px;
  border: 3px solid #FCDC1E;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.1);
}

.prestataire-title-section {
  flex: 1;
}

.prestataire-title {
  color: #FCDC1E;
  font-size: clamp(2rem, 5vw, 3rem);
  margin-bottom: 12px;
  font-weight: 900;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.prestataire-type-badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(252, 220, 30, 0.2);
  color: #FCDC1E;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  border: 1px solid rgba(252, 220, 30, 0.4);
  margin-bottom: 16px;
}

.prestataire-description-header {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 800px;
}

.detail-content {
  padding: 0 20px 40px;
}

.detail-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 32px;
  border-radius: 16px;
  margin-bottom: 32px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  backdrop-filter: blur(8px);
}

.section-title {
  color: #FCDC1E;
  font-size: 1.8rem;
  margin-bottom: 24px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.service-card {
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(252, 220, 30, 0.2);
  transition: all 0.2s ease;
}

.service-card:hover {
  border-color: rgba(252, 220, 30, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.service-name {
  color: #FCDC1E;
  font-size: 1.2rem;
  font-weight: 700;
  flex: 1;
}

.service-price-badge {
  padding: 6px 12px;
  background: rgba(252, 220, 30, 0.2);
  color: #FCDC1E;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  border: 1px solid rgba(252, 220, 30, 0.4);
  white-space: nowrap;
}

.service-price-badge.price-free {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border-color: rgba(76, 175, 80, 0.4);
}

.service-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.5;
}

.service-header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.service-type-badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  background: rgba(100, 150, 255, 0.15);
  color: #8ab4ff;
  border: 1px solid rgba(100, 150, 255, 0.3);
  font-weight: 600;
  width: fit-content;
}

.service-specific-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.specific-detail-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.06);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.specific-key {
  color: rgba(255,255,255,0.6);
}

.specific-val {
  color: #fff;
  font-weight: 600;
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
.btn-type-commande, .btn-type-default {
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

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.contact-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.contact-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.contact-value {
  color: #FCDC1E;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.contact-value:hover {
  color: #fff176;
  text-decoration: underline;
}

.link-external::after {
  content: ' ↗';
  font-size: 0.8rem;
}

.location-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin-bottom: 16px;
}

.btn-map {
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
}

.btn-map:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(252, 220, 30, 0.4);
}

.btn-back {
  display: inline-block;
  padding: 12px 24px;
  background: rgba(252, 220, 30, 0.2);
  color: #FCDC1E;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  border: 1px solid rgba(252, 220, 30, 0.4);
  transition: background 0.2s ease;
}

.btn-back:hover {
  background: rgba(252, 220, 30, 0.3);
}

/* ========== STYLES AVIS / NOTES ========== */
.avis-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
}

.avis-note-moyenne {
  min-width: 180px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(252, 220, 30, 0.3);
  text-align: center;
}

.note-moyenne-val {
  font-size: 2.4rem;
  font-weight: 900;
  color: #FCDC1E;
  margin-bottom: 4px;
}

.note-moyenne-stars .star {
  color: rgba(255, 255, 255, 0.2);
  font-size: 1.3rem;
}

.note-moyenne-stars .star.filled {
  color: #FCDC1E;
}

.note-moyenne-meta {
  margin-top: 6px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.75);
}

.avis-repartition {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.avis-repartition-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avis-repartition-label {
  width: 32px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.avis-repartition-bar {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.avis-repartition-fill {
  height: 100%;
  background: linear-gradient(90deg, #FCDC1E 0%, #ffe676 100%);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.avis-repartition-count {
  width: 30px;
  text-align: right;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.empty-avis {
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.8);
}


/* Liste des avis */
.avis-list {
  margin-top: 24px;
}

.avis-list-title {
  font-size: 1.2rem;
  color: #FCDC1E;
  margin-bottom: 12px;
}

.avis-item {
  padding: 14px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.avis-item:first-of-type {
  border-top: none;
}

.avis-item-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.avis-stars .star {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.25);
}

.avis-stars .star.filled {
  color: #FCDC1E;
}

.avis-date {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.avis-commentaire {
  margin-top: 6px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
}

.description-content {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.7;
}

.description-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 16px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.description-content :deep(p) {
  margin-bottom: 14px;
}

.description-content :deep(h1),
.description-content :deep(h2),
.description-content :deep(h3) {
  color: #FCDC1E;
  margin: 20px 0 12px;
  font-weight: 700;
}

.description-content :deep(h1) {
  font-size: 1.8rem;
}

.description-content :deep(h2) {
  font-size: 1.5rem;
}

.description-content :deep(h3) {
  font-size: 1.2rem;
}

.description-content :deep(ul),
.description-content :deep(ol) {
  margin-left: 28px;
  margin-bottom: 14px;
}

.description-content :deep(li) {
  margin-bottom: 6px;
}

.description-content :deep(a) {
  color: #FCDC1E;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.description-content :deep(a:hover) {
  color: #fff176;
}

.description-content :deep(blockquote) {
  border-left: 4px solid #FCDC1E;
  padding-left: 16px;
  margin: 16px 0;
  font-style: italic;
  color: rgba(255, 255, 255, 0.8);
}

.description-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.description-content :deep(th),
.description-content :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px;
  text-align: left;
}

.description-content :deep(th) {
  background: rgba(252, 220, 30, 0.1);
  color: #FCDC1E;
}

/* Section de réservation mise en avant */
.reservation-highlight-section {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.18) 0%, rgba(252, 220, 30, 0.08) 100%) !important;
  border: 2px solid rgba(252, 220, 30, 0.45) !important;
  position: relative;
  overflow: hidden;
}

.reservation-highlight-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 200%;
  background: radial-gradient(circle, rgba(252, 220, 30, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

.reservation-highlight {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  position: relative;
  z-index: 1;
}

.reservation-highlight-content {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  min-width: 280px;
}

.reservation-highlight-icon {
  font-size: 3.5rem;
  flex-shrink: 0;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.reservation-highlight-text h2 {
  color: #FCDC1E;
  font-size: 1.6rem;
  margin-bottom: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.reservation-highlight-text p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 0;
}

.reservation-highlight-text strong {
  color: #FCDC1E;
  font-weight: 800;
}

.btn-reserve-large {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 18px 36px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 900;
  font-size: 1.15rem;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(252, 220, 30, 0.4);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-reserve-large:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(252, 220, 30, 0.55);
}

.btn-reserve-large span {
  font-size: 1.3rem;
}

/* Responsive */
@media (max-width: 768px) {
  .prestataire-main-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .prestataire-image-large {
    width: 120px;
    height: 120px;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }

  .detail-section {
    padding: 20px;
  }

  /* Responsive Reservation Highlight */
  .reservation-highlight {
    flex-direction: column;
    text-align: center;
  }

  .reservation-highlight-content {
    flex-direction: column;
    text-align: center;
  }

  .reservation-highlight-icon {
    font-size: 3rem;
  }

  .reservation-highlight-text h2 {
    font-size: 1.4rem;
  }

  .btn-reserve-large {
    width: 100%;
    justify-content: center;
    padding: 16px 28px;
    font-size: 1.05rem;
  }
}
</style>
