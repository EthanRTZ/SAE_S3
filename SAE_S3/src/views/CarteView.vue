<template>
  <div class="carte" :class="{ embedded }">
    <div class="side-panel" :class="{ collapsed: panelCollapsed }">
      <div v-show="!panelCollapsed" class="panel-content">
        <h1>Carte</h1>
        <div class="map-toolbar">
          <span>Types prestataires:</span>
          <div class="types-filter">
            <label v-for="(val, type) in visibleTypes" :key="type" class="type-label">
              <input type="checkbox" v-model="visibleTypes[type]" /> {{ type }}
            </label>
          </div>
          <span style="margin-top:12px;">Types zones:</span>
          <div class="types-filter">
            <label v-for="(val, zt) in visibleZoneTypes" :key="'zone-'+zt" class="type-label">
              <input type="checkbox" v-model="visibleZoneTypes[zt]" /> {{ zt }}
            </label>
          </div>
          <!-- Nouveau bloc actions groupées -->
          <div class="bulk-actions">
            <button @click="selectAll">Tout cocher</button>
            <button @click="deselectAll">Tout décocher</button>
          </div>
        </div>
      </div>
    </div>
    <button
      v-if="showToggleButton"
      class="toggle-panel-btn"
      @click="togglePanel"
      :aria-label="panelCollapsed ? 'Ouvrir filtres' : 'Fermer filtres'">
      {{ panelCollapsed ? '❯' : '❮' }}
    </button>
    <div ref="mapContainer" id="map"></div>
  </div>
</template>

