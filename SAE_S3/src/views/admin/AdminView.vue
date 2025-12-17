<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authUser = ref(null)
const loading = ref(true)
const currentSection = ref('dashboard')
const prestataires = ref([])
const prestatairesOriginaux = ref([]) // Données originales pour comparaison
const customPrestataires = ref({}) // Modifications locales
const selectedPrestataire = ref(null)
const users = ref([])

// Données de programmation
const programmation = ref({ stages: [], schedules: [] })
const programmationOriginaux = ref({ stages: [], schedules: [] })
const selectedDayIndex = ref(0)
const selectedStage = ref('')
const editingSlot = ref(null)

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
    const [usersResp, prestatairesResp, avisResp] = await Promise.all([
      fetch('/data/users.json', { cache: 'no-store' }),
      fetch('/data/site.json', { cache: 'no-store' }),
      fetch('/data/avis.json', { cache: 'no-store' })
    ])

    const usersData = usersResp.ok ? await usersResp.json() : []
    const prestataireData = prestatairesResp.ok ? await prestatairesResp.json() : { prestataires: [] }
    const avisData = avisResp.ok ? await avisResp.json() : {}

    users.value = Array.isArray(usersData) ? usersData : []

    // Filtrer uniquement les prestataires présents dans avis.json
    const prestatairesValides = Object.keys(avisData)
    const prestatairesFiltered = (prestataireData.prestataires || []).filter(p =>
      prestatairesValides.includes(p.nom)
    )

    prestatairesOriginaux.value = JSON.parse(JSON.stringify(prestatairesFiltered))

    // Charger les modifications locales
    const customRaw = localStorage.getItem('customPrestataires')
    if (customRaw) {
      try {
        customPrestataires.value = JSON.parse(customRaw)
      } catch (e) {
        customPrestataires.value = {}
      }
    }
    
    // Fusionner les données originales avec les modifications
    prestataires.value = prestatairesFiltered.map(p => {
      const custom = customPrestataires.value[p.nom]
      if (custom) {
        return { ...p, ...custom }
      }
      return p
    })

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

    // Charger la programmation
    await loadProgrammation()
  } catch (e) {
    console.error('Erreur chargement données:', e)
  } finally {
    loading.value = false
  }
}

const loadProgrammation = async () => {
  try {
    const resp = await fetch('/data/programmation.json', { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    programmationOriginaux.value = JSON.parse(JSON.stringify(data)) // Copie profonde
    
    // Charger les modifications locales
    const customRaw = localStorage.getItem('customProgrammation')
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw)
        // Fusionner avec les données originales
        programmation.value = {
          stages: custom.stages || data.stages || [],
          schedules: custom.schedules || data.schedules || []
        }
      } catch (e) {
        programmation.value = { ...data }
      }
    } else {
      programmation.value = { ...data }
    }
    
    if (programmation.value.stages.length > 0 && !selectedStage.value) {
      selectedStage.value = programmation.value.stages[0].name
    }
  } catch (e) {
    console.error('Erreur chargement programmation:', e)
    programmation.value = { stages: [], schedules: [] }
  }
}

const saveProgrammation = () => {
  localStorage.setItem('customProgrammation', JSON.stringify(programmation.value))
  window.dispatchEvent(new Event('programmation-updated'))
  alert('Programmation sauvegardée avec succès!')
}

const addSlot = (dayIndex, stageName) => {
  // S'assurer que le tableau schedules a assez d'éléments
  while (programmation.value.schedules.length <= dayIndex) {
    programmation.value.schedules.push({})
  }
  
  if (!programmation.value.schedules[dayIndex][stageName]) {
    programmation.value.schedules[dayIndex][stageName] = []
  }
  
  const newSlot = {
    start: '15:00',
    end: '16:00',
    artist: 'Nouvel artiste',
    style: 'Rap'
  }
  programmation.value.schedules[dayIndex][stageName].push(newSlot)
  editingSlot.value = { dayIndex, stageName, slotIndex: programmation.value.schedules[dayIndex][stageName].length - 1 }
}

const editSlot = (dayIndex, stageName, slotIndex) => {
  editingSlot.value = { dayIndex, stageName, slotIndex }
}

const deleteSlot = (dayIndex, stageName, slotIndex) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
    programmation.value.schedules[dayIndex][stageName].splice(slotIndex, 1)
    saveProgrammation()
  }
}

const saveSlot = () => {
  if (!editingSlot.value) return
  const { dayIndex, stageName, slotIndex } = editingSlot.value
  editingSlot.value = null
  saveProgrammation()
}

