<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const emit = defineEmits(['accepterDemande', 'refuserDemande', 'assignerEmplacement', 'libererEmplacement'])

const mapContainer = ref(null)
let mapInstance = null

// ─── État local (chargé indépendamment comme CarteView) ──────────────────────
const emplacements = ref([])
const prestataires = ref([])
const demandesEmplacement = ref([])
const emplacementsAttribues = ref({})

// ─── Computed ────────────────────────────────────────────────────────────────
const demandesEnAttente = computed(() =>
  demandesEmplacement.value.filter(d => d.statut === 'en_attente')
)
const historiqueDemandes = computed(() =>
  demandesEmplacement.value
    .filter(d => d.statut === 'acceptee' || d.statut === 'refusee')
    .sort((a, b) => new Date(b.dateTraitement || 0) - new Date(a.dateTraitement || 0))
)

const getEmplacementInfo = (nomPrestataire) =>
  emplacements.value.find(e => e.statut === 'pris' && e.prestataireNom === nomPrestataire) || null

// ─── Chargement des données (même logique que CarteView) ────────────────────
const loadAllData = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    // 1. Emplacements via API puis fallback JSON
    let emps = []
    try {
      const resp = await fetch('/api/emplacements', { headers })
      if (resp.ok) {
        const list = await resp.json()
        emps = (Array.isArray(list) ? list : []).map(e => ({
          ...e,
          coordonnees: e.coordonnees_completes || e.coordonnees,
          id: e.id_emplacement,
          statut: e.statut || 'libre'
        }))
      }
    } catch (e) { /* fallback */ }

    if (!emps.length) {
      const emplacementsRes = await fetch('/data/emplacements.json', { cache: 'no-store' })
      const emplacementsData = await emplacementsRes.json()
      emps = emplacementsData.emplacements || []
    }

    // 2. emplacementsInfo localStorage
    try {
      const infoRaw = localStorage.getItem('emplacementsInfo')
      if (infoRaw) {
        const info = JSON.parse(infoRaw)
        emps = emps.map(e => info[e.id] ? { ...e, ...info[e.id] } : e)
      }
    } catch (e) { /* ignore */ }

    // 3. emplacementsAttribues localStorage (prioritaire)
    let attribues = {}
    try {
      const attribuesRaw = localStorage.getItem('emplacementsAttribues')
      attribues = attribuesRaw ? JSON.parse(attribuesRaw) : {}
    } catch (e) { /* ignore */ }
    emplacementsAttribues.value = attribues

    emps = emps.map(e => {
      const attr = Object.entries(attribues).find(([, coords]) => coords === e.coordonnees)
      if (attr) return { ...e, statut: 'pris', prestataireNom: attr[0] }
      return e
    })

    // 4. demandesEmplacement localStorage + emplacements avec statut 'en_attente'
    let demandes = []
    try {
      const demandesRaw = localStorage.getItem('demandesEmplacement')
      demandes = demandesRaw ? JSON.parse(demandesRaw) : []
    } catch (e) { /* ignore */ }

    emps.forEach(e => {
      if (e.statut === 'en_attente' && e.prestataireNom) {
        const dejaPresente = demandes.find(d => d.coordonnees === e.coordonnees && d.statut === 'en_attente')
        if (!dejaPresente) {
          demandes.push({
            id: `json-${e.id}`,
            prestataireNom: e.prestataireNom,
            coordonnees: e.coordonnees,
            statut: 'en_attente',
            dateDemande: e.dateDemande || new Date().toISOString(),
            fromJson: true
          })
        }
      }
    })

    demandesEmplacement.value = demandes

    emps = emps.map(e => {
      if (e.statut === 'pris') return e
      const demande = demandes.find(d => d.coordonnees === e.coordonnees && d.statut === 'en_attente')
      if (demande) return { ...e, statut: 'en_attente', prestataireNom: demande.prestataireNom }
      return e
    })

    emplacements.value = emps

    // 5. Prestataires via API puis fallback JSON
    let prets = []
    try {
      const resp = await fetch('/api/prestataires', { headers })
      if (resp.ok) {
        const list = await resp.json()
        prets = (Array.isArray(list) ? list : []).map(p => ({
          ...p,
          description: p.description_fr || '',
          email: p.contact_email, tel: p.contact_tel, site: p.site_web,
          image: p.photo_url, type: p.type_prestataire
        }))
      }
    } catch (e) { /* fallback */ }

    if (!prets.length) {
      const prestRes = await fetch('/data/prestataires.json', { cache: 'no-store' })
      const prestData = await prestRes.json()
      prets = prestData.prestataires || []
    }

    try {
      const customRaw = localStorage.getItem('customPrestataires')
      const custom = customRaw ? JSON.parse(customRaw) : {}
      prets = prets.map(p => ({ ...p, ...(custom[p.nom] || {}) }))
    } catch (e) { /* ignore */ }
    prestataires.value = prets

    if (mapInstance) updateMarkers()
  } catch (e) {
    console.error('Erreur chargement AdminMap:', e)
  }
}

