<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authUser = ref(null)
const loading = ref(true)
const currentSection = ref('dashboard')
const prestataires = ref([])
const selectedPrestataire = ref(null)
const users = ref([])

// Données de présentation du festival (éditeur WYSIWYG)
const festivalPresentation = ref({
  titre: 'Golden Coast Festival 2024',
  description: '<p>Le plus grand festival de musique électronique de la côte.</p>',
  images: ['/media/festival-banner.jpg']
})

const stats = ref({
  totalUsers: 0,
  totalPrestataires: 0,
  totalReservations: 0,
  totalServices: 0
})

const loadAuthFromStorage = () => {
  try {
    const raw = localStorage.getItem('authUser')
    authUser.value = raw ? JSON.parse(raw) : null
  } catch (e) {
    authUser.value = null
  }
}

const isAdmin = computed(() => authUser.value?.role === 'admin')
const adminEmail = computed(() => authUser.value?.email || '')

const loadData = async () => {
  if (!isAdmin.value) {
    loading.value = false
    return
  }

  try {
    const [usersResp, prestatairesResp] = await Promise.all([
      fetch('/data/users.json', { cache: 'no-store' }),
      fetch('/data/site.json', { cache: 'no-store' })
    ])

    const usersData = usersResp.ok ? await usersResp.json() : []
    const prestataireData = prestatairesResp.ok ? await prestatairesResp.json() : { prestataires: [] }

    users.value = Array.isArray(usersData) ? usersData : []
    prestataires.value = prestataireData.prestataires || []

    const totalServices = prestataires.value.reduce((acc, p) => acc + (p.services?.length || 0), 0)

    stats.value = {
      totalUsers: users.value.length,
      totalPrestataires: prestataires.value.length,
      totalReservations: 0,
      totalServices
    }

    // Charger présentation personnalisée si elle existe
    const savedPresentation = localStorage.getItem('festivalPresentation')
    if (savedPresentation) {
      try {
        festivalPresentation.value = JSON.parse(savedPresentation)
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    console.error('Erreur chargement données:', e)
  } finally {
    loading.value = false
  }
}

const changeSection = (section) => {
  currentSection.value = section
  selectedPrestataire.value = null
}

const selectPrestataire = (prestataire) => {
  selectedPrestataire.value = { ...prestataire }
  currentSection.value = 'prestataire-detail'
}

const savePresentation = () => {
  localStorage.setItem('festivalPresentation', JSON.stringify(festivalPresentation.value))
  alert('Présentation sauvegardée avec succès!')
}

const savePrestataireChanges = () => {
  if (!selectedPrestataire.value) return

  const index = prestataires.value.findIndex(p => p.nom === selectedPrestataire.value.nom)
  if (index !== -1) {
    prestataires.value[index] = { ...selectedPrestataire.value }

    // Sauvegarder dans localStorage (simulation)
    const customPrestataires = JSON.parse(localStorage.getItem('customPrestataires') || '{}')
    customPrestataires[selectedPrestataire.value.nom] = selectedPrestataire.value
    localStorage.setItem('customPrestataires', JSON.stringify(customPrestataires))

    alert('Modifications sauvegardées!')
  }
}

const toggleService = (serviceIndex) => {
  if (!selectedPrestataire.value?.services) return
  const service = selectedPrestataire.value.services[serviceIndex]
  service.actif = !service.actif
}

const deleteService = (serviceIndex) => {
  if (!selectedPrestataire.value?.services) return
  if (confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
    selectedPrestataire.value.services.splice(serviceIndex, 1)
  }
}

const addService = () => {
  if (!selectedPrestataire.value?.services) {
    selectedPrestataire.value.services = []
  }
  selectedPrestataire.value.services.push({
    nom: 'Nouveau service',
    description: 'Description du service',
    actif: true
  })
}

onMounted(() => {
  loadAuthFromStorage()

  if (!isAdmin.value) {
    router.push('/login')
    return
  }

  loadData()
})
</script>

<template>
  <div class="admin-page">
    <div v-if="loading" class="loading">
      Chargement du tableau de bord...
    </div>

    <div v-else-if="!isAdmin" class="access-denied">
      <h2>Accès restreint</h2>
      <p>Vous devez être connecté en tant qu'administrateur pour accéder à cette page.</p>
      <router-link to="/login" class="btn-primary">Se connecter</router-link>
    </div>

    <div v-else class="admin-layout">
      <!-- Menu latéral -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h2>Admin Panel</h2>
          <p class="admin-email">{{ adminEmail }}</p>
        </div>

        <nav class="sidebar-nav">
          <button
            @click="changeSection('dashboard')"
            :class="['nav-item', { active: currentSection === 'dashboard' }]"
          >
            📊 Tableau de bord
          </button>
          <button
            @click="changeSection('presentation')"
            :class="['nav-item', { active: currentSection === 'presentation' }]"
          >
            📝 Présentation festival
          </button>
          <button
            @click="changeSection('carte')"
            :class="['nav-item', { active: currentSection === 'carte' }]"
          >
            🗺️ Carte interactive
          </button>
          <button
            @click="changeSection('prestataires')"
            :class="['nav-item', { active: currentSection === 'prestataires' }]"
          >
            🏢 Gestion prestataires
          </button>
          <button
            @click="changeSection('statistiques')"
            :class="['nav-item', { active: currentSection === 'statistiques' }]"
          >
            📈 Statistiques
          </button>
        </nav>
      </aside>

      <!-- Contenu principal -->
      <main class="admin-main">
        <!-- Dashboard -->
        <div v-if="currentSection === 'dashboard'" class="section-content">
          <h1 class="section-title">Tableau de bord</h1>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalUsers }}</div>
                <div class="stat-label">Utilisateurs</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🏢</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalPrestataires }}</div>
                <div class="stat-label">Prestataires</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🛠️</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalServices }}</div>
                <div class="stat-label">Services</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalReservations }}</div>
                <div class="stat-label">Réservations</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Présentation Festival (WYSIWYG) -->
        <div v-if="currentSection === 'presentation'" class="section-content">
          <h1 class="section-title">Présentation du festival</h1>

          <div class="editor-container">
            <div class="form-group">
              <label>Titre du festival</label>
              <input
                v-model="festivalPresentation.titre"
                type="text"
                class="form-input"
                placeholder="Titre du festival"
              />
            </div>

            <div class="form-group">
              <label>Description (HTML)</label>
              <textarea
                v-model="festivalPresentation.description"
                class="form-textarea"
                rows="10"
                placeholder="Description HTML du festival..."
              ></textarea>
              <p class="form-hint">Utilisez des balises HTML pour formater le texte</p>
            </div>

            <div class="form-group">
              <label>Aperçu</label>
              <div class="preview-box" v-html="festivalPresentation.description"></div>
            </div>

            <button @click="savePresentation" class="btn-save">
              💾 Sauvegarder les modifications
            </button>
          </div>
        </div>

        <!-- Carte Interactive -->
        <div v-if="currentSection === 'carte'" class="section-content">
          <h1 class="section-title">Configuration de la carte</h1>

          <div class="carte-config">
            <p class="info-text">
              Associez automatiquement les emplacements aux prestataires sur la carte interactive.
            </p>

            <div class="prestataires-map-list">
              <div
                v-for="(prestataire, index) in prestataires"
                :key="prestataire.nom"
                class="map-item"
              >
                <div class="map-item-info">
                  <strong>{{ prestataire.nom }}</strong>
                  <span class="map-type">{{ prestataire.type }}</span>
                </div>
                <div class="map-item-location">
                  <label>Position:</label>
                  <select class="location-select">
                    <option>Zone A - Stand {{ index + 1 }}</option>
                    <option>Zone B - Stand {{ index + 1 }}</option>
                    <option>Zone C - Stand {{ index + 1 }}</option>
                  </select>
                </div>
              </div>
            </div>

            <button class="btn-save">
              🗺️ Mettre à jour la carte
            </button>
          </div>
        </div>

        <!-- Gestion Prestataires -->
        <div v-if="currentSection === 'prestataires'" class="section-content">
          <h1 class="section-title">Gestion des prestataires</h1>

          <div class="prestataires-list">
            <div
              v-for="prestataire in prestataires"
              :key="prestataire.nom"
              class="prestataire-item"
              @click="selectPrestataire(prestataire)"
            >
              <img
                v-if="prestataire.image"
                :src="prestataire.image"
                :alt="prestataire.nom"
                class="prestataire-thumb"
              />
              <div class="prestataire-info">
                <h3>{{ prestataire.nom }}</h3>
                <p>{{ prestataire.type }}</p>
                <span class="services-count">{{ prestataire.services?.length || 0 }} service(s)</span>
              </div>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>

        <!-- Détail Prestataire -->
        <div v-if="currentSection === 'prestataire-detail' && selectedPrestataire" class="section-content">
          <div class="section-header">
            <button @click="changeSection('prestataires')" class="btn-back">← Retour</button>
            <h1 class="section-title">{{ selectedPrestataire.nom }}</h1>
          </div>

          <div class="prestataire-editor">
            <div class="form-group">
              <label>Nom du prestataire</label>
              <input
                v-model="selectedPrestataire.nom"
                type="text"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Type</label>
              <input
                v-model="selectedPrestataire.type"
                type="text"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Description (HTML)</label>
              <textarea
                v-model="selectedPrestataire.description"
                class="form-textarea"
                rows="6"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Aperçu de la description</label>
              <div class="preview-box" v-html="selectedPrestataire.description"></div>
            </div>

            <div class="form-group">
              <label>Image (URL)</label>
              <input
                v-model="selectedPrestataire.image"
                type="text"
                class="form-input"
              />
            </div>

            <div class="services-section">
              <div class="services-header">
                <h2>Services</h2>
                <button @click="addService" class="btn-add">+ Ajouter un service</button>
              </div>

              <div
                v-for="(service, index) in selectedPrestataire.services"
                :key="index"
                class="service-item"
              >
                <div class="service-content">
                  <input
                    v-model="service.nom"
                    type="text"
                    class="form-input"
                    placeholder="Nom du service"
                  />
                  <textarea
                    v-model="service.description"
                    class="form-textarea"
                    rows="2"
                    placeholder="Description du service"
                  ></textarea>
                </div>
                <div class="service-actions">
                  <button
                    @click="toggleService(index)"
                    :class="['btn-toggle', { active: service.actif !== false }]"
                  >
                    {{ service.actif !== false ? '✓ Actif' : '✗ Inactif' }}
                  </button>
                  <button @click="deleteService(index)" class="btn-delete">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            </div>

            <button @click="savePrestataireChanges" class="btn-save">
              💾 Sauvegarder toutes les modifications
            </button>
          </div>
        </div>

        <!-- Statistiques -->
        <div v-if="currentSection === 'statistiques'" class="section-content">
          <h1 class="section-title">Statistiques des services</h1>

          <div class="stats-charts">
            <div class="chart-card">
              <h3>Services par prestataire</h3>
              <div class="chart-bars">
                <div
                  v-for="prestataire in prestataires"
                  :key="prestataire.nom"
                  class="chart-bar-item"
                >
                  <span class="bar-label">{{ prestataire.nom }}</span>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{ width: ((prestataire.services?.length || 0) * 20) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-value">{{ prestataire.services?.length || 0 }}</span>
                </div>
              </div>
            </div>

            <div class="chart-card">
              <h3>Répartition par type</h3>
              <div class="type-stats">
                <div
                  v-for="(count, type) in prestataires.reduce((acc, p) => {
                    acc[p.type] = (acc[p.type] || 0) + 1
                    return acc
                  }, {})"
                  :key="type"
                  class="type-stat-item"
                >
                  <strong>{{ type }}</strong>
                  <span class="type-count">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0b122a 0%, #07103a 100%);
  color: #fff;
}

