<script setup>
import { ref, onMounted, watch, computed } from 'vue'

const props = defineProps({
  prestataires: { type: Array, default: () => [] },
  zones: { type: Array, default: () => [] },
  emplacements: { type: Array, default: () => [] },
  demandesEmplacement: { type: Array, default: () => [] },
  emplacementsAttribues: { type: Object, default: () => ({}) }
})

const emit = defineEmits([
  'accepterDemande',
  'refuserDemande',
  'assignerEmplacement',
  'libererEmplacement'
])

const mapContainer = ref(null)
let mapInstance = null

const demandesEnAttente = ref([])
const historiqueDemandes = ref([])

// Calculer les demandes en attente et l'historique
watch(() => props.demandesEmplacement, (newVal) => {
  demandesEnAttente.value = newVal.filter(d => d.statut === 'en_attente')
  historiqueDemandes.value = newVal
    .filter(d => d.statut === 'acceptee' || d.statut === 'refusee')
    .sort((a, b) => new Date(b.dateTraitement || 0) - new Date(a.dateTraitement || 0))
}, { immediate: true, deep: true })

const getEmplacementPrestataire = (nomPrestataire) => {
  return props.emplacementsAttribues[nomPrestataire] || null
}

// MODIFICATION: Fusionner les données JSON et localStorage pour les emplacements
const emplacementsAvecStatut = computed(() => {
  // 1. Partir des emplacements du JSON
  let emplacements = [...props.emplacements]

  // 2. Charger les attributions depuis localStorage (prioritaire)
  const emplacementsAttribuesLocal = { ...props.emplacementsAttribues }

  // 3. Fusionner : localStorage override JSON
  emplacements = emplacements.map(e => {
    // Vérifier si attribué dans localStorage
    const prestataireAttribueLocal = Object.entries(emplacementsAttribuesLocal).find(
      ([, coords]) => coords === e.coordonnees
    )

    if (prestataireAttribueLocal) {
      return {
        ...e,
        statut: 'pris',
        prestataireNom: prestataireAttribueLocal[0]
      }
    }

    // Vérifier si en attente dans les demandes
    const demandePendante = props.demandesEmplacement.find(
      d => d.coordonnees === e.coordonnees && d.statut === 'en_attente'
    )

    if (demandePendante) {
      return {
        ...e,
        statut: 'en_attente',
        prestataireNom: demandePendante.prestataireNom
      }
    }

    // Sinon utiliser le statut du JSON (mais ignorer les prestataires du JSON si override localStorage)
    return {
      ...e,
      statut: e.statut === 'pris' && !prestataireAttribueLocal ? 'libre' : e.statut
    }
  })

  return emplacements
})

// MODIFICATION: Fonction pour obtenir les infos complètes d'un emplacement
const getEmplacementInfo = (nomPrestataire) => {
  const coords = props.emplacementsAttribues[nomPrestataire]
  if (!coords) return null

  const emplacement = emplacementsAvecStatut.value.find(e => e.coordonnees === coords)
  return emplacement || { coordonnees: coords }
}

const initAdminMap = async () => {
  if (typeof window === 'undefined' || !mapContainer.value) return

  const ver = '1.9.4'
  const cssHref = `https://unpkg.com/leaflet@${ver}/dist/leaflet.css`
  const jsSrc = `https://unpkg.com/leaflet@${ver}/dist/leaflet.js`

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
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.head.appendChild(script)
  })

  try {
    const L = await loadLeaflet()

    if (mapInstance) {
      mapInstance.remove()
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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    const initialBounds = map.getBounds()
    map.setMaxBounds(initialBounds)

    mapInstance = map

    updateAdminMapMarkers()
    initAdminZones()
  } catch (e) {
    console.error('Erreur chargement carte:', e)
  }
}

