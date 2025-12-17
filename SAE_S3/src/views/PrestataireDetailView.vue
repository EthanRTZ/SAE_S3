<template>
  <div class="prestataire-detail-page">
    <div v-if="loading" class="loading-container">
      <p>Chargement...</p>
    </div>
    
    <div v-else-if="!prestataire" class="error-container">
      <h2>Prestataire introuvable</h2>
      <p>Le prestataire demandé n'existe pas.</p>
      <router-link to="/prestataire" class="btn-back">Retour à la liste</router-link>
    </div>

    <div v-else class="detail-container">
      <!-- Header avec image -->
      <div class="detail-header">
        <div class="header-background" :style="{ backgroundImage: prestataire.image ? `url(${prestataire.image})` : 'none' }"></div>
        <div class="header-overlay"></div>
        <div class="header-content">
          <router-link to="/prestataire" class="btn-back-header">
            ← Retour
          </router-link>
          <div class="prestataire-main-info">
            <div v-if="prestataire.image" class="prestataire-image-wrapper">
              <img :src="prestataire.image" :alt="prestataire.nom" class="prestataire-image-large" @error="handleImageError" />
            </div>
            <div class="prestataire-title-section">
              <h1 class="prestataire-title">{{ prestataire.nom }}</h1>
              <span class="prestataire-type-badge">{{ prestataire.type }}</span>
              <p class="prestataire-description-header">{{ cleanHtml(prestataire.description) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="detail-content">
        <!-- Services -->
        <section v-if="publicServices.length > 0" class="detail-section">
          <h2 class="section-title">Services</h2>
          <div class="services-grid">
            <div v-for="service in publicServices" :key="service.nom" class="service-card">
              <div class="service-header">
                <h3 class="service-name">{{ service.nom }}</h3>
                <span class="service-price-badge" :class="{ 'price-free': (service.prix || 0) === 0 }">
                  {{ formatServicePrix(service.prix) }}
                </span>
              </div>
              <p v-if="service.description" class="service-description">{{ service.description }}</p>
            </div>
          </div>
        </section>

        <!-- Informations de contact -->
        <section class="detail-section">
          <h2 class="section-title">Informations de contact</h2>
          <div class="contact-info">
            <div v-if="prestataire.email" class="contact-item">
              <span class="contact-icon">📧</span>
              <div class="contact-details">
                <span class="contact-label">Email</span>
                <a :href="`mailto:${prestataire.email}`" class="contact-value">{{ prestataire.email }}</a>
              </div>
            </div>
            <div v-if="prestataire.tel" class="contact-item">
              <span class="contact-icon">📞</span>
              <div class="contact-details">
                <span class="contact-label">Téléphone</span>
                <a :href="`tel:${prestataire.tel}`" class="contact-value">{{ prestataire.tel }}</a>
              </div>
            </div>
            <div v-if="prestataire.site" class="contact-item">
              <span class="contact-icon">🌐</span>
              <div class="contact-details">
                <span class="contact-label">Site web</span>
                <a :href="prestataire.site" target="_blank" rel="noopener" class="contact-value link-external">{{ prestataire.site }}</a>
              </div>
            </div>
          </div>
        </section>

        <!-- Localisation sur la carte -->
        <section v-if="prestataire.coordone" class="detail-section">
          <h2 class="section-title">Localisation</h2>
          <p class="location-text">Ce prestataire est présent sur le site du festival.</p>
          <router-link to="/carte" class="btn-map">
            🗺️ Voir sur la carte
          </router-link>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const prestataire = ref(null)
const loading = ref(true)

const publicServices = computed(() => {
  if (!prestataire.value || !prestataire.value.services) return []
  return prestataire.value.services.filter(s => s.public !== false)
})

const loadPrestataire = async () => {
  loading.value = true
  try {
    const prestataireNom = decodeURIComponent(route.params.nom)
    
    // Charger les modifications locales
    const customRaw = localStorage.getItem('customPrestataires')
    let customPrestataires = null
    if (customRaw) {
      try {
        customPrestataires = JSON.parse(customRaw)
      } catch (e) {
        // ignore
      }
    }

    // Charger depuis le fichier JSON
    const response = await fetch('/data/site.json', { cache: 'no-store' })
    if (!response.ok) throw new Error('fetch failed')
    const data = await response.json()
    const prestataires = data.prestataires || []
    
    // Trouver le prestataire
    let found = prestataires.find(p => p.nom === prestataireNom)
    
    // Appliquer les modifications locales si elles existent
    if (found && customPrestataires && customPrestataires[prestataireNom]) {
      found = { ...found, ...customPrestataires[prestataireNom] }
    }

    prestataire.value = found || null
  } catch (error) {
    console.error('Erreur lors du chargement du prestataire:', error)
    prestataire.value = null
  } finally {
    loading.value = false
  }
}

const formatServicePrix = (prix) => {
  if (prix === undefined || prix === null) return 'Gratuit'
  if (prix === 0) return 'Gratuit'
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

onMounted(() => {
  loadPrestataire()
  
  // Écouter les mises à jour
  const updateHandler = () => loadPrestataire()
  window.addEventListener('prestataire-updated', updateHandler)
  window.addEventListener('storage', (e) => {
    if (e.key === 'customPrestataires') {
      loadPrestataire()
    }
  })
  
  return () => {
    window.removeEventListener('prestataire-updated', updateHandler)
  }
})
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
}
</style>

