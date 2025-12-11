<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authUser = ref(null)
const prestataireInfo = ref(null)
const loading = ref(true)
const selectedSection = ref('presentation') // 'presentation' | 'services' | 'config' | 'user'
const presentationText = ref('') // contenu texte simple
const services = ref([]) // services modifiables
const userFields = ref({ email: '', tel: '', site: '' })

const loadAuthFromStorage = () => {
  try {
    const raw = localStorage.getItem('authUser')
    authUser.value = raw ? JSON.parse(raw) : null
  } catch (e) {
    authUser.value = null
  }
}

const isPrestataire = computed(() => authUser.value?.role === 'prestataire')
const prestataireNom = computed(() => authUser.value?.prestataireNom || '')

const loadPrestataireInfo = async () => {
  if (!isPrestataire.value || !prestataireNom.value) {
    prestataireInfo.value = null
    loading.value = false
    return
  }

  try {
    const customRaw = localStorage.getItem('customPrestataires')
    let customPrestataires = null
    if (customRaw) {
      try {
        customPrestataires = JSON.parse(customRaw)
      } catch (e) {
        // ignore
      }
    }

    const resp = await fetch('/data/site.json', { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    const prestataires = data.prestataires || []

    let prestataire = prestataires.find(p => p.nom === prestataireNom.value) || null

    // Appliquer les modifications locales si elles existent
    if (prestataire) {
      const local = customPrestataires && customPrestataires[prestataireNom.value] ? customPrestataires[prestataireNom.value] : {}
      // merge shallow
      prestataire = { ...prestataire, ...local }
    }

    prestataireInfo.value = prestataire

    // initialiser les éditeurs/structures
    // Extraire le texte brut depuis HTML si nécessaire
    const htmlContent = prestataire?.presentationHtml || prestataire?.description || ''
    // Nettoyer le HTML pour obtenir du texte brut
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    presentationText.value = tempDiv.textContent || tempDiv.innerText || ''
    // services: enrichir avec flags si absent
    services.value = (prestataire?.services || []).map(s => ({
      nom: s.nom || '',
      description: s.description || '',
      prix: s.prix !== undefined ? s.prix : 0,
      enabled: s.enabled !== undefined ? s.enabled : true,
      public: s.public !== undefined ? s.public : true,
    }))
    userFields.value = {
      email: prestataire?.email || '',
      tel: prestataire?.tel || '',
      site: prestataire?.site || ''
    }
  } catch (e) {
    prestataireInfo.value = null
  } finally {
    loading.value = false
  }
}

const saveCustomPrestataire = () => {
  if (!prestataireNom.value) return
  let custom = {}
  try {
    const raw = localStorage.getItem('customPrestataires')
    custom = raw ? JSON.parse(raw) : {}
  } catch (e) {
    custom = {}
  }
  custom[prestataireNom.value] = {
    // utiliser la présentation comme description affichée dans les listes publiques
    description: presentationText.value,
    presentationHtml: presentationText.value,
    services: services.value,
    email: userFields.value.email,
    tel: userFields.value.tel,
    site: userFields.value.site
  }
  localStorage.setItem('customPrestataires', JSON.stringify(custom))
  window.dispatchEvent(new Event('prestataire-updated'))
}


const addService = () => {
  services.value.push({ nom: 'Nouvelle offre', description: '', prix: 0, enabled: true, public: true })
  saveCustomPrestataire()
}

const deleteService = (index) => {
  services.value.splice(index, 1)
  saveCustomPrestataire()
}

const toggleServiceEnabled = (s) => {
  s.enabled = !s.enabled
  saveCustomPrestataire()
}

const toggleServicePublic = (s) => {
  s.public = !s.public
  saveCustomPrestataire()
}

const updateServiceField = () => {
  // appelé via @input sur champs : autosave
  saveCustomPrestataire()
}

const savePresentation = () => {
  saveCustomPrestataire()
  // petite confirmation visuelle (peut être remplacée par toast)
  alert('Présentation sauvegardée.')
}

const saveUserFields = () => {
  saveCustomPrestataire()
  alert('Informations utilisateur sauvegardées.')
}

const formatPrix = (val) => {
  if (val === 0) return 'Gratuit'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val)
}

onMounted(() => {
  loadAuthFromStorage()

  if (!isPrestataire.value) {
    router.push('/login')
    return
  }

  loadPrestataireInfo()
  // notifier parent/sidebar que prestataire chargé (optionnel)
})
</script>

<template>
  <div class="prestataire-page">
    <div v-if="loading" class="loading">
      Chargement...
    </div>

    <div v-else-if="!isPrestataire" class="access-denied">
      <h2>Accès restreint</h2>
      <p>Vous devez être connecté en tant que prestataire pour accéder à cette page.</p>
      <router-link to="/login" class="btn-primary">Se connecter</router-link>
    </div>

    <div v-else-if="prestataireInfo" class="prestataire-content">
      <div class="prestataire-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Espace Prestataire</h1>
            <p class="welcome">Bienvenue, <strong>{{ prestataireNom }}</strong></p>
            <p class="prestataire-type">{{ prestataireInfo.type }}</p>
          </div>
          <div v-if="prestataireInfo.image" class="header-image">
            <img :src="prestataireInfo.image" :alt="prestataireNom" />
          </div>
        </div>
      </div>

      <!-- two-column layout: menu + content -->
      <div class="admin-layout">
        <aside class="side-menu">
          <ul>
            <li :class="{ active: selectedSection === 'presentation' }" @click="selectedSection = 'presentation'">
              <span class="menu-icon">📝</span>
              <span>Présentation</span>
            </li>
            <li :class="{ active: selectedSection === 'services' }" @click="selectedSection = 'services'">
              <span class="menu-icon">🛠️</span>
              <span>Services</span>
            </li>
            <li :class="{ active: selectedSection === 'config' }" @click="selectedSection = 'config'">
              <span class="menu-icon">⚙️</span>
              <span>Configuration</span>
            </li>
            <li :class="{ active: selectedSection === 'user' }" @click="selectedSection = 'user'">
              <span class="menu-icon">👤</span>
              <span>Informations</span>
            </li>
          </ul>
        </aside>

        <section class="main-panel">
          <!-- Présentation -->
          <div v-if="selectedSection === 'presentation'" class="section-content">
            <div class="section-header">
              <h2>📝 Présentation</h2>
              <p class="section-description">Rédigez la présentation de votre prestataire visible sur le site.</p>
            </div>
            <div class="editor-actions">
              <button class="btn btn-primary" type="button" @click="savePresentation">
                💾 Sauvegarder
              </button>
            </div>

            <textarea 
              class="textarea presentation-textarea" 
              v-model="presentationText" 
              placeholder="Décrivez votre prestataire..."
              rows="12"
            ></textarea>
          </div>

          <!-- Services -->
          <div v-if="selectedSection === 'services'" class="section-content">
            <div class="section-header">
              <h2>🛠️ Services</h2>
              <p class="section-description">Gérez vos services : ajoutez, modifiez, activez ou désactivez-les.</p>
            </div>
            <div class="services-actions">
              <button class="btn btn-primary" @click="addService">
                ➕ Ajouter un service
              </button>
            </div>
            <div class="services-grid" v-if="services.length">
              <div class="service-card" v-for="(s, idx) in services" :key="idx">
                <div class="service-card-header">
                  <input class="input input-title" v-model="s.nom" @input="updateServiceField" placeholder="Nom du service" />
                  <button class="btn btn-danger btn-icon" @click="deleteService(idx)" title="Supprimer">
                    🗑️
                  </button>
                </div>
                <textarea class="textarea" v-model="s.description" @input="updateServiceField" placeholder="Description du service"></textarea>
                <div class="service-price-row">
                  <label class="price-label">
                    💰 Prix (€)
                    <input 
                      type="number" 
                      class="input input-price" 
                      v-model.number="s.prix" 
                      @input="updateServiceField" 
                      placeholder="0" 
                      min="0"
                      step="0.01"
                    />
                  </label>
                  <span v-if="s.prix > 0" class="price-display">{{ formatPrix(s.prix) }}</span>
                  <span v-else class="price-display free">Gratuit</span>
                </div>
                <div class="service-toggles">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="s.enabled" @change="toggleServiceEnabled(s)" />
                    <span :class="{ active: s.enabled }">✅ Activé</span>
                  </label>
                  <label class="toggle-label">
                    <input type="checkbox" v-model="s.public" @change="toggleServicePublic(s)" />
                    <span :class="{ active: s.public }">🌐 Public</span>
                  </label>
                </div>
              </div>
            </div>
            <div v-if="!services.length" class="empty-state">
              <p>📭 Aucun service défini.</p>
              <p class="empty-hint">Cliquez sur "Ajouter un service" pour commencer.</p>
            </div>
          </div>

          <!-- Configuration -->
          <div v-if="selectedSection === 'config'" class="section-content">
            <div class="section-header">
              <h2>⚙️ Configuration</h2>
              <p class="section-description">Paramètres globaux pour la configuration automatique d'emplacements ou règles de visibilité.</p>
            </div>
            <div class="config-grid">
              <div class="config-item">
                <label>Assignation automatique d'emplacement</label>
                <select class="input">
                  <option>Non</option>
                  <option>Basée sur nom</option>
                  <option>Basée sur catégorie</option>
                </select>
              </div>
              <div class="config-item">
                <label>Visibilité par défaut</label>
                <select class="input">
                  <option>Public</option>
                  <option>Privé (prestataire seulement)</option>
                </select>
              </div>
              <div class="config-actions">
                <button class="btn btn-primary" @click="() => alert('Paramètres sauvegardés (simulation)')">
                  💾 Sauvegarder la configuration
                </button>
              </div>
            </div>
          </div>

          <!-- Informations utilisateur -->
          <div v-if="selectedSection === 'user'" class="section-content">
            <div class="section-header">
              <h2>👤 Informations utilisateur</h2>
              <p class="section-description">Mettez à jour vos coordonnées et informations de contact.</p>
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>📧 Email</label>
                <input class="input" type="email" v-model="userFields.email" placeholder="contact@exemple.com" />
              </div>
              <div class="form-row">
                <label>📞 Téléphone</label>
                <input class="input" type="tel" v-model="userFields.tel" placeholder="+33 1 23 45 67 89" />
              </div>
              <div class="form-row">
                <label>🌐 Site web</label>
                <input class="input" type="url" v-model="userFields.site" placeholder="https://exemple.com" />
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" @click="saveUserFields">
                💾 Sauvegarder les modifications
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="no-info">
      <h2>Informations indisponibles</h2>
      <p>Impossible de charger vos informations de prestataire.</p>
    </div>
  </div>
</template>

<style scoped>
.prestataire-page {
  min-height: calc(100vh - 64px);
  padding: 32px 24px;
  background: linear-gradient(180deg, #0b122a 0%, #07103a 100%);
  color: #fff;
}

/* header */
.prestataire-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid rgba(252,220,30,0.2);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-text {
  flex: 1;
}

.prestataire-header h1 { 
  color: #FCDC1E; 
  margin-bottom: 8px;
  font-size: 2.2rem;
  font-weight: 900;
}

.welcome { 
  color: rgba(255,255,255,0.95);
  font-size: 1.1rem;
  margin-bottom: 4px;
}

.welcome strong {
  color: #FCDC1E;
  font-weight: 700;
}

.prestataire-type {
  color: rgba(255,255,255,0.7);
  font-size: 0.95rem;
  padding: 4px 12px;
  background: rgba(252,220,30,0.15);
  border-radius: 20px;
  display: inline-block;
  border: 1px solid rgba(252,220,30,0.3);
}

.header-image {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  border: 3px solid #FCDC1E;
  box-shadow: 0 8px 24px rgba(252,220,30,0.3);
}

.header-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* layout */
.admin-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* side menu */
.side-menu {
  background: rgba(255,255,255,0.05);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(252,220,30,0.15);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  height: fit-content;
  position: sticky;
  top: 80px;
}

.side-menu ul { 
  list-style: none;
  margin: 0;
  padding: 0;
}

.side-menu li {
  padding: 14px 12px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 8px;
  color: #fff;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.side-menu li:hover {
  background: rgba(252,220,30,0.1);
  transform: translateX(4px);
}

.side-menu li.active {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #2046b3;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(252,220,30,0.3);
}

.menu-icon {
  font-size: 1.2rem;
}

/* main panel */
.main-panel {
  background: rgba(255,255,255,0.05);
  padding: 28px;
  border-radius: 16px;
  border: 1px solid rgba(252,220,30,0.15);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.section-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(252,220,30,0.2);
}

.section-header h2 {
  color: #FCDC1E;
  font-size: 1.8rem;
  margin-bottom: 8px;
  font-weight: 800;
}

.section-description {
  color: rgba(255,255,255,0.7);
  font-size: 0.95rem;
}

/* editor */
.editor-actions { 
  display:flex; 
  gap:10px; 
  margin-bottom:16px; 
  align-items:center; 
  justify-content: flex-end;
}

.btn { 
  background:#FCDC1E; 
  color:#2046b3; 
  border:none; 
  padding:10px 16px; 
  border-radius:10px; 
  cursor:pointer;
  font-weight: 700;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.btn:hover {
  background: #ffe676;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(252,220,30,0.4);
}

.btn-primary {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  box-shadow: 0 4px 12px rgba(252,220,30,0.3);
}

.btn-danger { 
  background:#d32f2f; 
  color:#fff;
}

.btn-danger:hover {
  background: #b71c1c;
}

.btn-small {
  padding: 6px 10px;
  font-size: 0.85rem;
}

.btn-icon {
  padding: 8px;
  min-width: 36px;
}

input.input, textarea.textarea, select.input { 
  width:100%; 
  padding:12px; 
  border-radius:10px; 
  border:1px solid rgba(255,255,255,0.15); 
  background:rgba(0,0,0,0.3); 
  color:#fff; 
  margin-top:8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

input.input:focus, textarea.textarea:focus, select.input:focus {
  outline: none;
  border-color: #FCDC1E;
  box-shadow: 0 0 0 3px rgba(252,220,30,0.1);
}

.input-title {
  font-weight: 700;
  font-size: 1.1rem;
}

.presentation-textarea {
  min-height: 300px;
  resize: vertical;
  line-height: 1.6;
}

/* services */
.services-actions {
  margin-bottom: 24px;
}

.services-grid {
  display: grid;
  gap: 16px;
}

.service-card { 
  background: rgba(0,0,0,0.2); 
  padding:20px; 
  border-radius:12px; 
  border: 1px solid rgba(252,220,30,0.15);
  transition: all 0.2s ease;
}

.service-card:hover {
  border-color: rgba(252,220,30,0.3);
  box-shadow: 0 4px 12px rgba(252,220,30,0.1);
}

.service-card-header { 
  display:flex; 
  justify-content:space-between; 
  gap:12px; 
  align-items:center;
  margin-bottom: 12px;
}

.service-price-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding: 12px;
  background: rgba(252,220,30,0.1);
  border-radius: 8px;
  border: 1px solid rgba(252,220,30,0.2);
}

.price-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  color: #FCDC1E;
  font-weight: 600;
  font-size: 0.9rem;
}

.input-price {
  max-width: 150px;
  margin-top: 0;
}

.price-display {
  font-size: 1.2rem;
  font-weight: 700;
  color: #FCDC1E;
  padding: 8px 16px;
  background: rgba(252,220,30,0.15);
  border-radius: 8px;
  border: 1px solid rgba(252,220,30,0.3);
}

.price-display.free {
  color: #4caf50;
  background: rgba(76,175,80,0.15);
  border-color: rgba(76,175,80,0.3);
}

.service-toggles {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.8);
}

.toggle-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #FCDC1E;
}