.loading,
.access-denied {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 80px 20px;
}

.access-denied h2 {
  color: #FCDC1E;
  margin-bottom: 16px;
}

.btn-primary {
  display: inline-block;
  margin-top: 20px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  transition: transform 0.12s ease;
}

.admin-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.admin-sidebar {
  width: 280px;
  background: rgba(0, 0, 0, 0.3);
  border-right: 1px solid rgba(252, 220, 30, 0.15);
  padding: 30px 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 0 24px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 24px;
}

.sidebar-header h2 {
  color: #FCDC1E;
  margin-bottom: 8px;
  font-size: 1.5rem;
}

.admin-email {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 16px 24px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(252, 220, 30, 0.05);
  color: #FCDC1E;
}

.nav-item.active {
  background: rgba(252, 220, 30, 0.1);
  color: #FCDC1E;
  border-left-color: #FCDC1E;
  font-weight: 600;
}

/* Main content */
.admin-main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.section-content {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  color: #FCDC1E;
  font-size: 2rem;
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(252, 220, 30, 0.3);
  color: #FCDC1E;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: rgba(252, 220, 30, 0.15);
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(252, 220, 30, 0.1);
  border-radius: 12px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #FCDC1E;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

/* Forms */
.editor-container,
.carte-config,
.prestataire-editor {
  background: rgba(255, 255, 255, 0.05);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  color: #FCDC1E;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-input,
.form-textarea,
.location-select {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 1rem;
}

.form-input:focus,
.form-textarea:focus,
.location-select:focus {
  outline: none;
  border-color: #FCDC1E;
}

.form-hint {
  margin-top: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.preview-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  min-height: 100px;
}

.btn-save {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  padding: 14px 28px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
}

.btn-save:hover {
  transform: translateY(-2px);
}

/* Prestataires list */
.prestataires-list {
  display: grid;
  gap: 16px;
}

.prestataire-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.prestataire-item:hover {
  background: rgba(252, 220, 30, 0.08);
  transform: translateX(4px);
}

.prestataire-thumb {
  width: 60px;
  height: 60px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 8px;
}

.prestataire-info {
  flex: 1;
}

.prestataire-info h3 {
  color: #FCDC1E;
  margin-bottom: 4px;
}

.prestataire-info p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.services-count {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.arrow {
  color: #FCDC1E;
  font-size: 1.5rem;
}

/* Services */
.services-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.services-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.services-header h2 {
  color: #FCDC1E;
  font-size: 1.4rem;
}

.btn-add {
  background: rgba(252, 220, 30, 0.15);
  border: 1px solid #FCDC1E;
  color: #FCDC1E;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-add:hover {
  background: rgba(252, 220, 30, 0.25);
}

.service-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.service-content {
  margin-bottom: 12px;
}

.service-content input,
.service-content textarea {
  margin-bottom: 8px;
}

.service-actions {
  display: flex;
  gap: 12px;
}

.btn-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-toggle.active {
  background: rgba(0, 255, 0, 0.15);
  border-color: #00ff00;
  color: #00ff00;
}

.btn-delete {
  background: rgba(255, 0, 0, 0.15);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: #ff6b6b;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: rgba(255, 0, 0, 0.25);
}

/* Carte */
.info-text {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
}

.prestataires-map-list {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.map-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.map-item-info strong {
  display: block;
  color: #FCDC1E;
  margin-bottom: 4px;
}

.map-type {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.map-item-location {
  display: flex;
  align-items: center;
  gap: 12px;
}

.map-item-location label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

/* Statistiques */
.stats-charts {
  display: grid;
  gap: 32px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.chart-card h3 {
  color: #FCDC1E;
  margin-bottom: 20px;
}

.chart-bars {
  display: grid;
  gap: 12px;
}

.chart-bar-item {
  display: grid;
  grid-template-columns: 150px 1fr 50px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-container {
  background: rgba(255, 255, 255, 0.1);
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  background: linear-gradient(90deg, #FCDC1E, #ffe676);
  height: 100%;
  transition: width 0.3s ease;
}

.bar-value {
  text-align: right;
  color: #FCDC1E;
  font-weight: 700;
}

.type-stats {
  display: grid;
  gap: 12px;
}

.type-stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.type-stat-item strong {
  color: rgba(255, 255, 255, 0.9);
}

.type-count {
  color: #FCDC1E;
  font-weight: 700;
  font-size: 1.1rem;
}

@media (max-width: 1024px) {
  .admin-sidebar {
    width: 220px;
  }

  .admin-main {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }

  .chart-bar-item {
    grid-template-columns: 1fr;
  }

  .map-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>