const cancelEdit = () => {
  editingSlot.value = null
  loadProgrammation() // Recharger pour annuler les modifications
}

const changeSection = (section) => {
  currentSection.value = section
  selectedPrestataire.value = null
}

const selectPrestataire = (prestataire) => {
  selectedPrestataire.value = { ...prestataire }
  currentSection.value = 'prestataire-detail'
}

// Vérifier si un prestataire a des modifications
const hasModifications = (prestataire) => {
  return !!customPrestataires.value[prestataire.nom]
}

// Obtenir les champs modifiés
const getModifiedFields = (prestataire) => {
  const original = prestatairesOriginaux.value.find(p => p.nom === prestataire.nom)
  if (!original) return []
  
  const custom = customPrestataires.value[prestataire.nom]
  if (!custom) return []
  
  const modified = []
  if (custom.description !== undefined && custom.description !== original.description) modified.push('Description')
  if (custom.email !== undefined && custom.email !== original.email) modified.push('Email')
  if (custom.tel !== undefined && custom.tel !== original.tel) modified.push('Téléphone')
  if (custom.site !== undefined && custom.site !== original.site) modified.push('Site web')
  if (custom.services && JSON.stringify(custom.services) !== JSON.stringify(original.services)) modified.push('Services')
  
  return modified
}