<script>
export default {
  name: 'CarteView',
  props: {
    embedded: { type: Boolean, default: false },
  },
  data() {
    return {
      // Instance Leaflet de la carte
      map: null,

      // Prestataires chargés depuis le JSON (avec coordonnées)
      prestataires: [],
      // Objet { type: boolean } pour le filtrage
      visibleTypes: {},
      // Dictionnaire id -> marker
      markerLayers: {},

      // Ajouts zones
      zones: [],
      visibleZoneTypes: {},
      zoneLayers: {},

      // Référence à l’objet Leaflet (L) + vue initiale
      _L: null,
      lat: 47.304164,
      lng: 4.965223,
      zoom: 16.4,

      // Panneau de filtres rétractable
      panelCollapsed: false,
    };
  },
  mounted() {
    if (typeof window === 'undefined') return;

    // Chargement de Leaflet via CDN (CSS + JS)
    const ver = '1.9.4';
    const cssHref = `https://unpkg.com/leaflet@${ver}/dist/leaflet.css`;
    const jsSrc = `https://unpkg.com/leaflet@${ver}/dist/leaflet.js`;

    // Injecte la feuille de style Leaflet si absente
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }

    // Fonction utilitaire: s’assure que Leaflet (window.L) est chargé avant d’initialiser la carte
    const ensureLeaflet = () =>
      new Promise((resolve, reject) => {
        if (window.L) return resolve(window.L);
        const existing = document.querySelector(`script[src="${jsSrc}"]`);
        if (existing) {
          const wait = () => (window.L ? resolve(window.L) : setTimeout(wait, 50));
          return wait();
        }
        const script = document.createElement('script');
        script.src = jsSrc;
        script.async = true;
        script.onload = () => resolve(window.L);
        script.onerror = () => reject(new Error('Leaflet load failed'));
        document.body.appendChild(script);
      });

    ensureLeaflet()
      .then((L) => {
        this._L = L;
        this.map = L.map(this.$refs.mapContainer, {
          zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: false,
            touchZoom: 'center',
            boxZoom: false,
            keyboard: false,
            dragging: true, // activé
            maxBoundsViscosity: 1.0
        }).setView([this.lat, this.lng], this.zoom);

        // Empêcher de dézoomer sous le zoom initial
        this.map.setMinZoom(this.zoom);
        this.map.setMaxZoom(19);

        // Définir les limites à la zone initialement affichée
        const initialBounds = this.map.getBounds();
        this.map.setMaxBounds(initialBounds);

        // 2) Ajoute un fond de carte OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(this.map);

        // Chargement des prestataires puis init des marqueurs
        this.loadPrestataires();
        this.loadZones();      // ajout
      })
      .catch((e) => console.error(e));
  },
  watch: {
    // Mise à jour quand on coche/décoche un type
    visibleTypes: {
      deep: true,
      handler() {
        this.updateMarkersVisibility();
      },
    },
    visibleZoneTypes: {
      deep: true,
      handler() {
        this.updateZonesVisibility();
      },
    },
  },
  computed: {
    // N’affiche le bouton que si la route correspond à la carte
    showToggleButton() {
      const r = this.$route;
      if (!r) return true; // fallback si pas de router
      return r.name === 'Carte' || /carte/i.test(r.path || '');
    },
  },
  methods: {
    // Charge le JSON et prépare les filtres + marqueurs
    async loadPrestataires() {
      try {
        const res = await fetch('/data/site.json');
        const data = await res.json();
        this.prestataires = (data.prestataires || []).filter(p => p.coordone);
        // Construit l’ensemble des types
        const typeSet = new Set(this.prestataires.map(a => a.type).filter(Boolean));
        const obj = {};
        typeSet.forEach(t => { obj[t] = true; });
        this.visibleTypes = obj;
        this.initMarkers();
        this.updateMarkersVisibility();
      } catch (e) {
        console.error('Erreur chargement activités', e);
      }
    },
    // Ajout: chargement des zones
    async loadZones() {
      try {
        const res = await fetch('/data/site.json');
        const data = await res.json();
        // Afficher toutes les zones
        this.zones = data.zones || [];
        // Construire les filtres sans la zone festival (toujours visible)
        const typeSet = new Set(this.zones.map(z => z.type).filter(t => t !== 'festival'));
        const obj = {};
        typeSet.forEach(t => { obj[t] = true; });
        this.visibleZoneTypes = obj;
        this.initZones();
        this.updateZonesVisibility();
      } catch (e) {
        console.error('Erreur chargement zones', e);
      }
    },

    // Couleur spécifique pour chaque type de service
    colorFromType(type) {
      const colorMap = {
        'Restauration': '#FF6B6B',      // Rouge/Corail
        'Boissons': '#4ECDC4',         // Turquoise
        'Services': '#45B7D1',         // Bleu clair
        'Mobilité': '#96CEB4',         // Vert menthe
        'Commerces & Équipements': '#FFE66D', // Jaune
        'Média & Animation': '#9B59B6',      // Violet vif
      };
      // Retourne la couleur du type ou une couleur par défaut si le type n'existe pas
      return colorMap[type] || '#888888';
    },

    // Génère une icône pour un type
    getIconForType(type) {
      const L = this._L;
      const color = this.colorFromType(type || '');
      const svg = `
        <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="${color}"/>
        </svg>
      `;
      return L.divIcon({
        html: svg,
        className: 'leaflet-div-icon pin-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28],
      });
    },

    // Crée les marqueurs depuis les prestataires
    initMarkers() {
      const L = this._L;
      if (!L || !this.map) return;
      this.markerLayers = {};
      let idx = 0;
      this.prestataires.forEach(a => {
        if (!a.coordone) return;
        const parts = a.coordone.split(',').map(s => parseFloat(s.trim()));
        if (parts.length !== 2 || parts.some(isNaN)) return;
        const [lat, lng] = parts;
        const icon = this.getIconForType(a.type);
        const layer = L.marker([lat, lng], { icon });
        const prestataireNom = encodeURIComponent(a.nom);
        const html = `
          <div class="popup-activite">
            <h3>${a.nom}</h3>
            <p><strong>Type:</strong> ${a.type}</p>
            ${a.description ? `<p>${a.description}</p>` : ''}
            <a href="/prestataire/${prestataireNom}" class="popup-link">Voir les détails →</a>
          </div>
        `;
        layer._pinType = a.type;
        layer.bindPopup(html);
        
        // Tooltip simple au survol (style similaire aux zones)
        layer.bindTooltip(`${a.nom} (${a.type})`, {
          permanent: false,
          direction: 'top',
          offset: [0, -10]
        });
        
        // Ajouter un gestionnaire de clic pour rediriger vers la page de détail
        layer.on('click', () => {
          this.$router.push(`/prestataire/${prestataireNom}`);
        });
        const id = `act_${idx++}`;
        this.markerLayers[id] = layer;
      });
    },

    getZoneColor(type) {
      if (type === 'parking') return '#0066FF';
      if (type === 'camping') return '#2ECC71';
      if (type === 'VIP') return '#9B59B6';
      if (type === 'festival') return '#FFD700'; // Jaune pour le festival
      return '#888888';
    },

    // Ajout: création des polygones zones
    initZones() {
      const L = this._L;
      if (!L || !this.map) return;
      this.zoneLayers = {};
      let idx = 0;
      this.zones.forEach(z => {
        if (!Array.isArray(z.coords) || z.coords.length < 3) return;
        const latlngs = [];
        for (const c of z.coords) {
          const parts = String(c).split(',').map(s => parseFloat(s.trim()));
          if (parts.length !== 2 || parts.some(isNaN)) return;
          latlngs.push([parts[0], parts[1]]);
        }
        const color = this.getZoneColor(z.type);
        
        // Traitement spécial pour la zone festival
        if (z.type === 'festival') {
          const layer = L.polygon(latlngs, {
            color: '#FFD700', // Jaune
            weight: 3,
            fillColor: 'transparent', // Pas de remplissage
            fillOpacity: 0,
            interactive: false, // Non cliquable
          });
          layer._zoneType = z.type;
          this.zoneLayers[`zone_${idx++}`] = layer;
        } else {
          // Zones normales (parking, camping, VIP)
          const layer = L.polygon(latlngs, {
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.25,
          }).bindPopup(`${z.nom} (${z.type})`);
          layer._zoneType = z.type;
          this.zoneLayers[`zone_${idx++}`] = layer;
        }
      });
    },

    // Affiche/cache selon visibleTypes
    updateMarkersVisibility() {
      if (!this.map) return;
      Object.values(this.markerLayers).forEach(layer => {
        const t = layer._pinType;
        const show = !!this.visibleTypes[t];
        const onMap = this.map.hasLayer(layer);
        if (show && !onMap) layer.addTo(this.map);
        if (!show && onMap) this.map.removeLayer(layer);
      });
    },
    // Ajout: visibilité zones
    updateZonesVisibility() {
      if (!this.map) return;
      Object.values(this.zoneLayers).forEach(layer => {
        const t = layer._zoneType;
        // La zone festival est toujours visible
        const show = t === 'festival' || !!this.visibleZoneTypes[t];
        const onMap = this.map.hasLayer(layer);
        if (show && !onMap) layer.addTo(this.map);
        if (!show && onMap) this.map.removeLayer(layer);
      });
    },
    togglePanel() {
      this.panelCollapsed = !this.panelCollapsed;
      this.$nextTick(() => { if (this.map) this.map.invalidateSize(); });
    },
    selectAll() {
      Object.keys(this.visibleTypes).forEach(k => { this.visibleTypes[k] = true; });
      Object.keys(this.visibleZoneTypes).forEach(k => { this.visibleZoneTypes[k] = true; });
    },
    deselectAll() {
      Object.keys(this.visibleTypes).forEach(k => { this.visibleTypes[k] = false; });
      Object.keys(this.visibleZoneTypes).forEach(k => { this.visibleZoneTypes[k] = false; });
    },
  },
  beforeUnmount() {
    // Nettoyage Leaflet
    if (this.map) {
      Object.values(this.markerLayers || {}).forEach(l => this.map.hasLayer(l) && this.map.removeLayer(l));
      Object.values(this.zoneLayers || {}).forEach(l => this.map.hasLayer(l) && this.map.removeLayer(l));
      this.map.remove();
      this.map = null;
    }
  },
};
</script>

