<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import WysiwygEditor from '@/components/WysiwygEditor.vue'

const { t, locale } = useI18n()
const router = useRouter()
const authUser = ref(null)
const prestataireInfo = ref(null)
const loading = ref(true)
const selectedSection = ref('presentation')
const editingLang = ref('fr') // Langue d'édition actuelle
const presentationText = ref('')
const services = ref([])
const userFields = ref({ email: '', tel: '', site: '' })

// AJOUT: Texte personnalisé pour la popup de l'emplacement (bilingue)
const popupText = ref({ fr: '', en: '' })

// Données pour la gestion des emplacements
const emplacements = ref([]) // Tous les emplacements avec leur statut
const emplacementActuel = ref(null) // Emplacement actuel du prestataire
const demandePendante = ref(null) // Demande en attente

// Données pour les zones
const zones = ref([])
const zoneLayers = ref({})
const zoneMarkers = ref({})

// AJOUT: Variables pour la carte
const mapContainer = ref(null)
const mapInstance = ref(null)
const mapLoaded = ref(false)

// AJOUT: Variables pour les statistiques
const statsNotes = ref({
  moyenne: 0,
  nbAvis: 0,
  parNote: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  derniersAvis: []
})

// AJOUT: Helper pour parser les coordonnées
const parseCoords = (coordStr) => {
  const parts = coordStr.split(',').map(s => parseFloat(s.trim()))
  if (parts.length !== 2 || parts.some(isNaN)) return null
  return { lat: parts[0], lng: parts[1] }
}

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
    // Charger les emplacements depuis le JSON
    const [emplacementsResp, zonesResp, avisResp] = await Promise.all([
      fetch('/data/emplacements.json', { cache: 'no-store' }),
      fetch('/data/zones.json', { cache: 'no-store' }),
      fetch('/data/avis.json', { cache: 'no-store' })
    ])
    const emplacementsData = emplacementsResp.ok ? await emplacementsResp.json() : { emplacements: [] }
    const zonesData = zonesResp.ok ? await zonesResp.json() : { zones: [] }
    emplacements.value = emplacementsData.emplacements || []
    zones.value = zonesData.zones || []

    // MODIFICATION: Charger les emplacements attribués
    try {
      const emplacementsRaw = localStorage.getItem('emplacementsAttribues')
      const emplacementsAttribues = emplacementsRaw ? JSON.parse(emplacementsRaw) : {}

      const coordActuel = emplacementsAttribues[prestataireNom.value]
      if (coordActuel) {
        const emplacement = emplacementsData.emplacements?.find(e => e.coordonnees === coordActuel)
        if (emplacement) {
          emplacementActuel.value = {
            ...emplacement,
            dateAttribution: new Date().toISOString()
          }
        }
      } else {
        emplacementActuel.value = null
      }
    } catch (e) {
      emplacementActuel.value = null
    }

    // MODIFICATION: Charger la demande en attente
    try {
      const demandesRaw = localStorage.getItem('demandesEmplacement')
      const demandes = demandesRaw ? JSON.parse(demandesRaw) : []
      demandePendante.value = demandes.find(d =>
        d.prestataireNom === prestataireNom.value && d.statut === 'en_attente'
      ) || null
    } catch (e) {
      demandePendante.value = null
    }

    const avisData = avisResp.ok ? await avisResp.json() : {}

    // Vérifier que le prestataire est dans avis.json
    const prestatairesValides = Object.keys(avisData)
    if (!prestatairesValides.includes(prestataireNom.value)) {
      prestataireInfo.value = null
      loading.value = false
      return
    }

    const customRaw = localStorage.getItem('customPrestataires')
    let customPrestataires = null
    if (customRaw) {
      try {
        customPrestataires = JSON.parse(customRaw)
      } catch (e) {
        // ignore
      }
    }

    const prestataires = siteData.prestataires || []
    let prestataire = prestataires.find(p => p.nom === prestataireNom.value) || null
    // Appliquer les modifications locales si elles existent
    if (prestataire) {
      const local = customPrestataires && customPrestataires[prestataireNom.value] ? customPrestataires[prestataireNom.value] : {}
      // merge shallow
      prestataire = { ...prestataire, ...local }
    }
    prestataireInfo.value = prestataire

    // MODIFICATION: Charger les données selon la structure bilingue
    const customData = customPrestataires && customPrestataires[prestataireNom.value] ? customPrestataires[prestataireNom.value] : {}
    
    // Structure bilingue pour presentationHtml
    if (customData.presentationHtml && typeof customData.presentationHtml === 'object' && customData.presentationHtml.fr) {
      // Nouveau format bilingue
      presentationText.value = customData.presentationHtml[editingLang.value] || customData.presentationHtml.fr || prestataire?.description || ''
    } else {
      // Ancien format (rétrocompatibilité)
      presentationText.value = customData.presentationHtml || prestataire?.description || ''
    }

    // MODIFICATION: Charger le texte personnalisé de la popup (bilingue)
    if (customData.popupText && typeof customData.popupText === 'object' && customData.popupText.fr !== undefined) {
      popupText.value = { fr: customData.popupText.fr || '', en: customData.popupText.en || '' }
    } else {
      // Ancien format (rétrocompatibilité)
      popupText.value = { fr: customData.popupText || '', en: '' }
    }

    // MODIFICATION: Charger les services (bilingue)
    if (customData.services && Array.isArray(customData.services) && customData.services.length > 0) {
      // Vérifier si c'est le nouveau format bilingue
      const firstService = customData.services[0]
      if (firstService.nom && typeof firstService.nom === 'object' && firstService.nom.fr !== undefined) {
        // Nouveau format bilingue
        services.value = customData.services.map(s => ({
          nom: { fr: s.nom?.fr || '', en: s.nom?.en || '' },
          description: { fr: s.description?.fr || '', en: s.description?.en || '' },
          prix: s.prix !== undefined ? s.prix : 0,
          enabled: s.enabled !== undefined ? s.enabled : true,
          public: s.public !== undefined ? s.public : true,
        }))
      } else {
        // Ancien format (rétrocompatibilité) - convertir en bilingue
        services.value = customData.services.map(s => ({
          nom: typeof s.nom === 'string' ? { fr: s.nom, en: '' } : (s.nom || { fr: '', en: '' }),
          description: typeof s.description === 'string' ? { fr: s.description, en: '' } : (s.description || { fr: '', en: '' }),
          prix: s.prix !== undefined ? s.prix : 0,
          enabled: s.enabled !== undefined ? s.enabled : true,
          public: s.public !== undefined ? s.public : true,
        }))
      }
    } else {
      // Utiliser les services originaux du prestataire
      services.value = (prestataire?.services || []).map(s => ({
        nom: typeof s.nom === 'string' ? { fr: s.nom, en: '' } : (s.nom || { fr: '', en: '' }),
        description: typeof s.description === 'string' ? { fr: s.description, en: '' } : (s.description || { fr: '', en: '' }),
        prix: s.prix !== undefined ? s.prix : 0,
        enabled: s.enabled !== undefined ? s.enabled : true,
        public: s.public !== undefined ? s.public : true,
      }))
    }
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