// Réinitialiser un prestataire (supprimer les modifications)
const resetPrestataire = () => {
  if (!selectedPrestataire.value) return
  if (!confirm('Êtes-vous sûr de vouloir réinitialiser ce prestataire ? Toutes les modifications locales seront supprimées.')) return
  
  delete customPrestataires.value[selectedPrestataire.value.nom]
  localStorage.setItem('customPrestataires', JSON.stringify(customPrestataires.value))
  
  // Recharger les données
  loadData().then(() => {
    // Remettre à jour le prestataire sélectionné avec les données originales
    const original = prestatairesOriginaux.value.find(p => p.nom === selectedPrestataire.value.nom)
    if (original) {
      selectedPrestataire.value = { ...original }
    }
    alert('Prestataire réinitialisé avec succès!')
  })
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

// =======================
// Stats avis par prestataire
// =======================
const avisStatsParPrestataire = ref([]) // [{ nom, moyenne, nbAvis, parNote, dernierAvis }]
const selectedPrestataireStats = ref(null)

const computeAvisStatsForPrestataires = async () => {
  try {
    // Charger avis depuis localStorage ou avis.json
    let allAvis = null
    const localRaw = localStorage.getItem('prestataireAvis')
    if (localRaw) {
      allAvis = JSON.parse(localRaw)
    } else {
      const resp = await fetch('/data/avis.json', { cache: 'no-store' }).catch(() => null)
      if (resp && resp.ok) {
        allAvis = await resp.json()
        localStorage.setItem('prestataireAvis', JSON.stringify(allAvis))
      } else {
        allAvis = {}
      }
    }

    const statsArray = prestataires.value.map((p) => {
      const entry = allAvis[p.nom] || { avis: [] }
      const avis = entry.avis || []
      const base = {
        nom: p.nom,
        moyenne: 0,
        nbAvis: avis.length,
        parNote: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        dernierAvis: null
      }

      if (!avis.length) return base

      let total = 0
      avis.forEach((a) => {
        const n = a.note || 0
        if (base.parNote[n] !== undefined) base.parNote[n]++
        total += n
      })
      base.moyenne = total / avis.length

      // dernier avis = le plus récent par date
      const sorted = avis
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      base.dernierAvis = sorted[sorted.length - 1] || null

      return base
    })

    avisStatsParPrestataire.value = statsArray
  } catch (e) {
    console.error('Erreur calcul stats avis prestataires', e)
    avisStatsParPrestataire.value = []
  }
}

const selectPrestataireStats = (item) => {
  selectedPrestataireStats.value = item
}

onMounted(() => {
  loadAuthFromStorage()

  if (!isAdmin.value) {
    router.push('/login')
    return
  }

  loadData().then(() => {
    // Une fois prestataires chargés, on calcule les stats avis
    computeAvisStatsForPrestataires()
  })
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
            @click="changeSection('programmation')"
            :class="['nav-item', { active: currentSection === 'programmation' }]"
          >
            🎵 Programmation
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

        <!-- Programmation -->
        <div v-if="currentSection === 'programmation'" class="section-content">
          <h1 class="section-title">Gestion de la programmation</h1>

          <div class="programmation-editor">
            <!-- Sélecteur de jour -->
            <div class="day-selector-admin">
              <label>Jour :</label>
              <select v-model="selectedDayIndex" class="form-input">
                <option v-for="(day, index) in programmation.schedules" :key="index" :value="index">
                  {{ day.day || `Jour ${index + 1}` }}
                </option>
              </select>
            </div>

            <!-- Sélecteur de scène -->
            <div class="stage-selector-admin">
              <label>Scène :</label>
              <select v-model="selectedStage" class="form-input">
                <option v-for="stage in programmation.stages" :key="stage.name" :value="stage.name">
                  {{ stage.name }} {{ stage.by ? `(by ${stage.by})` : '' }}
                </option>
              </select>
            </div>

            <!-- Liste des créneaux pour la scène sélectionnée -->
            <div v-if="selectedStage && programmation.schedules[selectedDayIndex]" class="slots-list">
              <div class="slots-header">
                <h3>Créneaux - {{ selectedStage }}</h3>
                <button @click="addSlot(selectedDayIndex, selectedStage)" class="btn-add">
                  ➕ Ajouter un créneau
                </button>
              </div>

              <div v-if="programmation.schedules[selectedDayIndex][selectedStage]?.length" class="slots-grid">
                <div
                  v-for="(slot, slotIndex) in programmation.schedules[selectedDayIndex][selectedStage]"
                  :key="slotIndex"
                  class="slot-card"
                  :class="{ editing: editingSlot && editingSlot.dayIndex === selectedDayIndex && editingSlot.stageName === selectedStage && editingSlot.slotIndex === slotIndex }"
                >
                  <div v-if="editingSlot && editingSlot.dayIndex === selectedDayIndex && editingSlot.stageName === selectedStage && editingSlot.slotIndex === slotIndex" class="slot-editor">
                    <div class="form-row">
                      <label>Artiste</label>
                      <input v-model="slot.artist" class="form-input" />
                    </div>
                    <div class="form-row">
                      <label>Heure début</label>
                      <input v-model="slot.start" type="time" class="form-input" />
                    </div>
                    <div class="form-row">
                      <label>Heure fin</label>
                      <input v-model="slot.end" type="time" class="form-input" />
                    </div>
                    <div class="form-row">
                      <label>Style</label>
                      <input v-model="slot.style" class="form-input" />
                    </div>
                    <div class="slot-actions">
                      <button @click="saveSlot" class="btn-save-small">💾 Sauvegarder</button>
                      <button @click="cancelEdit" class="btn-cancel">❌ Annuler</button>
                    </div>
                  </div>
                  <div v-else class="slot-display">
                    <div class="slot-info">
                      <div class="slot-artist-name">{{ slot.artist }}</div>
                      <div class="slot-time">{{ slot.start }} - {{ slot.end }}</div>
                      <div class="slot-style">{{ slot.style }}</div>
                    </div>
                    <div class="slot-actions">
                      <button @click="editSlot(selectedDayIndex, selectedStage, slotIndex)" class="btn-edit">✏️</button>
                      <button @click="deleteSlot(selectedDayIndex, selectedStage, slotIndex)" class="btn-delete">🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-slots">
                <p>Aucun créneau pour cette scène ce jour-là.</p>
                <button @click="addSlot(selectedDayIndex, selectedStage)" class="btn-add">
                  ➕ Ajouter le premier créneau
                </button>
              </div>
            </div>

            <div class="programmation-actions">
              <button @click="saveProgrammation" class="btn-save">
                💾 Sauvegarder toute la programmation
              </button>
            </div>
          </div>
        </div>

        <!-- Gestion Prestataires -->
        <div v-if="currentSection === 'prestataires'" class="section-content">
          <h1 class="section-title">Gestion des prestataires</h1>
          
          <div class="modifications-summary" v-if="Object.keys(customPrestataires).length > 0">
            <p class="summary-text">
              📝 <strong>{{ Object.keys(customPrestataires).length }}</strong> prestataire(s) avec modifications
            </p>
          </div>

          <div class="prestataires-list">
            <div
              v-for="prestataire in prestataires"
              :key="prestataire.nom"
              class="prestataire-item"
              :class="{ 'has-modifications': hasModifications(prestataire) }"
              @click="selectPrestataire(prestataire)"
            >
              <img
                v-if="prestataire.image"
                :src="prestataire.image"
                :alt="prestataire.nom"
                class="prestataire-thumb"
              />
              <div class="prestataire-info">
                <div class="prestataire-header-row">
                  <h3>{{ prestataire.nom }}</h3>
                  <span v-if="hasModifications(prestataire)" class="modification-badge">✏️ Modifié</span>
                </div>
                <p>{{ prestataire.type }}</p>
                <span class="services-count">{{ prestataire.services?.length || 0 }} service(s)</span>
                <div v-if="hasModifications(prestataire)" class="modified-fields">
                  <span class="modified-label">Champs modifiés :</span>
                  <span class="modified-list">{{ getModifiedFields(prestataire).join(', ') || 'Aucun' }}</span>
                </div>
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

          <!-- Indicateur de modifications -->
          <div v-if="hasModifications(selectedPrestataire)" class="modifications-alert">
            <div class="alert-content">
              <span class="alert-icon">⚠️</span>
              <div class="alert-text">
                <strong>Ce prestataire a des modifications locales</strong>
                <p>Champs modifiés : {{ getModifiedFields(selectedPrestataire).join(', ') || 'Aucun' }}</p>
              </div>
              <button @click="resetPrestataire" class="btn-reset">🔄 Réinitialiser</button>
            </div>
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
          <h1 class="section-title">Statistiques</h1>

          <!-- =============================== -->
          <!-- Stats services (déjà présentes) -->
          <!-- =============================== -->
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

          <!-- ======================================= -->
          <!-- NOUVELLE PARTIE : Stats avis prestataire -->
          <!-- ======================================= -->
          <div class="stats-charts" style="margin-top: 32px;">
            <div class="chart-card">
              <h3>Notes moyennes par prestataire</h3>
              <p class="info-text">
                Vue d’ensemble des avis (notes et commentaires) laissés sur chaque prestataire.
              </p>

              <div class="avis-stats-table-wrapper">
                <table class="avis-stats-table">
                  <thead>
                    <tr>
                      <th>Prestataire</th>
                      <th>Note moyenne</th>
                      <th>Nb avis</th>
                      <th>Dernier commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in avisStatsParPrestataire"
                      :key="item.nom"
                      @click="selectPrestataireStats(item)"
                      :class="{ 'row-clickable': true, 'row-selected': selectedPrestataireStats && selectedPrestataireStats.nom === item.nom }"
                    >
                      <td>{{ item.nom }}</td>
                      <td>
                        <span v-if="item.nbAvis">
                          {{ item.moyenne.toFixed(1) }}/5
                        </span>
                        <span v-else>—</span>
                      </td>
                      <td>{{ item.nbAvis }}</td>
                      <td class="last-comment">
                        <span v-if="item.dernierAvis">
                          "{{ item.dernierAvis.commentaire.length > 60 ? (item.dernierAvis.commentaire.slice(0, 60) + '…') : item.dernierAvis.commentaire }}"
                        </span>
                        <span v-else>Pas encore d’avis</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="chart-card" v-if="selectedPrestataireStats">
              <h3>Détail des avis — {{ selectedPrestataireStats.nom }}</h3>
              <div class="detail-avis-stats">
                <div class="detail-note-block">
                  <div class="detail-note-value">
                    {{ selectedPrestataireStats.nbAvis ? selectedPrestataireStats.moyenne.toFixed(1) : '—' }}
                  </div>
                  <div class="detail-note-stars">
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="star"
                      :class="{ filled: selectedPrestataireStats.nbAvis && i <= Math.round(selectedPrestataireStats.moyenne) }"
                    >★</span>
                  </div>
                  <div class="detail-note-meta">
                    {{ selectedPrestataireStats.nbAvis }} avis
                  </div>
                </div>

                <div class="detail-repartition">
                  <div
                    v-for="i in [5,4,3,2,1]"
                    :key="i"
                    class="avis-repartition-row"
                  >
                    <span class="avis-repartition-label">{{ i }}★</span>
                    <div class="avis-repartition-bar">
                      <div
                        class="avis-repartition-fill"
                        :style="{ width: selectedPrestataireStats.nbAvis ? (selectedPrestataireStats.parNote[i] / selectedPrestataireStats.nbAvis) * 100 + '%' : '0%' }"
                      ></div>
                    </div>
                    <span class="avis-repartition-count">
                      {{ selectedPrestataireStats.parNote[i] }}
                    </span>
                  </div>
                </div>
              </div>

              <p class="info-text small">
                Ces statistiques sont basées sur les avis saisis par les festivaliers sur chaque page prestataire.
              </p>
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

.prestataire-item.has-modifications {
  border-color: rgba(252, 220, 30, 0.4);
  background: rgba(252, 220, 30, 0.05);
}

.prestataire-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.modification-badge {
  background: rgba(252, 220, 30, 0.2);
  color: #FCDC1E;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(252, 220, 30, 0.4);
}

.modified-fields {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.modified-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 6px;
}

.modified-list {
  font-size: 0.85rem;
  color: #FCDC1E;
  font-weight: 600;
}

.modifications-summary {
  background: rgba(252, 220, 30, 0.1);
  border: 1px solid rgba(252, 220, 30, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 24px;
}

.summary-text {
  color: #FCDC1E;
  font-size: 0.95rem;
  margin: 0;
}

.modifications-alert {
  background: rgba(255, 193, 7, 0.15);
  border: 2px solid rgba(255, 193, 7, 0.4);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-text {
  flex: 1;
}

.alert-text strong {
  display: block;
  color: #FCDC1E;
  margin-bottom: 4px;
  font-size: 1rem;
}

.alert-text p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin: 0;
}

.btn-reset {
  background: rgba(255, 87, 34, 0.2);
  border: 1px solid rgba(255, 87, 34, 0.4);
  color: #ff5722;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-reset:hover {
  background: rgba(255, 87, 34, 0.3);
  border-color: rgba(255, 87, 34, 0.6);
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

/* Styles pour la table des stats d'avis */
.avis-stats-table-wrapper {
  overflow-x: auto;
}

.avis-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.avis-stats-table th,
.avis-stats-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
}

.avis-stats-table th {
  color: #FCDC1E;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.04);
}

.avis-stats-table tr:last-child td {
  border-bottom: none;
}

.row-clickable {
  cursor: pointer;
  transition: background 0.15s ease;
}

.row-clickable:hover {
  background: rgba(252, 220, 30, 0.06);
}

.row-selected {
  background: rgba(252, 220, 30, 0.12);
}

.last-comment {
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Détail avis */
.detail-avis-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}

.detail-note-block {
  min-width: 160px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(252, 220, 30, 0.4);
  text-align: center;
}

.detail-note-value {
  font-size: 2.3rem;
  font-weight: 900;
  color: #FCDC1E;
  margin-bottom: 4px;
}

.detail-note-stars .star {
  color: rgba(255, 255, 255, 0.25);
  font-size: 1.2rem;
}

.detail-note-stars .star.filled {
  color: #FCDC1E;
}

.detail-note-meta {
  margin-top: 6px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.75);
}

.detail-repartition {
  flex: 1;
  min-width: 220px;
}

/* Réutilisation du style de répartition */
.avis-repartition-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
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

.info-text.small {
  font-size: 0.8rem;
  margin-top: 12px;
}

@media (max-width: 1024px) {
  .admin-sidebar {
    width: 220px;
  }

  .admin-main {
    padding: 24px;
  }
}

/* Programmation */
.programmation-editor {
  background: rgba(255, 255, 255, 0.05);
  padding: 28px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.day-selector-admin,
.stage-selector-admin {
  margin-bottom: 24px;
}

.day-selector-admin label,
.stage-selector-admin label {
  display: block;
  color: #FCDC1E;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.slots-list {
  margin-top: 24px;
}

.slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.slots-header h3 {
  color: #FCDC1E;
  font-size: 1.4rem;
}

.slots-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.slot-card {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.slot-card:hover {
  border-color: rgba(252, 220, 30, 0.3);
}

.slot-card.editing {
  border-color: #FCDC1E;
  background: rgba(252, 220, 30, 0.1);
}

.slot-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.slot-info {
  flex: 1;
}

.slot-artist-name {
  color: #FCDC1E;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 6px;
}

.slot-time {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.slot-style {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.slot-editor {
  display: grid;
  gap: 12px;
}

.slot-actions {
  display: flex;
  gap: 8px;
}

.btn-edit {
  background: rgba(33, 150, 243, 0.2);
  border: 1px solid rgba(33, 150, 243, 0.4);
  color: #2196F3;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.3);
}

.btn-save-small {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.4);
  color: #4CAF50;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-save-small:hover {
  background: rgba(76, 175, 80, 0.3);
}

.btn-cancel {
  background: rgba(158, 158, 158, 0.2);
  border: 1px solid rgba(158, 158, 158, 0.4);
  color: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: rgba(158, 158, 158, 0.3);
}

.empty-slots {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.6);
}

.programmation-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(252, 220, 30, 0.2);
}
</style>