<style scoped>
/* Layout plein écran avec panneau à gauche */
.carte {
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #fff;
}
/* En mode embedded: s'adapte au parent (pour HomeView) */
.carte.embedded {
  width: 100%;
  height: 100%;
}

/* Nouveau panneau latéral */
.side-panel {
  width: 300px;
  min-width: 300px;
  padding: 16px 18px 28px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #172c75 0%, #0f1d51 100%);
  color: #ffffff;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  position: relative;
  transition: width 0.25s ease;
  /* modifiez cette valeur */
}

.side-panel.collapsed {
  width: 0;
  min-width: 0;
  padding: 0;
  border-right: none;
  overflow: hidden;
}

.side-panel .panel-content {
  transition: opacity 0.2s ease;
}

.side-panel.collapsed .panel-content {
  opacity: 0;
  pointer-events: none;
}

.side-panel h1 {
  margin: 0 0 16px;
  font-size: 2rem;
}

/* Barre de filtres intégrée */
.map-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: transparent;
  padding: 0;
  box-shadow: none;
}

/* Conteneurs de filtres: fond basé sur la variable + priorité */
.types-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: var(--filter-bg) !important;
  /* si vous préférez un fond plus léger: utilisez rgba */
  /* background: rgba(255, 233, 168, 0.35) !important; */
  padding: 6px;
  border-radius: 6px;
}