const addService = () => {
  services.value.push({ 
    nom: { fr: t('prestataireSpace.newService'), en: '' }, 
    description: { fr: '', en: '' }, 
    prix: 0, 
    enabled: true, 
    public: true 
  })
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
  alert(t('prestataireSpace.presentationSaved'))
}

const saveUserFields = () => {
  saveCustomPrestataire()
  alert(t('prestataireSpace.userInfoSaved'))
}

const formatPrix = (val) => {
  if (val === 0) return t('prestataireSpace.free')
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val)
}

// Calculer les emplacements libres
const emplacementsLibres = computed(() => {
  return emplacements.value.filter(e => e.statut === 'libre')
})

// Calculer les emplacements occupés (pour la carte)
const emplacementsOccupes = computed(() => {
  return emplacements.value
    .filter(e => e.statut === 'pris' || e.statut === 'en_attente')
    .map(e => e.coordonnees)
})

// MODIFICATION: Nouvelle fonction pour créer une demande (fonctionnelle)
const demanderEmplacement = async (coords) => {
  if (!prestataireNom.value) return

  try {
    // Récupérer les demandes existantes
    const demandesRaw = localStorage.getItem('demandesEmplacement')
    let demandes = demandesRaw ? JSON.parse(demandesRaw) : []

    // Vérifier si une demande existe déjà pour ce prestataire
    const demandeExistante = demandes.find(d =>
      d.prestataireNom === prestataireNom.value && d.statut === 'en_attente'
    )

    if (demandeExistante) {
      if (!confirm(t('prestataireSpace.replaceRequest'))) return
      // Supprimer l'ancienne demande
      demandes = demandes.filter(d => d.id !== demandeExistante.id)
    }

    // Créer une nouvelle demande
    const nouvelleDemande = {
      id: Date.now().toString(),
      prestataireNom: prestataireNom.value,
      coordonnees: coords,
      statut: 'en_attente',
      dateDemande: new Date().toISOString()
    }

    demandes.push(nouvelleDemande)
    localStorage.setItem('demandesEmplacement', JSON.stringify(demandes))

    // Recharger les données
    await loadPrestataireInfo()

    // Déclencher un événement pour l'admin
    window.dispatchEvent(new Event('demandes-updated'))

    alert(t('prestataireSpace.requestSent') + '\n\n' + t('prestataireSpace.requestSentDesc'))
  } catch (e) {
    console.error('Erreur lors de l\'envoi de la demande', e)
    alert(t('prestataireSpace.requestError'))
  }
}