const updateAdminMapMarkers = () => {
  if (!mapInstance || !window.L) return

  const L = window.L
  const map = mapInstance

  map.eachLayer((layer) => {
    if (layer instanceof L.CircleMarker) {
      map.removeLayer(layer)
    }
  })

  // MODIFICATION: Utiliser emplacementsAvecStatut computed qui fusionne JSON + localStorage
  emplacementsAvecStatut.value.forEach(emplacement => {
    const coords = emplacement.coordonnees
    const parts = coords.split(',').map(s => parseFloat(s.trim()))
    if (parts.length !== 2 || parts.some(isNaN)) return

    const [lat, lng] = parts

    let color = '#4caf50'
    let radius = 8
    let label = 'Disponible'

    if (emplacement.statut === 'pris') {
      color = '#FCDC1E'
      radius = 10
      label = `Occupé par ${emplacement.prestataireNom || 'Unknown'}`
    } else if (emplacement.statut === 'en_attente') {
      color = '#ff9800'
      radius = 9
      label = `En attente: ${emplacement.prestataireNom || 'Unknown'}`
    }

    const marker = L.circleMarker([lat, lng], {
      radius: radius,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map)

    // MODIFICATION: Améliorer le contenu du popup avec les infos du JSON
    let popupContent = `
      <div style="text-align: center; font-family: Arial, sans-serif; padding: 12px; min-width: 280px;">
        <strong style="color: ${color}; font-size: 16px; display: block; margin-bottom: 8px;">${label}</strong>
        <small style="color: #666; display: block; margin-bottom: 4px;">Emplacement #${emplacement.id}</small>
        <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 11px; display: block; margin-bottom: 12px;">${coords}</code>
    `

    // Afficher les infos supplémentaires si disponibles
    if (emplacement.nom_emplacement) {
      popupContent += `<div style="margin-bottom: 8px; font-size: 13px; color: #333;"><strong>📍 ${emplacement.nom_emplacement}</strong></div>`
    }
    if (emplacement.surface_volume) {
      popupContent += `<div style="font-size: 12px; color: #666;">📐 Surface: ${emplacement.surface_volume}</div>`
    }
    if (emplacement.nombre_prises) {
      popupContent += `<div style="font-size: 12px; color: #666;">🔌 ${emplacement.nombre_prises} prises</div>`
    }
    if (emplacement.acces_eau) {
      popupContent += `<div style="font-size: 12px; color: #666;">💧 Accès eau disponible</div>`
    }

    if (emplacement.statut === 'pris') {
      popupContent += `
        <button
          onclick="window.libererEmplacementFromAdminMap('${emplacement.prestataireNom}')"
          style="
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 700;
            width: 100%;
            margin-top: 12px;
            transition: transform 0.2s ease;
          "
          onmouseover="this.style.transform='translateY(-2px)'"
          onmouseout="this.style.transform='translateY(0)'"
        >
          🗑️ Libérer l'emplacement
        </button>
      `
    } else if (emplacement.statut === 'libre') {
      const prestataireOptions = props.prestataires
        .map(p => `<option value="${p.nom}">${p.nom}</option>`)
        .join('')

      popupContent += `
        <div style="margin-top: 12px;">
          <label style="display: block; color: #333; font-weight: 600; margin-bottom: 8px; font-size: 13px; text-align: left;">
            👤 Assigner à un prestataire :
          </label>
          <select
            id="prestataire-select-${emplacement.id}"
            style="
              width: 100%;
              padding: 10px;
              border-radius: 6px;
              border: 2px solid #ddd;
              font-size: 14px;
              margin-bottom: 10px;
              background: white;
              cursor: pointer;
            "
          >
            <option value="">-- Sélectionner --</option>
            ${prestataireOptions}
          </select>
          <button
            onclick="window.assignerEmplacementFromAdminMap('${coords}', ${emplacement.id})"
            style="
              background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
              color: #0a0a0a;
              border: none;
              padding: 10px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 700;
              width: 100%;
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            ✅ Assigner l'emplacement
          </button>
        </div>
      `
    } else if (emplacement.statut === 'en_attente') {
      popupContent += `
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button
            onclick="window.accepterDemandeFromAdminMap('${coords}')"
            style="
              flex: 1;
              background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
              color: white;
              border: none;
              padding: 10px 12px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 700;
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            ✅ Accepter
          </button>
          <button
            onclick="window.refuserDemandeFromAdminMap('${coords}')"
            style="
              flex: 1;
              background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
              color: white;
              border: none;
              padding: 10px 12px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 700;
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            ❌ Refuser
          </button>
        </div>
      `
    }

    popupContent += `</div>`

    marker.bindPopup(popupContent, {
      maxWidth: 360,
      className: 'admin-map-popup'
    })
  })

  // Exposer les fonctions globales pour les popups
  window.assignerEmplacementFromAdminMap = (coords, emplacementId) => {
    const selectElement = document.getElementById(`prestataire-select-${emplacementId}`)
    if (!selectElement) return

    const prestataireNom = selectElement.value
    if (!prestataireNom) {
      alert('⚠️ Veuillez sélectionner un prestataire')
      return
    }

    emit('assignerEmplacement', prestataireNom, coords)
    map.closePopup()
  }

  window.libererEmplacementFromAdminMap = (prestataireNom) => {
    emit('libererEmplacement', prestataireNom)
    map.closePopup()
  }

  window.accepterDemandeFromAdminMap = (coords) => {
    const demande = props.demandesEmplacement.find(d => d.coordonnees === coords && d.statut === 'en_attente')
    if (demande) {
      emit('accepterDemande', demande)
      map.closePopup()
    }
  }

  window.refuserDemandeFromAdminMap = (coords) => {
    const demande = props.demandesEmplacement.find(d => d.coordonnees === coords && d.statut === 'en_attente')
    if (demande) {
      emit('refuserDemande', demande)
      map.closePopup()
    }
  }
}

const initAdminZones = () => {
  const L = window.L
  if (!L || !mapInstance) return

  props.zones.forEach(z => {
    if (!Array.isArray(z.coords) || z.coords.length < 3) return
    const latlngs = []
    for (const c of z.coords) {
      const parts = String(c).split(',').map(s => parseFloat(s.trim()))
      if (parts.length !== 2 || parts.some(isNaN)) return
      latlngs.push([parts[0], parts[1]])
    }

    let layer
    if (z.type === 'festival') {
      layer = L.polygon(latlngs, {
        color: '#FFD700',
        weight: 3,
        fillColor: 'transparent',
        fillOpacity: 0,
        interactive: false,
      })
    } else if (z.type === 'scène') {
      const sceneColors = {
        'MOTHERSHIP': '#FF1744',
        'ZERO GRAVITY': '#00E5FF',
        'CARGO': '#FF9800',
        'ANTDT CLUB': '#E91E63',
      }
      const color = sceneColors[z.nom] || '#9C27B0'
      layer = L.polygon(latlngs, {
        color: color,
        weight: 4,
        fillColor: color,
        fillOpacity: 0.4,
        opacity: 0.9,
      }).bindPopup(`🎵 ${z.nom}${z.sponsor ? ` (by ${z.sponsor})` : ''}`)
    } else {
      const colorMap = {
        'parking': '#0066FF',
        'camping': '#2ECC71',
        'VIP': '#9B59B6'
      }
      const color = colorMap[z.type] || '#888888'
      layer = L.polygon(latlngs, {
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.25,
      }).bindPopup(`${z.nom} (${z.type})`)
    }

    layer.addTo(mapInstance)
  })
}

// Watcher pour rafraîchir la carte quand les données changent
watch(() => [props.emplacements, props.emplacementsAttribues, props.demandesEmplacement], () => {
  if (mapInstance) {
    updateAdminMapMarkers()
  }
}, { deep: true })

onMounted(() => {
  initAdminMap()
})
</script>

<template>
  <div class="section-content">
    <div class="section-header">
      <h1 class="section-title">Gestion de la carte et des emplacements</h1>
    </div>

    <div class="carte-config-wrapper">
      <div class="carte-intro-card">
        <div class="carte-intro-icon">🗺️</div>
        <div class="carte-intro-content">
          <h3>Gestion des emplacements</h3>
          <p>Gérez les demandes d'emplacements des prestataires en temps réel. Acceptez ou refusez leurs demandes, et assignez directement des emplacements si nécessaire.</p>
          <p class="success-info">✅ <strong>Système fonctionnel :</strong> Toutes les actions sont enregistrées et synchronisées instantanément !</p>
        </div>
      </div>

      <!-- Carte interactive -->
      <div class="carte-map-section">
        <div class="carte-map-header">
          <h2>📍 Carte interactive du festival</h2>
          <p>Vue d'ensemble de tous les emplacements et zones du festival</p>
          <button @click="initAdminMap" class="btn-refresh-map">
            🔄 Rafraîchir la carte
          </button>
        </div>

        <div class="admin-carte-container">
          <div ref="mapContainer" class="admin-carte-map" id="admin-map"></div>

          <div class="admin-carte-legende">
            <div class="legende-item">
              <div class="legende-marker disponible"></div>
              <span>Disponible</span>
            </div>
            <div class="legende-item">
              <div class="legende-marker attribue"></div>
              <span>Attribué</span>
            </div>
            <div class="legende-item">
              <div class="legende-marker en-attente"></div>
              <span>En attente</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Demandes en attente -->
      <div v-if="demandesEnAttente.length > 0" class="demandes-section">
        <div class="demandes-header">
          <h2 class="demandes-title">
            🔔 Demandes en attente ({{ demandesEnAttente.length }})
          </h2>
        </div>

        <div class="demandes-grid">
          <div
            v-for="demande in demandesEnAttente"
            :key="demande.id"
            class="demande-card"
          >
            <div class="demande-card-header">
              <div class="demande-icon">⏳</div>
              <div class="demande-info">
                <h3>{{ demande.prestataireNom }}</h3>
                <p class="demande-coords">📌 {{ demande.coordonnees }}</p>
                <p class="demande-date">📅 {{ new Date(demande.dateDemande).toLocaleString('fr-FR') }}</p>
              </div>
            </div>
            <div class="demande-actions">
              <button @click="$emit('accepterDemande', demande)" class="btn-accepter">
                ✅ Accepter
              </button>
              <button @click="$emit('refuserDemande', demande)" class="btn-refuser">
                ❌ Refuser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-demandes">
        <div class="no-demandes-icon">📭</div>
        <h3>Aucune demande en attente</h3>
        <p>Les nouvelles demandes d'emplacements apparaîtront ici.</p>
      </div>

      <!-- Historique -->
      <div v-if="historiqueDemandes.length > 0" class="historique-section">
        <h3 class="historique-title">📜 Historique des demandes</h3>
        <div class="historique-list">
          <div
            v-for="demande in historiqueDemandes.slice(0, 10)"
            :key="demande.id"
            class="historique-item"
            :class="{ acceptee: demande.statut === 'acceptee', refusee: demande.statut === 'refusee' }"
          >
            <div class="historique-icon">
              {{ demande.statut === 'acceptee' ? '✅' : '❌' }}
            </div>
            <div class="historique-details">
              <strong>{{ demande.prestataireNom }}</strong>
              <span class="historique-coords">{{ demande.coordonnees }}</span>
              <span class="historique-status">{{ demande.statut === 'acceptee' ? 'Acceptée' : 'Refusée' }}</span>
              <span v-if="demande.raison" class="historique-raison">Raison : {{ demande.raison }}</span>
              <span class="historique-date">{{ new Date(demande.dateTraitement).toLocaleString('fr-FR') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Attribution manuelle MODIFIÉE -->
      <div class="attribution-section">
        <div class="attribution-header">
          <h2 class="attribution-title">📋 Vue d'ensemble des prestataires</h2>
          <p class="attribution-subtitle">Consultez et gérez les emplacements de tous les prestataires</p>
        </div>

        <div class="attribution-grid">
          <div
            v-for="prestataire in prestataires"
            :key="prestataire.nom"
            class="attribution-card"
            :class="{ 'has-emplacement': getEmplacementInfo(prestataire.nom) }"
          >
            <div class="attribution-card-header">
              <div class="attribution-card-image-wrapper">
                <img
                  v-if="prestataire.image"
                  :src="prestataire.image"
                  :alt="prestataire.nom"
                  class="attribution-card-image"
                />
                <div v-else class="attribution-card-placeholder">
                  <span class="prest-placeholder-icon">🏢</span>
                </div>
              </div>
              <div class="attribution-card-info">
                <h4 class="attribution-card-name">{{ prestataire.nom }}</h4>
                <span class="attribution-card-type">{{ prestataire.type }}</span>
              </div>
            </div>

            <div class="attribution-card-body">
              <!-- MODIFICATION: Afficher les infos complètes de l'emplacement -->
              <div v-if="getEmplacementInfo(prestataire.nom)" class="emplacement-actuel-display">
                <div class="emplacement-status-header">
                  <span class="status-icon success">✅</span>
                  <span class="status-label">Emplacement attribué</span>
                </div>

                <div class="emplacement-info-grid">
                  <div class="emplacement-coords-display">
                    <span class="coords-label">📍 Coordonnées</span>
                    <code class="coords-value">{{ getEmplacementInfo(prestataire.nom).coordonnees }}</code>
                  </div>

                  <div v-if="getEmplacementInfo(prestataire.nom).nom_emplacement" class="emplacement-detail">
                    <span class="detail-label">🏷️ Nom</span>
                    <span class="detail-value">{{ getEmplacementInfo(prestataire.nom).nom_emplacement }}</span>
                  </div>

                  <div v-if="getEmplacementInfo(prestataire.nom).surface_volume" class="emplacement-detail">
                    <span class="detail-label">📐 Surface</span>
                    <span class="detail-value">{{ getEmplacementInfo(prestataire.nom).surface_volume }}</span>
                  </div>

                  <div v-if="getEmplacementInfo(prestataire.nom).nombre_prises" class="emplacement-detail">
                    <span class="detail-label">🔌 Prises</span>
                    <span class="detail-value">{{ getEmplacementInfo(prestataire.nom).nombre_prises }}</span>
                  </div>

                  <div v-if="getEmplacementInfo(prestataire.nom).acces_eau" class="emplacement-detail">
                    <span class="detail-label">💧 Eau</span>
                    <span class="detail-value">Disponible</span>
                  </div>

                  <div v-if="getEmplacementInfo(prestataire.nom).moyens_logistiques" class="emplacement-detail-full">
                    <span class="detail-label">🔧 Logistique</span>
                    <span class="detail-value">{{ getEmplacementInfo(prestataire.nom).moyens_logistiques }}</span>
                  </div>
                </div>

                <button
                  @click="$emit('libererEmplacement', prestataire.nom)"
                  class="btn-liberer-full"
                >
                  🗑️ Libérer l'emplacement
                </button>
              </div>

              <!-- Pas d'emplacement -->
              <div v-else class="emplacement-vide-display">
                <div class="emplacement-status-header">
                  <span class="status-icon warning">⚠️</span>
                  <span class="status-label">Aucun emplacement</span>
                </div>
                <p class="emplacement-hint">
                  Cliquez sur un emplacement disponible sur la carte ci-dessus pour l'assigner à ce prestataire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ...existing code from ancien_admin styles for carte section... */

.section-content {
  max-width: 1600px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 32px;
}

.section-title {
  color: var(--yellow, #FCDC1E);
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.carte-config-wrapper {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.carte-intro-card {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.2);
}

.carte-intro-icon {
  font-size: 3.5rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.2));
  border-radius: 20px;
  border: 2px solid rgba(168, 85, 247, 0.4);
  flex-shrink: 0;
}

.carte-intro-content {
  flex: 1;
}

.carte-intro-content h3 {
  color: var(--purple, #a855f7);
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 12px 0;
  text-transform: uppercase;
}

.carte-intro-content p {
  color: var(--text, #e5e7eb);
  font-size: 1rem;
  line-height: 1.7;
  margin: 0 0 8px 0;
}

.success-info {
  color: var(--green, #22c55e);
  font-weight: 600;
}

.carte-map-section {
  margin-bottom: 32px;
}

.carte-map-header {
  margin-bottom: 20px;
}

.carte-map-header h2 {
  color: var(--text, #e5e7eb);
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.carte-map-header p {
  color: var(--text-muted, rgba(148, 163, 184, 0.9));
  font-size: 0.95rem;
  margin: 0 0 16px 0;
}

.btn-refresh-map {
  background: linear-gradient(135deg, var(--blue, #3b82f6) 0%, #2563eb 100%);
  border: none;
  color: #fff;
  padding: 12px 24px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.btn-refresh-map:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);
}

.admin-carte-container {
  display: grid;
  grid-template-columns: minmax(0, 3.5fr) minmax(240px, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.admin-carte-map {
  height: 560px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid var(--border, rgba(148, 163, 184, 0.5));
  box-shadow: var(--shadow-md, 0 8px 28px rgba(15, 23, 42, 0.7));
}

.admin-carte-legende {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid var(--border, rgba(148, 163, 184, 0.5));
  border-radius: 16px;
}

.legende-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text, #e5e7eb);
}

.legende-marker {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.legende-marker.disponible { background: var(--green, #22c55e); }
.legende-marker.attribue { background: var(--yellow, #FCDC1E); }
.legende-marker.en-attente { background: var(--orange, #ff9800); }

/* AJOUT: Styles pour les cartes prestataires */
.demandes-section, .historique-section, .attribution-section {
  margin-bottom: 32px;
}

.demandes-header, .attribution-header {
  margin-bottom: 24px;
}

.demandes-title, .historique-title, .attribution-title {
  color: var(--text, #e5e7eb);
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.attribution-subtitle {
  color: var(--text-muted, rgba(148, 163, 184, 0.9));
  font-size: 1rem;
  margin: 0;
}

.demandes-grid, .attribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.demande-card, .attribution-card {
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid var(--border, rgba(148, 163, 184, 0.5));
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.demande-card:hover, .attribution-card:hover {
  transform: translateY(-4px);
  border-color: var(--blue, #3b82f6);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.9);
}

.attribution-card.has-emplacement {
  border-color: var(--yellow, #FCDC1E);
}

.demande-card-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.demande-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.demande-info h3 {
  color: var(--yellow, #FCDC1E);
  font-size: 1.2rem;
  margin: 0 0 8px 0;
}

.demande-coords, .demande-date {
  color: var(--text-muted, rgba(148, 163, 184, 0.9));
  font-size: 0.9rem;
  margin: 4px 0;
}

.demande-actions {
  display: flex;
  gap: 12px;
}

.btn-accepter {
  flex: 1;
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
}

.btn-accepter:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(34, 197, 94, 0.6);
}

.btn-refuser {
  flex: 1;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--red, #ef4444);
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  transition: all 0.3s ease;
}

.btn-refuser:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
}

.no-demandes {
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed var(--border-light, rgba(148, 163, 184, 0.3));
  border-radius: 20px;
  padding: 60px 32px;
  text-align: center;
}

.no-demandes-icon {
  font-size: 5rem;
  opacity: 0.3;
  display: block;
  margin-bottom: 20px;
}

.no-demandes h3 {
  color: var(--text, #e5e7eb);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.no-demandes p {
  color: var(--text-muted, rgba(148, 163, 184, 0.9));
  font-size: 1rem;
  margin: 0;
}

.historique-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.historique-item {
  display: flex;
  gap: 20px;
  align-items: start;
  padding: 20px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid var(--border, rgba(148, 163, 184, 0.5));
  border-radius: 16px;
}

.historique-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.historique-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.historique-details strong {
  color: var(--yellow, #FCDC1E);
  font-size: 1.05rem;
}

.historique-coords, .historique-status, .historique-raison, .historique-date {
  font-size: 0.9rem;
  color: var(--text-muted, rgba(148, 163, 184, 0.9));
}

/* Attribution cards */
.attribution-card-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.attribution-card-image-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
}

.attribution-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attribution-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
}

.prest-placeholder-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.attribution-card-info {
  flex: 1;
  min-width: 0;
}

.attribution-card-name {
  color: var(--yellow, #FCDC1E);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 6px 0;
}

.attribution-card-type {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(168, 85, 247, 0.2);
  color: var(--purple, #a855f7);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.attribution-card-body {
  margin-top: 16px;
}

.emplacement-actuel-display, .emplacement-vide-display {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light, rgba(148, 163, 184, 0.3));
  border-radius: 12px;
  padding: 16px;
}

.emplacement-status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-icon {
  font-size: 1.2rem;
}

.status-icon.success {
  color: var(--green, #22c55e);
}

.status-icon.warning {
  color: var(--orange, #ff9800);
}

.status-label {
  color: var(--text, #e5e7eb);
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
}

.emplacement-coords-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.coords-label {
  font-size: 0.85rem;
  color: var(--text-muted, rgba(148, 163, 184, 0.9));
  font-weight: 600;
}

.coords-value {
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--yellow, #FCDC1E);
  display: block;
}

.emplacement-hint {
  color: var(--text-muted, rgba(148, 163, 184, 0.9));
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}

.btn-liberer-full {
  width: 100%;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--red, #ef4444);
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-liberer-full:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
}

/* AJOUT: Styles pour la grille d'informations d'emplacement */
.emplacement-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.emplacement-detail {
  background: rgba(0, 0, 0, 0.2);
  padding: 10px 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.emplacement-detail-full {
  grid-column: 1 / -1;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-muted, rgba(148, 163, 184, 0.9));
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 0.9rem;
  color: var(--text, #e5e7eb);
  font-weight: 600;
}

.emplacement-coords-display {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 4px;
}

/* Responsive */
@media (max-width: 1024px) {
  .admin-carte-container {
    grid-template-columns: 1fr;
  }

  .demandes-grid, .attribution-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .carte-intro-card {
    flex-direction: column;
    text-align: center;
  }

  .demande-actions {
    flex-direction: column;
  }

  .btn-accepter, .btn-refuser {
    width: 100%;
  }
}
</style>