/* Badges/étiquettes de filtre: appliquer le fond (texte inchangé) */
.type-label {
  font-weight: 600;
  background: var(--filter-bg) !important;
  padding: 4px 8px;
  border-radius: 4px;
}

/* Carte à droite */
#map {
  flex: 1;
  height: 100%;
  width: 100%;
  transition: width 0.25s ease;
}

.side-panel.collapsed ~ #map {
  width: 100%;
}

/* Icônes et autres styles existants */
:deep(.pin-icon) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0;
}

/* Bouton unique bas gauche */
.toggle-panel-btn {
  position: absolute;
  bottom: 14px;
  left: 14px;
  width: 42px;
  height: 42px;
  border-radius: 21px;
  border: 1px solid #d0d0d0;
  background: #fff;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  z-index: 1000;
  transition: background .2s;
}
.toggle-panel-btn:hover {
  background: #f5f5f5;
}

/* Suppression anciennes classes .collapse-btn / .collapse-btn-inner */

/* Nouveau style pour les boutons d'actions groupées */
.bulk-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.bulk-actions button {
  padding: 6px 10px;
  font-size: 0.75rem;
  background: #ffffff;
  border: 1px solid #d2d2d2;
  border-radius: 4px;
  cursor: pointer;
  transition: background .15s;
}
.bulk-actions button:hover {
  background: #f1f1f1;
}

/* Styles pour le popup des prestataires */
:deep(.popup-activite) {
  padding: 12px;
  min-width: 200px;
}

:deep(.popup-activite h3) {
  margin: 0 0 8px 0;
  color: #2046b3;
  font-size: 1.1rem;
}

:deep(.popup-activite p) {
  margin: 4px 0;
  color: #333;
  font-size: 0.9rem;
}

:deep(.popup-link) {
  display: inline-block;
  margin-top: 10px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 6px rgba(252, 220, 30, 0.3);
}

:deep(.popup-link:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(252, 220, 30, 0.4);
}

@media (max-width: 700px) {
  .toggle-panel-btn {
    bottom: 12px;
    left: 12px;
    width: 40px;
    height: 40px;
    border-radius: 20px;
  }
}
</style>