// MODIFICATION: Fonction pour annuler une demande (fonctionnelle)
const annulerDemande = async () => {
  if (!prestataireNom.value || !demandePendante.value) return

  if (!confirm(t('prestataireSpace.cancelConfirm'))) return

  try {
    const demandesRaw = localStorage.getItem('demandesEmplacement')
    let demandes = demandesRaw ? JSON.parse(demandesRaw) : []

    // Supprimer la demande
    demandes = demandes.filter(d => d.id !== demandePendante.value.id)
    localStorage.setItem('demandesEmplacement', JSON.stringify(demandes))

    demandePendante.value = null

    // Déclencher un événement
    window.dispatchEvent(new Event('demandes-updated'))

    alert(t('prestataireSpace.requestCancelled'))
  } catch (e) {
    console.error('Erreur lors de l\'annulation', e)
    alert(t('prestataireSpace.cancelError'))
  }
}

const libererEmplacement = async () => {
  if (!confirm(t('prestataireSpace.releaseConfirm'))) return

  try {
    const emplacementsRaw = localStorage.getItem('emplacementsAttribues')
    let emplacements = emplacementsRaw ? JSON.parse(emplacementsRaw) : {}

    // Supprimer l'emplacement du prestataire
    delete emplacements[prestataireNom.value]
    localStorage.setItem('emplacementsAttribues', JSON.stringify(emplacements))

    emplacementActuel.value = null

    // Déclencher un événement
    window.dispatchEvent(new Event('emplacements-updated'))

    alert(t('prestataireSpace.locationReleased'))
  } catch (e) {
    console.error('Erreur lors de la libération', e)
    alert(t('prestataireSpace.releaseError'))
  }
}

const initMap = async () => {
  if (typeof window === 'undefined' || !mapContainer.value) return

  // Chargement de Leaflet via CDN
  const ver = '1.9.4'
  const cssHref = `https://unpkg.com/leaflet@${ver}/dist/leaflet.css`
  const jsSrc = `https://unpkg.com/leaflet@${ver}/dist/leaflet.js`

  // Injecter la feuille de style Leaflet si absente
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssHref
    document.head.appendChild(link)
  }

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

const saveCustomPrestataire = () => {
  if (!prestataireNom.value) return
  try {
    const raw = localStorage.getItem('customPrestataires')
    let obj = raw ? JSON.parse(raw) : {}
    
    // Charger les données existantes pour préserver les autres langues
    const existing = obj[prestataireNom.value] || {}
    
    // Structure bilingue pour presentationHtml
    let presentationHtmlBilingue = existing.presentationHtml || {}
    if (typeof presentationHtmlBilingue === 'string') {
      // Convertir l'ancien format en bilingue
      presentationHtmlBilingue = { fr: presentationHtmlBilingue, en: '' }
    }
    presentationHtmlBilingue[editingLang.value] = presentationText.value
    
    // Structure bilingue pour services
    const servicesBilingues = services.value.map(s => ({
      nom: s.nom,
      description: s.description,
      prix: s.prix,
      enabled: s.enabled,
      public: s.public
    }))
    
    obj[prestataireNom.value] = {
      presentationHtml: presentationHtmlBilingue,
      services: servicesBilingues,
      email: userFields.value.email,
      tel: userFields.value.tel,
      site: userFields.value.site,
      popupText: popupText.value
    }
    localStorage.setItem('customPrestataires', JSON.stringify(obj))
    // Déclencher un événement pour mettre à jour la carte
    window.dispatchEvent(new Event('emplacement-updated'))
    window.dispatchEvent(new Event('prestataire-updated'))
  } catch (e) {
    console.error('Erreur sauvegarde custom', e)
  }
}

// AJOUT: Méthode pour sauvegarder et mettre à jour le texte de la popup
const savePopupText = () => {
  saveCustomPrestataire()
  updateMapMarkers() // Mettre à jour les marqueurs sur la carte locale
  alert(t('prestataireSpace.popupSaved'))
}