// ─── Actions (sauvegardent dans localStorage puis rechargent) ────────────────
const accepterDemande = (demande) => {
  if (!confirm(`Accepter la demande de ${demande.prestataireNom} ?`)) return
  try {
    const raw = localStorage.getItem('emplacementsAttribues')
    const attribues = raw ? JSON.parse(raw) : {}
    attribues[demande.prestataireNom] = demande.coordonnees
    localStorage.setItem('emplacementsAttribues', JSON.stringify(attribues))

    const demandesRaw = localStorage.getItem('demandesEmplacement')
    let demandes = demandesRaw ? JSON.parse(demandesRaw) : []
    const idx = demandes.findIndex(d => d.id === demande.id)
    if (idx !== -1) {
      demandes[idx].statut = 'acceptee'
      demandes[idx].dateTraitement = new Date().toISOString()
    } else {
      // Demande qui venait du JSON : la persister dans le localStorage avec statut acceptee
      demandes.push({ ...demande, statut: 'acceptee', dateTraitement: new Date().toISOString() })
    }
    localStorage.setItem('demandesEmplacement', JSON.stringify(demandes))
    emit('accepterDemande', demande)
    loadAllData()
  } catch (e) { console.error(e) }
}

const refuserDemande = (demande) => {
  if (!confirm(`Refuser la demande de ${demande.prestataireNom} ?`)) return
  try {
    const demandesRaw = localStorage.getItem('demandesEmplacement')
    let demandes = demandesRaw ? JSON.parse(demandesRaw) : []
    const idx = demandes.findIndex(d => d.id === demande.id)
    if (idx !== -1) {
      demandes[idx].statut = 'refusee'
      demandes[idx].dateTraitement = new Date().toISOString()
    } else {
      // Demande qui venait du JSON : la persister dans le localStorage avec statut refusee
      demandes.push({ ...demande, statut: 'refusee', dateTraitement: new Date().toISOString() })
    }
    localStorage.setItem('demandesEmplacement', JSON.stringify(demandes))
    emit('refuserDemande', demande)
    loadAllData()
  } catch (e) { console.error(e) }
}

const libererEmplacement = (nomPrestataire) => {
  if (!confirm(`Libérer l'emplacement de ${nomPrestataire} ?`)) return
  try {
    const raw = localStorage.getItem('emplacementsAttribues')
    const attribues = raw ? JSON.parse(raw) : {}
    delete attribues[nomPrestataire]
    localStorage.setItem('emplacementsAttribues', JSON.stringify(attribues))
    emit('libererEmplacement', nomPrestataire)
    loadAllData()
  } catch (e) { console.error(e) }
}

const assignerEmplacement = (nomPrestataire, coords) => {
  try {
    const raw = localStorage.getItem('emplacementsAttribues')
    const attribues = raw ? JSON.parse(raw) : {}
    attribues[nomPrestataire] = coords
    localStorage.setItem('emplacementsAttribues', JSON.stringify(attribues))
    emit('assignerEmplacement', nomPrestataire, coords)
    loadAllData()
  } catch (e) { console.error(e) }
}

// ─── Carte Leaflet ───────────────────────────────────────────────────────────
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
    script.src = jsSrc; script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.head.appendChild(script)
  })

  try {
    const L = await loadLeaflet()
    if (mapInstance) mapInstance.remove()
    const map = L.map(mapContainer.value, {
      center: [47.304164, 4.965223], zoom: 16.4,
      minZoom: 16.4, maxZoom: 19,
      zoomControl: true, scrollWheelZoom: true, maxBoundsViscosity: 1.0
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map)
    map.setMaxBounds(map.getBounds())
    mapInstance = map
    await loadAllData()
  } catch (e) { console.error('Erreur carte:', e) }
}

