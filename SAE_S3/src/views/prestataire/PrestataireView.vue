<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import WysiwygEditor from '@/components/WysiwygEditor.vue'

const router = useRouter()
const authUser = ref(null)
const prestataireInfo = ref(null)
const loading = ref(true)
const selectedSection = ref('presentation')
const presentationText = ref('')
const services = ref([])
const userFields = ref({ email: '', tel: '', site: '' })

// Données pour la gestion des emplacements
const emplacementsDisponibles = ref([])
const emplacementActuel = ref('')
const mapInstance = ref(null)
const mapLoaded = ref(false)
const mapContainer = ref(null)

// Données pour les zones
const zones = ref([])
const zoneLayers = ref({})
const zoneMarkers = ref({})

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
    const [siteResp, avisResp] = await Promise.all([
      fetch('/data/site.json', { cache: 'no-store' }),
      fetch('/data/avis.json', { cache: 'no-store' })
    ])

    const customRaw = localStorage.getItem('customPrestataires')
    let customPrestataires = null
    if (customRaw) {
      try {
        customPrestataires = JSON.parse(customRaw)
      } catch (e) {
        // ignore
      }
    }

    const data = siteResp.ok ? await siteResp.json() : { prestataires: [] }
    const avisData = avisResp.ok ? await avisResp.json() : {}

    // Charger les emplacements disponibles
    emplacementsDisponibles.value = data.emplacementsDisponibles || []

    // Charger les zones
    zones.value = data.zones || []

    // Charger l'emplacement actuel du prestataire
    try {
      const emplacementsRaw = localStorage.getItem('prestataireEmplacements')
      const emplacements = emplacementsRaw ? JSON.parse(emplacementsRaw) : {}
      emplacementActuel.value = emplacements[prestataireNom.value] || ''
    } catch (e) {
      emplacementActuel.value = ''
    }

    // Vérifier que le prestataire est dans avis.json
    const prestatairesValides = Object.keys(avisData)
    if (!prestatairesValides.includes(prestataireNom.value)) {
      prestataireInfo.value = null
      loading.value = false
      return
    }

    const prestataires = data.prestataires || []

    let prestataire = prestataires.find(p => p.nom === prestataireNom.value) || null

    // Appliquer les modifications locales si elles existent
    if (prestataire) {
      const local = customPrestataires && customPrestataires[prestataireNom.value] ? customPrestataires[prestataireNom.value] : {}
      // merge shallow
      prestataire = { ...prestataire, ...local }
    }

    prestataireInfo.value = prestataire

    // Garder le HTML pour l'éditeur WYSIWYG (ne pas nettoyer)
    const htmlContent = prestataire?.presentationHtml || prestataire?.description || ''
    presentationText.value = htmlContent

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
    // Sauvegarder le HTML directement depuis l'éditeur WYSIWYG
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

// Méthodes pour la gestion des emplacements
const emplacementsLibres = computed(() => {
  try {
    const raw = localStorage.getItem('prestataireEmplacements')
    const emplacements = raw ? JSON.parse(raw) : {}
    const occupes = Object.values(emplacements)
    return emplacementsDisponibles.value.filter(e => !occupes.includes(e))
  } catch (e) {
    return emplacementsDisponibles.value
  }
})

const emplacementsOccupes = computed(() => {
  try {
    const raw = localStorage.getItem('prestataireEmplacements')
    const emplacements = raw ? JSON.parse(raw) : {}
    return Object.values(emplacements)
  } catch (e) {
    return []
  }
})

const parseCoords = (coords) => {
  // Gérer le format "(lat, lng)" ou "lat,lng"
  const match = coords.match(/\(?([^,\)]+),\s*([^)\s]+)\)?/)
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  }
  return null
}