// Fonction pour changer la langue d'édition
const changeEditingLang = (lang) => {
  editingLang.value = lang
  // Recharger les données selon la nouvelle langue
  loadPrestataireInfo()
}

// Computed pour obtenir le texte de popup selon la langue d'édition
const currentPopupText = computed({
  get: () => popupText.value[editingLang.value] || '',
  set: (val) => {
    popupText.value[editingLang.value] = val
  }
})

const updateMapMarkers = () => {
  if (!mapInstance.value || !window.L) return

  const L = window.L
  const map = mapInstance.value

  // Supprimer uniquement les CircleMarkers d'emplacements
  map.eachLayer((layer) => {
    if (layer instanceof L.CircleMarker) {
      map.removeLayer(layer)
    }
  })

  // MODIFICATION: Ajouter les marqueurs pour chaque emplacement
  emplacements.value.forEach(emplacement => {
    const coords = emplacement.coordonnees
    const parsed = parseCoords(coords)
    if (!parsed) return

    const isCurrent = emplacementActuel.value && coords === emplacementActuel.value.coordonnees
    const isPending = demandePendante.value && coords === demandePendante.value.coordonnees
    const isOccupied = emplacement.statut === 'pris' || emplacement.statut === 'en_attente'

    let color = '#4caf50' // Vert - disponible
    let radius = 8
    let label = 'Disponible'

    if (isCurrent) {
      color = '#FCDC1E' // Jaune - actuel validé
      radius = 12
      label = 'Votre emplacement validé'
    } else if (isPending) {
      color = '#ff9800' // Orange - demande en attente
      radius = 10
      label = 'Votre demande en attente'
    } else if (isOccupied) {
      color = '#f44336' // Rouge - occupé
      label = `Occupé${emplacement.prestataireNom ? ` par ${emplacement.prestataireNom}` : ''}`
    }

    const marker = L.circleMarker([parsed.lat, parsed.lng], {
      radius: radius,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: isCurrent || isPending ? 1 : 0.8
    }).addTo(map)

    // Créer le contenu du popup
    let popupContent = `
      <div style="text-align: center; font-family: Arial, sans-serif; padding: 8px;">
        <strong style="color: ${color}; font-size: 14px;">${label}</strong>
        <br><small style="color: #666;">Emplacement #${emplacement.id}</small>
    `

    if (isCurrent) {
      // MODIFICATION: Utiliser le texte personnalisé mis à jour selon la langue de l'utilisateur
      const currentLang = locale.value || 'fr'
      const customText = (popupText.value && typeof popupText.value === 'object' ? popupText.value[currentLang] : popupText.value) || 'Informations sur votre emplacement';
      popupContent += `
        <br><br>
        <p style="color: #333; font-size: 13px; margin: 8px 0; line-height: 1.4;">
          ${customText}
        </p>
        <br>
        <button
          onclick="window.libererEmplacementFromMap()"
          style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;"
        >
          🗑️ Libérer
        </button>
      `
    } else if (isPending) {
      popupContent += `
        <br><br>
        <button
          onclick="window.annulerDemandeFromMap()"
          style="background: #ff9800; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;"
        >
          ❌ Annuler la demande
        </button>
      `
    } else if (emplacement.statut === 'libre') {
      popupContent += `
        <br><br>
        <button
          onclick="window.demanderEmplacementFromMap('${coords}')"
          style="background: #4caf50; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;"
        >
          📨 Demander cet emplacement
        </button>
      `
    }

    popupContent += `</div>`

    marker.bindPopup(popupContent)

    if (isCurrent || isPending) {
      setInterval(() => {
        marker.setRadius(marker.getRadius() === radius ? radius + 2 : radius)
      }, 1000)
    }
  })

  // Exposer les fonctions
  window.demanderEmplacementFromMap = (coords) => {
    demanderEmplacement(coords)
  }

  window.annulerDemandeFromMap = () => {
    annulerDemande()
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

// MODIFICATION: Fonction globale pour sélectionner un emplacement depuis le popup
if (typeof window !== 'undefined') {
  window.demanderEmplacementFromMap = (coords) => {
    demanderEmplacement(coords)
  }

  window.annulerDemandeFromMap = () => {
    annulerDemande()
  }

  window.libererEmplacementFromMap = () => {
    libererEmplacement()
  }
}

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

  // AJOUT: Écouter les mises à jour
  window.addEventListener('emplacements-updated', loadPrestataireInfo)
  window.addEventListener('demandes-updated', loadPrestataireInfo)
})