const updateMarkers = () => {
  if (!mapInstance || !window.L) return
  const L = window.L
  const map = mapInstance

  map.eachLayer(layer => { if (layer instanceof L.CircleMarker) map.removeLayer(layer) })

  emplacements.value.forEach(emplacement => {
    const parts = emplacement.coordonnees.split(',').map(s => parseFloat(s.trim()))
    if (parts.length !== 2 || parts.some(isNaN)) return
    const [lat, lng] = parts

    let color = '#4caf50'; let radius = 8
    if (emplacement.statut === 'pris') { color = '#FCDC1E'; radius = 10 }
    else if (emplacement.statut === 'en_attente') { color = '#ff9800'; radius = 9 }

    const marker = L.circleMarker([lat, lng], {
      radius, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
    }).addTo(map)

    const prest = emplacement.prestataireNom
      ? prestataires.value.find(p => p.nom === emplacement.prestataireNom)
      : null

    let popup = `<div style="font-family:Arial,sans-serif;padding:14px;min-width:260px;">`

    if (emplacement.statut === 'pris' && prest) {
      popup += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        ${prest.image ? `<img src="${prest.image}" alt="${prest.nom}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">` : `<div style="width:48px;height:48px;border-radius:8px;background:rgba(252,220,30,0.1);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🏢</div>`}
        <div><strong style="color:#FCDC1E;font-size:1rem;display:block;">${prest.nom}</strong>
        <span style="color:#aaa;font-size:0.8rem;">${prest.type || ''}</span></div></div>`
    } else if (emplacement.statut === 'pris') {
      popup += `<strong style="color:#FCDC1E;font-size:1rem;display:block;margin-bottom:8px;">🏢 ${emplacement.prestataireNom}</strong>`
    } else if (emplacement.statut === 'en_attente') {
      popup += `<strong style="color:#ff9800;font-size:1rem;display:block;margin-bottom:8px;">⏳ En attente : ${emplacement.prestataireNom}</strong>`
    } else {
      popup += `<strong style="color:#4caf50;font-size:1rem;display:block;margin-bottom:8px;">✅ Emplacement disponible</strong>`
    }

    popup += `<code style="background:#1a1a2e;color:#FCDC1E;padding:4px 8px;border-radius:6px;font-size:0.8rem;display:block;margin-bottom:8px;">${emplacement.coordonnees}</code>`
    if (emplacement.nom_emplacement) popup += `<div style="font-size:0.85rem;color:#ccc;margin-bottom:4px;">📍 ${emplacement.nom_emplacement}</div>`
    if (emplacement.surface_volume) popup += `<div style="font-size:0.85rem;color:#ccc;margin-bottom:4px;">📐 ${emplacement.surface_volume}</div>`
    if (emplacement.nombre_prises) popup += `<div style="font-size:0.85rem;color:#ccc;margin-bottom:4px;">🔌 ${emplacement.nombre_prises} prises</div>`
    if (emplacement.acces_eau) popup += `<div style="font-size:0.85rem;color:#ccc;margin-bottom:4px;">💧 Accès eau</div>`

    if (emplacement.statut === 'pris') {
      popup += `<button onclick="window._adm_liberer('${emplacement.prestataireNom}')" style="margin-top:10px;width:100%;background:linear-gradient(135deg,#f44336,#d32f2f);color:#fff;border:none;padding:9px;border-radius:8px;cursor:pointer;font-weight:700;font-size:0.85rem;">🗑️ Libérer l'emplacement</button>`
    } else if (emplacement.statut === 'libre' || !emplacement.statut) {
      const options = prestataires.value.map(p => `<option value="${p.nom}">${p.nom}</option>`).join('')
      popup += `<div style="margin-top:10px;">
        <select id="psel-${emplacement.id}" style="width:100%;padding:8px;border-radius:6px;border:1px solid #555;background:#1a1a2e;color:#fff;font-size:0.85rem;margin-bottom:8px;">
          <option value="">-- Sélectionner --</option>${options}
        </select>
        <button onclick="window._adm_assigner('${emplacement.coordonnees}',${emplacement.id})" style="width:100%;background:linear-gradient(135deg,#FCDC1E,#ffe676);color:#0a0a0a;border:none;padding:9px;border-radius:8px;cursor:pointer;font-weight:700;font-size:0.85rem;">✅ Assigner</button>
      </div>`
    } else if (emplacement.statut === 'en_attente') {
      popup += `<div style="margin-top:10px;display:flex;gap:8px;">
        <button onclick="window._adm_accepter('${emplacement.coordonnees}')" style="flex:1;background:linear-gradient(135deg,#4caf50,#388e3c);color:#fff;border:none;padding:9px;border-radius:8px;cursor:pointer;font-weight:700;font-size:0.85rem;">✅ Accepter</button>
        <button onclick="window._adm_refuser('${emplacement.coordonnees}')" style="flex:1;background:linear-gradient(135deg,#f44336,#d32f2f);color:#fff;border:none;padding:9px;border-radius:8px;cursor:pointer;font-weight:700;font-size:0.85rem;">❌ Refuser</button>
      </div>`
    }

    popup += `</div>`
    marker.bindPopup(popup, {
      maxWidth: 300,
      className: 'admin-map-popup',
      autoPan: true,
      autoPanPaddingTopLeft: [20, 80],
      autoPanPaddingBottomRight: [20, 20],
      keepInView: true
    })
  })

  window._adm_assigner = (coords, id) => {
    const sel = document.getElementById(`psel-${id}`)
    if (!sel?.value) { alert('⚠️ Sélectionnez un prestataire'); return }
    assignerEmplacement(sel.value, coords)
    map.closePopup()
  }
  window._adm_liberer = (nom) => { libererEmplacement(nom); map.closePopup() }
  window._adm_accepter = (coords) => {
    const d = demandesEmplacement.value.find(d => d.coordonnees === coords && d.statut === 'en_attente')
    if (d) { accepterDemande(d); map.closePopup() }
  }
  window._adm_refuser = (coords) => {
    const d = demandesEmplacement.value.find(d => d.coordonnees === coords && d.statut === 'en_attente')
    if (d) { refuserDemande(d); map.closePopup() }
  }
}