const initMap = async () => {
  if (typeof window === 'undefined' || !mapContainer.value) return

  // Chargement de Leaflet via CDN
  const ver = '1.9.4'
  const cssHref = `https://unpkg.com/leaflet@${ver}/dist/leaflet.css`
  const jsSrc = `https://unpkg.com/leaflet@${ver}/dist/leaflet.js`

  // Injecter le CSS Leaflet
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssHref
    document.head.appendChild(link)
  }

  // Charger Leaflet
  const loadLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L)
    const existing = document.querySelector(`script[src="${jsSrc}"]`)
    if (existing) {
      const wait = () => (window.L ? resolve(window.L) : setTimeout(wait, 50))
      return wait()
    }
    const script = document.createElement('script')
    script.src = jsSrc
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.head.appendChild(script)
  })

  try {
    const L = await loadLeaflet()

    // Initialiser la carte
    if (mapInstance.value) {
      mapInstance.value.remove()
    }

    const map = L.map(mapContainer.value, {
      center: [47.304164, 4.965223],
      zoom: 16.4,
      minZoom: 16.4,
      maxZoom: 19,
      zoomControl: true,
      scrollWheelZoom: true,
      maxBoundsViscosity: 1.0
    })

    // Ajouter le fond OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    // Définir les limites
    const initialBounds = map.getBounds()
    map.setMaxBounds(initialBounds)

    mapInstance.value = map
    mapLoaded.value = true

    // Ajouter les marqueurs et les zones
    updateMapMarkers()
    initZones()

  } catch (e) {
    console.error('Erreur lors du chargement de la carte:', e)
  }
}

const updateMapMarkers = () => {
  if (!mapInstance.value || !window.L) return

  const L = window.L
  const map = mapInstance.value

  // Supprimer uniquement les CircleMarkers d'emplacements (pas les zones)
  map.eachLayer((layer) => {
    if (layer instanceof L.CircleMarker) {
      map.removeLayer(layer)
    }
  })

  // Ajouter les marqueurs pour chaque emplacement disponible
  emplacementsDisponibles.value.forEach(coords => {
    const parsed = parseCoords(coords)
    if (!parsed) return

    const isOccupied = emplacementsOccupes.value.includes(coords)
    const isCurrent = coords === emplacementActuel.value

    let color = '#4caf50' // Vert - disponible
    let radius = 8
    let label = 'Disponible'

    if (isCurrent) {
      color = '#FCDC1E' // Jaune - actuel
      radius = 12
      label = 'Votre emplacement'
    } else if (isOccupied) {
      color = '#f44336' // Rouge - occupé
      label = 'Occupé'
    }

    const marker = L.circleMarker([parsed.lat, parsed.lng], {
      radius: radius,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: isCurrent ? 1 : 0.8
    }).addTo(map)

    // Créer le contenu du popup avec bouton
    let popupContent = `
      <div style="text-align: center; font-family: Arial, sans-serif; padding: 8px;">
        <strong style="color: ${color}; font-size: 14px;">${label}</strong>
    `

    if (isCurrent) {
      // Pour l'emplacement actuel : bouton pour libérer
      popupContent += `
        <br><br>
        <button
          onclick="window.libererEmplacementFromMap()"
          style="
            background: #f44336;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='#d32f2f'"
          onmouseout="this.style.background='#f44336'"
        >
          🗑️ Libérer
        </button>
      `
    } else if (!isOccupied) {
      // Pour les emplacements disponibles : bouton pour sélectionner
      popupContent += `
        <br><br>
        <button
          onclick="window.choisirEmplacementFromMap('${coords}')"
          style="
            background: #4caf50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='#45a049'"
          onmouseout="this.style.background='#4caf50'"
        >
          ✓ Sélectionner
        </button>
      `
    } else {
      // Pour les emplacements occupés : juste un message
      popupContent += `
        <br>
        <small style="color: #999;">Cet emplacement est déjà pris</small>
      `
    }

    popupContent += `</div>`

    marker.bindPopup(popupContent)

    if (isCurrent) {
      // Animation pour l'emplacement actuel
      setInterval(() => {
        marker.setRadius(marker.getRadius() === 12 ? 14 : 12)
      }, 1000)
    }
  })

  // Exposer les fonctions pour les appels depuis les boutons du popup
  window.choisirEmplacementFromMap = (coords) => {
    choisirEmplacement(coords)
  }

  window.libererEmplacementFromMap = () => {
    libererEmplacement()
  }
}