// AJOUT: Watch pour initialiser la carte quand la section change
watch(selectedSection, (newVal) => {
  if (newVal === 'emplacement') {
    nextTick(() => {
      initMap()
    })
  }
})

// Watch pour recharger les données quand on change de langue d'édition
watch(editingLang, () => {
  // Recharger les données selon la nouvelle langue
  const customRaw = localStorage.getItem('customPrestataires')
  if (customRaw && prestataireNom.value) {
    try {
      const customPrestataires = JSON.parse(customRaw)
      const customData = customPrestataires[prestataireNom.value] || {}
      
      // Recharger presentationHtml selon la langue
      if (customData.presentationHtml && typeof customData.presentationHtml === 'object' && customData.presentationHtml.fr !== undefined) {
        presentationText.value = customData.presentationHtml[editingLang.value] || customData.presentationHtml.fr || ''
      } else if (typeof customData.presentationHtml === 'string') {
        presentationText.value = customData.presentationHtml
      }
    } catch (e) {
      console.error('Erreur rechargement données', e)
    }
  }
})
</script>

<template>
  <div class="prestataire-page">
    <div v-if="loading" class="loading">
      {{ $t('prestataireSpace.loading') }}
    </div>

    <div v-else-if="!isPrestataire" class="access-denied">
      <h2>{{ $t('prestataireSpace.accessDenied') }}</h2>
      <p>{{ $t('prestataireSpace.accessDeniedDesc') }}</p>
      <router-link to="/login" class="btn-primary">{{ $t('prestataireSpace.login') }}</router-link>
    </div>

    <div v-else-if="prestataireInfo" class="prestataire-content">
      <div class="prestataire-header">
        <div class="header-content">
          <div class="header-text">
            <h1>{{ $t('prestataireSpace.title') }}</h1>
            <p class="welcome">{{ $t('prestataireSpace.welcome') }} <strong>{{ prestataireNom }}</strong></p>
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
              <span>{{ $t('prestataireSpace.menuPresentation') }}</span>
            </li>
            <li :class="{ active: selectedSection === 'services' }" @click="selectedSection = 'services'">
              <span class="menu-icon">🛠️</span>
              <span>{{ $t('prestataireSpace.menuServices') }}</span>
            </li>
            <li :class="{ active: selectedSection === 'emplacement' }" @click="selectedSection = 'emplacement'">
              <span class="menu-icon">📍</span>
              <span>{{ $t('prestataireSpace.menuLocation') }}</span>
            </li>
            <li :class="{ active: selectedSection === 'stats' }" @click="selectedSection = 'stats'">
              <span class="menu-icon">📊</span>
              <span>{{ $t('prestataireSpace.menuStats') }}</span>
            </li>
            <li :class="{ active: selectedSection === 'config' }" @click="selectedSection = 'config'">
              <span class="menu-icon">⚙️</span>
              <span>{{ $t('prestataireSpace.menuConfig') }}</span>
            </li>
            <li :class="{ active: selectedSection === 'user' }" @click="selectedSection = 'user'">
              <span class="menu-icon">👤</span>
              <span>{{ $t('prestataireSpace.menuUser') }}</span>
            </li>
          </ul>
        </aside>

        <section class="main-panel">
          <!-- Présentation -->
          <div v-if="selectedSection === 'presentation'" class="section-content">
            <div class="section-header">
              <h2>{{ $t('prestataireSpace.presentationTitle') }}</h2>
              <p class="section-description">{{ $t('prestataireSpace.presentationDesc') }}</p>
            </div>
            
            <!-- Sélecteur de langue d'édition -->
            <div class="language-selector" style="margin-bottom: 20px;">
              <label style="font-weight: 600; color: #FCDC1E; margin-right: 12px;">{{ $t('prestataireSpace.editingLanguage') }}</label>
              <button 
                class="btn-lang" 
                :class="{ active: editingLang === 'fr' }"
                @click="changeEditingLang('fr')"
              >
                {{ $t('prestataireSpace.french') }}
              </button>
              <button 
                class="btn-lang" 
                :class="{ active: editingLang === 'en' }"
                @click="changeEditingLang('en')"
              >
                {{ $t('prestataireSpace.english') }}
              </button>
            </div>
            
            <div class="editor-actions">
              <button class="btn btn-primary" type="button" @click="savePresentation">
                {{ $t('prestataireSpace.save') }}
              </button>
            </div>

            <WysiwygEditor
                v-model="presentationText"
                :height="500"
                :placeholder="$t('prestataireSpace.presentationPlaceholder')"
            />

            <div class="form-group" style="margin-top: 20px;">
              <label>{{ $t('prestataireSpace.preview') }}</label>
              <div class="preview-box" v-html="presentationText"></div>
            </div>
          </div>

          <!-- Services -->
          <div v-if="selectedSection === 'services'" class="section-content">
            <div class="section-header">
              <h2>{{ $t('prestataireSpace.servicesTitle') }}</h2>
              <p class="section-description">{{ $t('prestataireSpace.servicesDesc') }}</p>
            </div>
            
            <!-- Sélecteur de langue d'édition -->
            <div class="language-selector" style="margin-bottom: 20px;">
              <label style="font-weight: 600; color: #FCDC1E; margin-right: 12px;">{{ $t('prestataireSpace.editingLanguage') }}</label>
              <button 
                class="btn-lang" 
                :class="{ active: editingLang === 'fr' }"
                @click="changeEditingLang('fr')"
              >
                {{ $t('prestataireSpace.french') }}
              </button>
              <button 
                class="btn-lang" 
                :class="{ active: editingLang === 'en' }"
                @click="changeEditingLang('en')"
              >
                {{ $t('prestataireSpace.english') }}
              </button>
            </div>
            
            <div class="services-actions">
              <button class="btn btn-primary" @click="addService">
                {{ $t('prestataireSpace.addService') }}
              </button>
            </div>
            <div class="services-grid" v-if="services.length">
              <div class="service-card" v-for="(s, idx) in services" :key="idx">
                <div class="service-card-header">
                  <input 
                    class="input input-title" 
                    :value="s.nom[editingLang] || ''" 
                    @input="s.nom[editingLang] = $event.target.value; updateServiceField()" 
                    :placeholder="$t('prestataireSpace.serviceName')" 
                  />
                  <button class="btn btn-danger btn-icon" @click="deleteService(idx)" :title="$t('prestataireSpace.delete')">
                    🗑️
                  </button>
                </div>
                <textarea 
                  class="textarea" 
                  :value="s.description[editingLang] || ''" 
                  @input="s.description[editingLang] = $event.target.value; updateServiceField()" 
                  :placeholder="$t('prestataireSpace.serviceDescription')"
                ></textarea>
                <div class="service-price-row">
                  <label class="price-label">
                    {{ $t('prestataireSpace.price') }}
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
                  <span v-else class="price-display free">{{ $t('prestataireSpace.free') }}</span>
                </div>
                <div class="service-toggles">
                  <label class="toggle-label">
                    <input type="checkbox" v-model="s.enabled" @change="toggleServiceEnabled(s)" />
                    <span :class="{ active: s.enabled }">{{ $t('prestataireSpace.enabled') }}</span>
                  </label>
                  <label class="toggle-label">
                    <input type="checkbox" v-model="s.public" @change="toggleServicePublic(s)" />
                    <span :class="{ active: s.public }">{{ $t('prestataireSpace.public') }}</span>
                  </label>
                </div>
              </div>
            </div>
            <div v-if="!services.length" class="empty-state">
              <p>{{ $t('prestataireSpace.noServices') }}</p>
              <p class="empty-hint">{{ $t('prestataireSpace.noServicesHint') }}</p>
            </div>
          </div>

          <!-- Emplacement -->
          <div v-if="selectedSection === 'emplacement'" class="section-content">
            <div class="section-header">
              <h2>{{ $t('prestataireSpace.locationTitle') }}</h2>
              <p class="section-description">{{ $t('prestataireSpace.locationDesc') }}</p>
            </div>

            <!-- AJOUT: Demande en attente -->
            <div v-if="demandePendante" class="demande-pendante-card">
              <div class="demande-header">
                <div class="demande-icon">⏳</div>
                <div class="demande-content">
                  <h3>{{ $t('prestataireSpace.pendingRequest') }}</h3>
                  <p class="demande-coords">{{ $t('prestataireSpace.requestedLocation') }} {{ demandePendante.coordonnees }}</p>
                  <p class="demande-date">{{ $t('prestataireSpace.requestedDate') }} {{ new Date(demandePendante.dateDemande).toLocaleString('fr-FR') }}</p>
                </div>
              </div>
              <button class="btn btn-danger" @click="annulerDemande">
                {{ $t('prestataireSpace.cancelRequest') }}
              </button>
            </div>

            <!-- Emplacement actuel -->
            <div v-if="emplacementActuel" class="emplacement-actuel">
              <h3>{{ $t('prestataireSpace.validatedLocation') }}</h3>
              <div class="emplacement-info">
                <span class="emplacement-coords">📌 {{ emplacementActuel.coordonnees }}</span>
                <span class="emplacement-date">{{ $t('prestataireSpace.attributedDate') }} {{ new Date(emplacementActuel.dateAttribution).toLocaleString('fr-FR') }}</span>
                <button class="btn btn-danger" @click="libererEmplacement">
                  {{ $t('prestataireSpace.releaseLocation') }}
                </button>
              </div>

              <!-- MODIFICATION: Formulaire pour personnaliser le texte de la popup (bilingue) -->
              <div class="popup-customization">
                <h4>{{ $t('prestataireSpace.customizePopup') }}</h4>
                <p class="popup-hint">{{ $t('prestataireSpace.popupHint') }}</p>
                
                <!-- Sélecteur de langue pour la popup -->
                <div class="language-selector" style="margin-bottom: 12px;">
                  <label style="font-weight: 600; color: #FCDC1E; margin-right: 12px;">{{ $t('prestataireSpace.editingLanguage') }}</label>
                  <button 
                    class="btn-lang" 
                    :class="{ active: editingLang === 'fr' }"
                    @click="editingLang = 'fr'"
                  >
                    {{ $t('prestataireSpace.french') }}
                  </button>
                  <button 
                    class="btn-lang" 
                    :class="{ active: editingLang === 'en' }"
                    @click="editingLang = 'en'"
                  >
                    {{ $t('prestataireSpace.english') }}
                  </button>
                </div>
                
                <textarea
                  v-model="currentPopupText"
                  class="textarea popup-textarea"
                  :placeholder="$t('prestataireSpace.popupPlaceholder')"
                  maxlength="200"
                ></textarea>
                <div class="char-counter">
                  {{ currentPopupText.length }} / 200 {{ $t('prestataireSpace.characters') }}
                </div>
                <button class="btn btn-primary btn-save-popup" @click="savePopupText">
                  {{ $t('prestataireSpace.validateAndUpdate') }}
                </button>
              </div>
            </div>

            <!-- Message si pas d'emplacement -->
            <div v-if="!emplacementActuel && !demandePendante" class="emplacement-vide">
              <p>{{ $t('prestataireSpace.noLocation') }}</p>
              <p class="empty-hint">{{ $t('prestataireSpace.noLocationHint') }}</p>
            </div>

            <!-- Carte interactive -->
            <div class="carte-container">
              <div ref="mapContainer" class="carte-map" id="prestataire-map"></div>

              <!-- Légende mise à jour -->
              <div class="carte-legende">
                <div class="legende-item">
                  <div class="legende-marker disponible"></div>
                  <span>{{ $t('prestataireSpace.available') }}</span>
                </div>
                <div class="legende-item">
                  <div class="legende-marker actuel"></div>
                  <span>{{ $t('prestataireSpace.yourValidatedLocation') }}</span>
                </div>
                <div class="legende-item">
                  <div class="legende-marker pending"></div>
                  <span>{{ $t('prestataireSpace.yourPendingRequest') }}</span>
                </div>
                <div class="legende-item">
                  <div class="legende-marker occupe"></div>
                  <span>{{ $t('prestataireSpace.occupied') }}</span>
                </div>
              </div>
            </div>


            <!-- Note d'information -->
            <div class="info-box">
              <strong>{{ $t('prestataireSpace.locationInfo') }}</strong>
              <p>{{ $t('prestataireSpace.locationInfoText') }}</p>
            </div>
          </div>

          <!-- ===========================
               Statistiques (VENTES UNIQUEMENT)
               =========================== -->
          <div v-if="selectedSection === 'stats'" class="section-content">
            <div class="section-header">
              <h2>{{ $t('prestataireSpace.statsTitle') }}</h2>
              <p class="section-description">
                {{ $t('prestataireSpace.statsDesc') }}
              </p>
            </div>

            <div class="stats-cards">
              <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-content">
                  <div class="stat-label">{{ $t('prestataireSpace.averageRating') }}</div>
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
                  <div class="stat-label">{{ $t('prestataireSpace.numberOfReviews') }}</div>
                  <div class="stat-value">{{ statsNotes.nbAvis }}</div>
                  <div class="stat-meta">{{ $t('prestataireSpace.publishedComments') }}</div>
                </div>
              </div>
            </div>

            <!-- Répartition des notes -->
            <div class="stats-section">
              <h3 class="stats-section-title">{{ $t('prestataireSpace.ratingDistribution') }}</h3>
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
                <p>{{ $t('prestataireSpace.noReviews') }}</p>
                <p class="empty-hint">
                  {{ $t('prestataireSpace.noReviewsHint') }}
                </p>
              </div>
            </div>

            <!-- Derniers avis -->
            <div class="stats-section" v-if="statsNotes.derniersAvis.length">
              <h3 class="stats-section-title">{{ $t('prestataireSpace.lastReviews') }}</h3>
              <div class="data-table-container">
                <table class="data-table transactions-table">
                  <thead>
                  <tr>
                    <th>{{ $t('prestataireSpace.date') }}</th>
                    <th>{{ $t('prestataireSpace.rating') }}</th>
                    <th>{{ $t('prestataireSpace.comment') }}</th>
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
              <h2>{{ $t('prestataireSpace.configTitle') }}</h2>
              <p class="section-description">{{ $t('prestataireSpace.configDesc') }}</p>
            </div>
            <div class="config-grid">
              <div class="config-item">
                <label>{{ $t('prestataireSpace.autoAssignment') }}</label>
                <select class="input">
                  <option>{{ $t('prestataireSpace.no') }}</option>
                  <option>{{ $t('prestataireSpace.byName') }}</option>
                  <option>{{ $t('prestataireSpace.byCategory') }}</option>
                </select>
              </div>
              <div class="config-item">
                <label>{{ $t('prestataireSpace.defaultVisibility') }}</label>
                <select class="input">
                  <option>{{ $t('prestataireSpace.publicDefault') }}</option>
                  <option>{{ $t('prestataireSpace.private') }}</option>
                </select>
              </div>
              <div class="config-actions">
                <button class="btn btn-primary" @click="() => alert(t('prestataireSpace.configSaved'))">
                  {{ $t('prestataireSpace.saveConfig') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Informations utilisateur -->
          <div v-if="selectedSection === 'user'" class="section-content">
            <div class="section-header">
              <h2>{{ $t('prestataireSpace.userInfoTitle') }}</h2>
              <p class="section-description">{{ $t('prestataireSpace.userInfoDesc') }}</p>
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>{{ $t('prestataireSpace.email') }}</label>
                <input class="input" type="email" v-model="userFields.email" placeholder="contact@exemple.com" />
              </div>
              <div class="form-row">
                <label>{{ $t('prestataireSpace.phone') }}</label>
                <input class="input" type="tel" v-model="userFields.tel" placeholder="+33 1 23 45 67 89" />
              </div>
              <div class="form-row">
                <label>{{ $t('prestataireSpace.website') }}</label>
                <input class="input" type="url" v-model="userFields.site" placeholder="https://exemple.com" />
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" @click="saveUserFields">
                {{ $t('prestataireSpace.saveChanges') }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="no-info">
      <h2>{{ $t('prestataireSpace.noInfo') }}</h2>
      <p>{{ $t('prestataireSpace.noInfoDesc') }}</p>
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

.legende-marker.pending {
  background: #ff9800;
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

.emplacement-date {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  margin: 8px 0;
}

code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
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

/* AJOUT: Styles pour la demande pendante */
.demande-pendante-card {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.08) 100%);
  border: 2px solid #ff9800;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  animation: pulse-demande 2s infinite;
}

@keyframes pulse-demande {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(255, 152, 0, 0.3);
  }
  50% {
    box-shadow: 0 8px 32px rgba(255, 152, 0, 0.5);
  }
}

.demande-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
}

.demande-icon {
  font-size: 3rem;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 152, 0, 0.2);
  border-radius: 50%;
  border: 3px solid #ff9800;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.demande-content h3 {
  color: #ff9800;
  margin: 0 0 8px 0;
  font-size: 1.2rem;
}

.demande-coords, .demande-date {
  margin: 4px 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

/* Sélecteur de langue */
.language-selector {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(252, 220, 30, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(252, 220, 30, 0.3);
}

.btn-lang {
  padding: 8px 16px;
  margin-left: 8px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-lang:hover {
  background: rgba(252, 220, 30, 0.15);
  border-color: rgba(252, 220, 30, 0.4);
}

.btn-lang.active {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #2046b3;
  border-color: #FCDC1E;
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
}

.popup-customization {
  margin-top: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(252, 220, 30, 0.2);
}

.popup-customization h4 {
  color: #FCDC1E;
  margin: 0 0 12px 0;
  font-size: 1.1rem;
}

.popup-hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.popup-textarea {
  min-height: 100px;
  resize: vertical;
}

.char-counter {
  margin-top: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: right;
}

.btn-save-popup {
  margin-top: 12px;
}
</style>