// Écouter les mises à jour externes (depuis AdminView)
const handleUpdate = () => loadAllData()

onMounted(() => {
  initAdminMap()
  window.addEventListener('emplacements-updated', handleUpdate)
  window.addEventListener('demandes-updated', handleUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener('emplacements-updated', handleUpdate)
  window.removeEventListener('demandes-updated', handleUpdate)
  if (mapInstance) { mapInstance.remove(); mapInstance = null }
})
</script>

<template>
  <div class="section-content">
    <div class="section-header">
      <h1 class="section-title">Gestion des emplacements</h1>
    </div>

    <div class="carte-wrapper">

      <!-- Carte -->
      <div class="carte-map-block">
        <div class="carte-map-header">
          <h2>📍 Carte des stands</h2>
          <div class="legende">
            <span class="dot disponible"></span> Disponible
            <span class="dot attribue"></span> Attribué
            <span class="dot en-attente"></span> En attente
          </div>

        </div>
        <div ref="mapContainer" class="carte-map" id="admin-map"></div>
      </div>

      <!-- Demandes en attente -->
      <div v-if="demandesEnAttente.length > 0" class="block-section">
        <h2 class="block-title">🔔 Demandes en attente ({{ demandesEnAttente.length }})</h2>
        <div class="cards-grid">
          <div v-for="demande in demandesEnAttente" :key="demande.id" class="demande-card">
            <div class="demande-top">
              <strong>{{ demande.prestataireNom }}</strong>
              <span>📌 {{ demande.coordonnees }}</span>
              <span>📅 {{ new Date(demande.dateDemande).toLocaleString('fr-FR') }}</span>
            </div>
            <div class="demande-actions">
              <button @click="accepterDemande(demande)" class="btn-accepter">✅ Accepter</button>
              <button @click="refuserDemande(demande)" class="btn-refuser">❌ Refuser</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-demandes">
        <span>📭</span>
        <p>Aucune demande en attente</p>
      </div>

      <!-- Historique -->
      <div v-if="historiqueDemandes.length > 0" class="block-section">
        <h2 class="block-title">📜 Historique des demandes</h2>
        <div class="historique-list">
          <div
            v-for="demande in historiqueDemandes.slice(0, 10)"
            :key="demande.id"
            class="historique-item"
            :class="demande.statut"
          >
            <span>{{ demande.statut === 'acceptee' ? '✅' : '❌' }}</span>
            <div>
              <strong>{{ demande.prestataireNom }}</strong>
              <span>{{ demande.coordonnees }}</span>
              <span>{{ demande.statut === 'acceptee' ? 'Acceptée' : 'Refusée' }}</span>
              <span v-if="demande.raison">Raison : {{ demande.raison }}</span>
              <span>{{ new Date(demande.dateTraitement).toLocaleString('fr-FR') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cartes prestataires -->
      <div class="block-section">
        <h2 class="block-title">🏢 Stands des prestataires</h2>
        <p class="block-subtitle">Cliquez sur un emplacement disponible sur la carte pour l'assigner.</p>
        <div class="cards-grid">
          <div
            v-for="prestataire in prestataires"
            :key="prestataire.nom"
            class="prest-card"
            :class="{ assigned: getEmplacementInfo(prestataire.nom) }"
          >
            <!-- En-tête prestataire -->
            <div class="prest-card-header">
              <div class="prest-img-wrap">
                <img v-if="prestataire.image" :src="prestataire.image" :alt="prestataire.nom" />
                <span v-else>🏢</span>
              </div>
              <div>
                <h4>{{ prestataire.nom }}</h4>
                <span class="type-badge">{{ prestataire.type }}</span>
              </div>
            </div>

            <!-- Infos du stand si attribué -->
            <div v-if="getEmplacementInfo(prestataire.nom)" class="stand-info">
              <div class="stand-status">
                <span class="dot-green">✅</span>
                <span>Emplacement attribué</span>
              </div>
              <code class="coords">{{ getEmplacementInfo(prestataire.nom).coordonnees }}</code>
              <div class="stand-details">
                <div v-if="getEmplacementInfo(prestataire.nom).nom_emplacement" class="detail">
                  <span>🏷️ Nom</span>
                  <strong>{{ getEmplacementInfo(prestataire.nom).nom_emplacement }}</strong>
                </div>
                <div v-if="getEmplacementInfo(prestataire.nom).surface_volume" class="detail">
                  <span>📐 Surface</span>
                  <strong>{{ getEmplacementInfo(prestataire.nom).surface_volume }}</strong>
                </div>
                <div v-if="getEmplacementInfo(prestataire.nom).nombre_prises" class="detail">
                  <span>🔌 Prises</span>
                  <strong>{{ getEmplacementInfo(prestataire.nom).nombre_prises }}</strong>
                </div>
                <div v-if="getEmplacementInfo(prestataire.nom).acces_eau" class="detail">
                  <span>💧 Eau</span>
                  <strong>Disponible</strong>
                </div>
                <div v-if="getEmplacementInfo(prestataire.nom).moyens_logistiques" class="detail full">
                  <span>🔧 Logistique</span>
                  <strong>{{ getEmplacementInfo(prestataire.nom).moyens_logistiques }}</strong>
                </div>
              </div>
              <button @click="$emit('libererEmplacement', prestataire.nom)" class="btn-liberer">
                🗑️ Libérer l'emplacement
              </button>
            </div>

            <!-- Pas d'emplacement -->
            <div v-else class="stand-vide">
              <span>⚠️ Aucun emplacement attribué</span>
              <p>Cliquez sur un point vert sur la carte pour assigner cet emplacement.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.section-content { max-width: 1600px; margin: 0 auto; }

.section-title {
  color: #FCDC1E;
  font-size: 2rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 28px 0;
}

.carte-wrapper { display: flex; flex-direction: column; gap: 32px; }

/* Carte */
.carte-map-block {}
.carte-map-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.carte-map-header h2 { color: #e5e7eb; font-size: 1.3rem; font-weight: 800; margin: 0; }

.legende {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.85rem;
  color: #aaa;
  font-weight: 600;
}
.dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  margin-right: 4px;
  vertical-align: middle;
}
.dot.disponible { background: #4caf50; }
.dot.attribue   { background: #FCDC1E; }
.dot.en-attente { background: #ff9800; }

.carte-map {
  height: 520px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(148,163,184,0.3);
  box-shadow: 0 8px 28px rgba(0,0,0,0.5);
}


/* Sections */
.block-section {}
.block-title {
  color: #e5e7eb;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 6px 0;
}
.block-subtitle { color: #94a3b8; font-size: 0.95rem; margin: 0 0 20px 0; }

/* Grid cartes */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

/* Demandes */
.demande-card {
  background: rgba(15,23,42,0.97);
  border: 1px solid rgba(148,163,184,0.3);
  border-radius: 14px;
  padding: 18px;
}
.demande-top {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}
.demande-top strong { color: #FCDC1E; font-size: 1rem; }
.demande-top span { color: #94a3b8; font-size: 0.85rem; }
.demande-actions { display: flex; gap: 10px; }
.btn-accepter {
  flex: 1; background: linear-gradient(135deg,#4caf50,#388e3c);
  border: none; color: #fff; padding: 9px; border-radius: 999px;
  cursor: pointer; font-weight: 800; font-size: 0.85rem; transition: all 0.2s;
}
.btn-accepter:hover { transform: translateY(-2px); }
.btn-refuser {
  flex: 1; background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.4); color: #ef4444;
  padding: 9px; border-radius: 999px; cursor: pointer;
  font-weight: 800; font-size: 0.85rem; transition: all 0.2s;
}
.btn-refuser:hover { background: rgba(239,68,68,0.25); transform: translateY(-2px); }

/* No demandes */
.no-demandes {
  text-align: center;
  padding: 40px;
  border: 2px dashed rgba(148,163,184,0.2);
  border-radius: 16px;
  color: #94a3b8;
}
.no-demandes span { font-size: 3rem; display: block; margin-bottom: 12px; opacity: 0.4; }

/* Historique */
.historique-list { display: flex; flex-direction: column; gap: 12px; }
.historique-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px;
  background: rgba(15,23,42,0.97);
  border: 1px solid rgba(148,163,184,0.2);
  border-radius: 12px;
  font-size: 0.9rem;
}
.historique-item.acceptee { border-color: rgba(76,175,80,0.3); }
.historique-item.refusee  { border-color: rgba(239,68,68,0.3); }
.historique-item div { display: flex; flex-direction: column; gap: 3px; }
.historique-item strong { color: #FCDC1E; }
.historique-item span { color: #94a3b8; }

/* Cartes prestataires */
.prest-card {
  background: rgba(15,23,42,0.97);
  border: 1px solid rgba(148,163,184,0.25);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s;
}
.prest-card:hover { transform: translateY(-3px); border-color: #3b82f6; box-shadow: 0 10px 32px rgba(0,0,0,0.4); }
.prest-card.assigned { border-color: #FCDC1E; }

.prest-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.prest-img-wrap {
  width: 54px; height: 54px; border-radius: 12px; overflow: hidden;
  background: rgba(252,220,30,0.08); display: flex; align-items: center;
  justify-content: center; font-size: 1.8rem; flex-shrink: 0;
}
.prest-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.prest-card-header h4 { color: #FCDC1E; font-size: 1.1rem; font-weight: 800; margin: 0 0 5px 0; }
.type-badge {
  display: inline-block; padding: 2px 10px;
  background: rgba(168,85,247,0.15); color: #a855f7;
  border: 1px solid rgba(168,85,247,0.3); border-radius: 999px;
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
}

/* Stand info */
.stand-info {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(148,163,184,0.2);
  border-radius: 12px;
  padding: 14px;
}
.stand-status {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px; font-size: 0.85rem;
  font-weight: 700; color: #e5e7eb; text-transform: uppercase;
}
.dot-green { color: #22c55e; }
.coords {
  display: block;
  background: rgba(0,0,0,0.3);
  color: #FCDC1E;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  margin-bottom: 12px;
  font-family: monospace;
}
.stand-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}
.detail {
  background: rgba(0,0,0,0.2);
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail.full { grid-column: 1 / -1; }
.detail span { font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
.detail strong { font-size: 0.85rem; color: #e5e7eb; }

.btn-liberer {
  width: 100%;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.35);
  color: #ef4444;
  padding: 9px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-liberer:hover { background: rgba(239,68,68,0.22); transform: translateY(-1px); }

/* Stand vide */
.stand-vide {
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(148,163,184,0.2);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}
.stand-vide span { color: #ff9800; font-size: 0.85rem; font-weight: 700; display: block; margin-bottom: 6px; }
.stand-vide p { color: #94a3b8; font-size: 0.82rem; margin: 0; line-height: 1.5; }

@media (max-width: 768px) {
  .cards-grid { grid-template-columns: 1fr; }
  .demande-actions { flex-direction: column; }
  .stand-details { grid-template-columns: 1fr; }
}
</style>