.toggle-label span.active {
  color: #FCDC1E;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: rgba(255,255,255,0.6);
}

.empty-state p {
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.empty-hint {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.5);
}

/* form */
.form-grid {
  display: grid;
  gap: 20px;
  margin-bottom: 24px;
}

.form-row { 
  margin-bottom: 0;
}

.form-row label {
  display: block;
  color: #FCDC1E;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-actions { 
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(252,220,30,0.2);
}

/* config */
.config-grid {
  display: grid;
  gap: 20px;
}

.config-item {
  margin-bottom: 0;
}

.config-item label {
  display: block;
  color: #FCDC1E;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.config-actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(252,220,30,0.2);
}

/* loading and errors */
.loading, .access-denied, .no-info {
  text-align: center;
  padding: 60px 24px;
  color: #FCDC1E;
}

.access-denied h2, .no-info h2 {
  margin-bottom: 16px;
  font-size: 1.8rem;
}

.btn-primary {
  display: inline-block;
  margin-top: 16px;
  padding: 12px 24px;
  text-decoration: none;
}

/* responsive */
@media (max-width: 900px) {
  .admin-layout { 
    grid-template-columns: 1fr; 
  }
  
  .side-menu { 
    order: 2;
    position: relative;
    top: 0;
  }
  
  .main-panel { 
    order: 1; 
    margin-bottom: 20px;
    padding: 20px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-image {
    width: 100px;
    height: 100px;
  }

  .prestataire-header h1 {
    font-size: 1.8rem;
  }
}
</style>