// Fonctions pour gérer les zones
const getZoneColor = (type) => {
  if (type === 'parking') return '#0066FF'
  if (type === 'camping') return '#2ECC71'
  if (type === 'VIP') return '#9B59B6'
  if (type === 'festival') return '#FFD700'
  return '#888888'
}

const getSceneColor = (nom) => {
  const sceneColors = {
    'MOTHERSHIP': '#FF1744',
    'ZERO GRAVITY': '#00E5FF',
    'CARGO': '#FF9800',
    'ANTDT CLUB': '#E91E63',
  }
  return sceneColors[nom] || '#9C27B0'
}

const getPolygonCenter = (latlngs) => {
  let latSum = 0
  let lngSum = 0
  latlngs.forEach(coord => {
    latSum += coord[0]
    lngSum += coord[1]
  })
  return [latSum / latlngs.length, lngSum / latlngs.length]
}

const getZoneIcon = (type, nom) => {
  const L = window.L
  if (!L) return null

  let symbol = ''
  let bgColor = '#FFFFFF'
  let textColor = '#000000'
  let borderColor = '#000000'

  if (type === 'parking') {
    symbol = 'P'
    bgColor = '#FFFFFF'
    textColor = '#0066FF'
    borderColor = '#0066FF'
  } else if (type === 'camping') {
    symbol = '🏕️'
    bgColor = 'rgba(46, 204, 113, 0.9)'
    textColor = '#FFFFFF'
    borderColor = '#2ECC71'
  } else if (type === 'VIP') {
    symbol = '⭐'
    bgColor = 'rgba(155, 89, 182, 0.9)'
    textColor = '#FFFFFF'
    borderColor = '#9B59B6'
  } else if (type === 'scène') {
    symbol = '🎵'
    const sceneColor = getSceneColor(nom)
    bgColor = sceneColor
    textColor = '#FFFFFF'
    borderColor = sceneColor
  }

  const html = `
    <div style="
      background-color: ${bgColor};
      border: 3px solid ${borderColor};
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${type === 'parking' ? '24px' : '28px'};
      font-weight: ${type === 'parking' ? 'bold' : 'normal'};
      color: ${textColor};
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${symbol}</div>
  `

  return L.divIcon({
    html: html,
    className: 'zone-icon-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

const initZones = () => {
  const L = window.L
  if (!L || !mapInstance.value) return

  zoneLayers.value = {}
  zoneMarkers.value = {}
  let idx = 0

  zones.value.forEach(z => {
    if (!Array.isArray(z.coords) || z.coords.length < 3) return
    const latlngs = []
    for (const c of z.coords) {
      const parts = String(c).split(',').map(s => parseFloat(s.trim()))
      if (parts.length !== 2 || parts.some(isNaN)) return
      latlngs.push([parts[0], parts[1]])
    }
    const color = getZoneColor(z.type)

    if (z.type === 'festival') {
      // Zone festival : contour jaune sans remplissage
      const layer = L.polygon(latlngs, {
        color: '#FFD700',
        weight: 3,
        fillColor: 'transparent',
        fillOpacity: 0,
        interactive: false,
      })
      layer._zoneType = z.type
      zoneLayers.value[`zone_${idx++}`] = layer
      layer.addTo(mapInstance.value)
    } else if (z.type === 'scène') {
      // Scènes avec style spécial
      const sceneColor = getSceneColor(z.nom)
      const popupContent = `
        <div class="popup-scene">
          <h3 style="margin: 0 0 8px 0; color: ${sceneColor}; font-weight: bold; font-size: 1.2em;">
            🎵 ${z.nom}
          </h3>
          ${z.sponsor ? `<p style="margin: 0; color: #666; font-size: 0.9em;">by ${z.sponsor}</p>` : ''}
        </div>
      `
      const layer = L.polygon(latlngs, {
        color: sceneColor,
        weight: 4,
        fillColor: sceneColor,
        fillOpacity: 0.4,
        opacity: 0.9,
        dashArray: '0',
      }).bindPopup(popupContent, {
        className: 'scene-popup'
      })
      layer._zoneType = z.type
      layer._zoneNom = z.nom
      zoneLayers.value[`zone_${idx++}`] = layer
      layer.addTo(mapInstance.value)

      // Marqueur de symbole au centre
      const center = getPolygonCenter(latlngs)
      const icon = getZoneIcon(z.type, z.nom)
      if (icon) {
        const marker = L.marker(center, { icon, interactive: false })
        marker._zoneType = z.type
        marker._zoneNom = z.nom
        zoneMarkers.value[`zone_marker_${idx - 1}`] = marker
        marker.addTo(mapInstance.value)
      }
    } else {
      // Zones normales (parking, camping, VIP)
      const layer = L.polygon(latlngs, {
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.25,
      }).bindPopup(`${z.nom} (${z.type})`)
      layer._zoneType = z.type
      zoneLayers.value[`zone_${idx++}`] = layer
      layer.addTo(mapInstance.value)

      // Marqueur de symbole au centre
      const center = getPolygonCenter(latlngs)
      const icon = getZoneIcon(z.type, z.nom)
      if (icon) {
        const marker = L.marker(center, { icon, interactive: false })
        marker._zoneType = z.type
        marker._zoneNom = z.nom
        zoneMarkers.value[`zone_marker_${idx - 1}`] = marker
        marker.addTo(mapInstance.value)
      }
    }
  })
}

const choisirEmplacement = (coords) => {
  if (!prestataireNom.value) return

  try {
    const raw = localStorage.getItem('prestataireEmplacements')
    const emplacements = raw ? JSON.parse(raw) : {}

    // Si le prestataire avait déjà un emplacement, le libérer
    if (emplacementActuel.value) {
      // L'ancien emplacement devient libre automatiquement
    }

    // Assigner le nouvel emplacement
    emplacements[prestataireNom.value] = coords
    localStorage.setItem('prestataireEmplacements', JSON.stringify(emplacements))
    emplacementActuel.value = coords

    // Déclencher un événement pour mettre à jour la carte
    window.dispatchEvent(new Event('emplacement-updated'))

    // Forcer la mise à jour en utilisant nextTick pour s'assurer que les computed sont recalculés
    nextTick(() => {
      updateMapMarkers()
    })
  } catch (e) {
    console.error('Erreur lors de la sélection de l\'emplacement', e)
    alert('Erreur lors de la sélection de l\'emplacement')
  }
}

const libererEmplacement = () => {
  if (!prestataireNom.value || !emplacementActuel.value) return

  if (!confirm('Êtes-vous sûr de vouloir libérer votre emplacement actuel ?')) return

  try {
    const raw = localStorage.getItem('prestataireEmplacements')
    const emplacements = raw ? JSON.parse(raw) : {}

    delete emplacements[prestataireNom.value]
    localStorage.setItem('prestataireEmplacements', JSON.stringify(emplacements))
    emplacementActuel.value = ''

    // Déclencher un événement pour mettre à jour la carte
    window.dispatchEvent(new Event('emplacement-updated'))

    // Forcer la mise à jour en utilisant nextTick pour s'assurer que les computed sont recalculés
    nextTick(() => {
      updateMapMarkers()
    })
  } catch (e) {
    console.error('Erreur lors de la libération de l\'emplacement', e)
    alert('Erreur lors de la libération de l\'emplacement')
  }
}

// =======================
// NOUVEAU: stats de ventes
// =======================
const statsNotes = ref({
  moyenne: 0,
  nbAvis: 0,
  parNote: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  derniersAvis: []
})

// Watch pour initialiser la carte quand on sélectionne la section emplacement
watch(selectedSection, async (newVal) => {
  if (newVal === 'emplacement') {
    await nextTick()
    initMap()
  }
})

const loadStatsNotes = () => {
  if (!prestataireNom.value) return
  try {
    const localRaw = localStorage.getItem('prestataireAvis')
    if (!localRaw) {
      statsNotes.value = {
        moyenne: 0,
        nbAvis: 0,
        parNote: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        derniersAvis: []
      }
      return
    }
    const allAvis = JSON.parse(localRaw)
    const data = allAvis[prestataireNom.value] || { avis: [] }
    const avis = data.avis || []

    const st = {
      moyenne: 0,
      nbAvis: avis.length,
      parNote: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      derniersAvis: avis.slice().reverse().slice(0, 10)
    }

    if (st.nbAvis) {
      let total = 0
      avis.forEach(a => {
        const n = a.note || 0
        if (st.parNote[n] !== undefined) st.parNote[n]++
        total += n
      })
      st.moyenne = total / st.nbAvis
    }

    statsNotes.value = st
  } catch (e) {
    console.error('Erreur chargement stats notes', e)
  }
}

onMounted(() => {
  loadAuthFromStorage()

  if (!isPrestataire.value) {
    router.push('/login')
    return
  }

  loadPrestataireInfo()
  loadStatsNotes()
  window.addEventListener('storage', (e) => {
    if (e.key === 'prestataireAvis') {
      loadStatsNotes()
    }
  })
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
            <li :class="{ active: selectedSection === 'emplacement' }" @click="selectedSection = 'emplacement'">
              <span class="menu-icon">📍</span>
              <span>Emplacement</span>
            </li>
            <li :class="{ active: selectedSection === 'stats' }" @click="selectedSection = 'stats'">
              <span class="menu-icon">📊</span>
              <span>Statistiques</span>
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
              <p class="section-description">Rédigez la présentation de votre prestataire avec texte et images.</p>
            </div>
            <div class="editor-actions">
              <button class="btn btn-primary" type="button" @click="savePresentation">
                💾 Sauvegarder
              </button>
            </div>

            <WysiwygEditor
                v-model="presentationText"
                :height="500"
                placeholder="Décrivez votre prestataire, ajoutez des images pour mettre en valeur vos services..."
            />

            <div class="form-group" style="margin-top: 20px;">
              <label>Aperçu</label>
              <div class="preview-box" v-html="presentationText"></div>
            </div>
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

          <!-- Emplacement -->
          <div v-if="selectedSection === 'emplacement'" class="section-content">
            <div class="section-header">
              <h2>📍 Emplacement sur la carte</h2>
              <p class="section-description">Cliquez sur un marqueur vert pour sélectionner votre emplacement sur la carte du festival.</p>
            </div>

            <!-- Emplacement actuel -->
            <div v-if="emplacementActuel" class="emplacement-actuel">
              <h3>✅ Votre emplacement actuel</h3>
              <div class="emplacement-info">
                <span class="emplacement-coords">📌 {{ emplacementActuel }}</span>
                <button class="btn btn-danger" @click="libererEmplacement">
                  🗑️ Libérer cet emplacement
                </button>
              </div>
            </div>

            <div v-else class="emplacement-vide">
              <p>❌ Vous n'avez pas encore choisi d'emplacement.</p>
              <p class="empty-hint">Cliquez sur un marqueur vert ci-dessous et utilisez le bouton "Sélectionner".</p>
            </div>

            <!-- Carte interactive -->
            <div class="carte-container">
              <div ref="mapContainer" class="carte-map" id="prestataire-map"></div>

              <!-- Légende -->
              <div class="carte-legende">
                <div class="legende-item">
                  <div class="legende-marker disponible"></div>
                  <span>Disponible</span>
                </div>
                <div class="legende-item">
                  <div class="legende-marker actuel"></div>
                  <span>Votre emplacement</span>
                </div>
                <div class="legende-item">
                  <div class="legende-marker occupe"></div>
                  <span>Occupé</span>
                </div>
              </div>
            </div>

            <!-- Note d'information -->
            <div class="info-box">
              <strong>ℹ️ Information :</strong>
              <p>Cliquez sur un marqueur vert pour voir le bouton "Sélectionner". Une fois votre emplacement choisi, il apparaîtra en jaune sur la carte et sera visible sur la carte publique du festival. Pour changer d'emplacement, libérez d'abord votre emplacement actuel puis sélectionnez-en un autre.</p>
            </div>
          </div>

          <!-- ===========================
               Statistiques (VENTES UNIQUEMENT)
               =========================== -->
          <div v-if="selectedSection === 'stats'" class="section-content">
            <div class="section-header">
              <h2>📊 Statistiques des avis</h2>
              <p class="section-description">
                Synthèse des notes et commentaires laissés par les festivaliers pour votre prestataire.
              </p>
            </div>

            <div class="stats-cards">
              <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-content">
                  <div class="stat-label">Note moyenne</div>
                  <div class="stat-value">
                    {{ statsNotes.nbAvis ? statsNotes.moyenne.toFixed(1) + '/5' : '- /5' }}
                  </div>
                  <div class="stat-meta">
                    <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(statsNotes.moyenne) }">
                      ★
                    </span>
                  </div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-content">
                  <div class="stat-label">Nombre d'avis</div>
                  <div class="stat-value">{{ statsNotes.nbAvis }}</div>
                  <div class="stat-meta">Commentaires publiés</div>
                </div>
              </div>
            </div>

            <!-- Répartition des notes -->
            <div class="stats-section">
              <h3 class="stats-section-title">Répartition des notes</h3>
              <div v-if="statsNotes.nbAvis" class="avis-repartition">
                <div
                    v-for="i in [5,4,3,2,1]"
                    :key="i"
                    class="avis-repartition-row"
                >
                  <span class="avis-repartition-label">{{ i }}★</span>
                  <div class="avis-repartition-bar">
                    <div
                        class="avis-repartition-fill"
                        :style="{ width: (statsNotes.parNote[i] / statsNotes.nbAvis) * 100 + '%' }"
                    ></div>
                  </div>
                  <span class="avis-repartition-count">{{ statsNotes.parNote[i] }}</span>
                </div>
              </div>
              <div v-else class="empty-state">
                <p>📭 Aucun avis pour le moment.</p>
                <p class="empty-hint">
                  Les statistiques apparaîtront lorsque les visiteurs auront laissé des commentaires.
                </p>
              </div>
            </div>

            <!-- Derniers avis -->
            <div class="stats-section" v-if="statsNotes.derniersAvis.length">
              <h3 class="stats-section-title">Derniers avis reçus</h3>
              <div class="data-table-container">
                <table class="data-table transactions-table">
                  <thead>
                  <tr>
                    <th>Date</th>
                    <th>Note</th>
                    <th>Commentaire</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="avis in statsNotes.derniersAvis" :key="avis.id">
                    <td class="transaction-date">
                      {{ new Date(avis.date).toLocaleString('fr-FR') }}
                    </td>
                    <td class="table-value">
                      {{ avis.note }}/5
                    </td>
                    <td class="transaction-client">
                      {{ avis.commentaire }}
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
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

/* Tableaux de données */
.data-table-container {
  margin-top: 24px;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(252,220,30,0.2);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.data-table thead {
  background: linear-gradient(135deg, rgba(32,70,179,0.3) 0%, rgba(252,220,30,0.2) 100%);
}

.data-table thead th {
  padding: 16px 20px;
  text-align: left;
  color: #FCDC1E;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(252,220,30,0.3);
}

.data-table tbody tr {
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: background 0.2s ease;
}

.data-table tbody tr:hover {
  background: rgba(252,220,30,0.05);
}

.data-table tbody td {
  padding: 14px 20px;
  color: rgba(255,255,255,0.9);
}

.transaction-date {
  color: rgba(255, 255, 255, 0.8);
}

.transaction-client {
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.table-value {
  font-weight: 700;
  color: #fff;
}

/* Répartition des avis */
.avis-repartition {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
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
}

.avis-repartition-count {
  width: 30px;
  text-align: right;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.preview-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(252, 220, 30, 0.2);
  border-radius: 12px;
  padding: 20px;
  min-height: 100px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.preview-box :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 12px 0;
}

.preview-box :deep(p) {
  margin-bottom: 12px;
}

.preview-box :deep(h1),
.preview-box :deep(h2),
.preview-box :deep(h3) {
  color: #FCDC1E;
  margin: 16px 0 8px;
}

.preview-box :deep(ul),
.preview-box :deep(ol) {
  margin-left: 24px;
  margin-bottom: 12px;
}

.preview-box :deep(a) {
  color: #FCDC1E;
  text-decoration: underline;
}

/* Styles pour la section Emplacement */
.emplacement-actuel {
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid #4caf50;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.emplacement-actuel h3 {
  color: #4caf50;
  margin: 0 0 12px 0;
  font-size: 1.1rem;
}

.emplacement-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.emplacement-coords {
  font-family: monospace;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.emplacement-vide {
  background: rgba(244, 67, 54, 0.1);
  border: 2px solid #f44336;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: center;
}

.emplacement-vide p {
  margin: 8px 0;
  color: rgba(255, 255, 255, 0.9);
}

/* Styles pour la carte interactive */
.carte-container {
  margin: 24px 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(252, 220, 30, 0.2);
}

.carte-map {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.carte-legende {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.legende-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.legende-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.legende-marker.disponible {
  background: #4caf50;
}

.legende-marker.actuel {
  background: #FCDC1E;
}

.legende-marker.occupe {
  background: #f44336;
}

.info-box {
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-top: 24px;
}

.info-box strong {
  color: #2196F3;
  display: block;
  margin-bottom: 8px;
}

.info-box p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
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

@media (max-width: 768px) {
  .carte-legende {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .carte-map {
    height: 400px;
  }
}

/* Styles pour les icônes de zones (similaires à CarteView) */
:deep(.zone-icon-marker) {
  background: transparent !important;
  border: none !important;
}

/* Styles pour les popups de scènes */
:deep(.scene-popup .leaflet-popup-content-wrapper) {
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid currentColor;
  border-radius: 12px;
  padding: 8px;
}

:deep(.scene-popup .leaflet-popup-content) {
  margin: 0;
}

:deep(.scene-popup .leaflet-popup-tip) {
  background: rgba(0, 0, 0, 0.9);
}

/* Statistiques - cartes de stats */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.1) 0%, rgba(32, 70, 179, 0.1) 100%);
  border: 1px solid rgba(252, 220, 30, 0.3);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(252, 220, 30, 0.2);
  border-color: rgba(252, 220, 30, 0.5);
}

.stat-icon {
  font-size: 3rem;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(252, 220, 30, 0.2);
  border-radius: 50%;
  border: 2px solid rgba(252, 220, 30, 0.4);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: #FCDC1E;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-meta {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.stats-section {
  margin-bottom: 32px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.stats-section-title {
  color: #FCDC1E;
  font-size: 1.3rem;
  margin: 0 0 16px 0;
  font-weight: 700;
}
</style>