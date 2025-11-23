<template>
  <div class="carte">
    <h1>Carte</h1>

    <!-- Panneau de filtres: afficher les zones + filtrer les pins par catégories/sous-catégories -->
    <div class="map-toolbar">
      <!-- Suppression des toggles Cercle / Polygone -->

      <span>Types activités:</span>

      <!-- Nouveau filtre dynamique -->
      <div class="types-filter">
        <label v-for="(val, type) in visibleTypes" :key="type" class="type-label">
          <input type="checkbox" v-model="visibleTypes[type]" /> {{ type }}
        </label>
      </div>
      <!-- Ajout: filtre des types de zones -->
      <span style="margin-left:12px;">Types zones:</span>
      <div class="types-filter">
        <label v-for="(val, zt) in visibleZoneTypes" :key="'zone-'+zt" class="type-label">
          <input type="checkbox" v-model="visibleZoneTypes[zt]" /> {{ zt }}
        </label>
      </div>
    </div>

    <!-- Conteneur Leaflet (la carte sera montée ici) -->
    <div ref="mapContainer" id="map"></div>
  </div>
</template>

<script>
export default {
  name: 'CarteView',
  data() {
    return {
      // Instance Leaflet de la carte
      map: null,

      // Activités chargées depuis le JSON
      activities: [],
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
      zoom: 16.5,
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

        // 1) Crée la carte, centre la vue et autorise le zoom décimal (zoomSnap: 0)
        this.map = L.map(this.$refs.mapContainer, {
          zoomSnap: 0,
          zoomControl: false,        // enlève les boutons +
          scrollWheelZoom: false,    // molette
          doubleClickZoom: false,    // double-clic
          touchZoom: false,          // pinch
          boxZoom: false,            // shift + drag
          keyboard: false,           // touches +/- ou flèches
          dragging: false             // mettre false si carte totalement figée
        }).setView([this.lat, this.lng], this.zoom);

// Verrouiller le zoom (empêche tout changement programmatique)
        this.map.setMinZoom(this.zoom);
        this.map.setMaxZoom(this.zoom);

        // 2) Ajoute un fond de carte OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(this.map);

        // Chargement des activités puis init des marqueurs
        this.loadActivities();
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
  methods: {
    // Charge le JSON et prépare les filtres + marqueurs
    async loadActivities() {
      try {
        const res = await fetch('/data/activite.json');
        this.activities = await res.json();
        // Construit l’ensemble des types
        const typeSet = new Set(this.activities.map(a => a.type).filter(Boolean));
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
        const res = await fetch('/data/zone.json');
        let data = await res.json();
        // Ne garder que parking/camping
        data = data.filter(z => ['parking', 'camping'].includes(z.type));
        this.zones = data;
        const typeSet = new Set(this.zones.map(z => z.type));
        const obj = {};
        typeSet.forEach(t => { obj[t] = true; });
        this.visibleZoneTypes = obj;
        this.initZones();
        this.updateZonesVisibility();
      } catch (e) {
        console.error('Erreur chargement zones', e);
      }
    },

    // Couleur dérivée du nom du type (hash -> HSL)
    colorFromType(type) {
      const h = type.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
      return `hsl(${h},70%,45%)`;
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

    // Crée les marqueurs depuis activities
    initMarkers() {
      const L = this._L;
      if (!L || !this.map) return;
      this.markerLayers = {};
      let idx = 0;
      this.activities.forEach(a => {
        if (!a.coordone) return;
        const parts = a.coordone.split(',').map(s => parseFloat(s.trim()));
        if (parts.length !== 2 || parts.some(isNaN)) return;
        const [lat, lng] = parts;
        const icon = this.getIconForType(a.type);
        const layer = L.marker([lat, lng], { icon });
        const html = `
          <div class="popup-activite">
            <h3>${a.nom}</h3>
            <p><strong>Type:</strong> ${a.type}</p>
            ${a.description ? `<p>${a.description}</p>` : ''}
          </div>
        `;
        layer._pinType = a.type;
        layer.bindPopup(html);
        const id = `act_${idx++}`;
        this.markerLayers[id] = layer;
      });
    },

    getZoneColor(type) {
      if (type === 'parking') return '#0066FF';
      if (type === 'camping') return '#2ECC71';
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
        const layer = L.polygon(latlngs, {
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.25,
        }).bindPopup(`${z.nom} (${z.type})`);
        layer._zoneType = z.type;
        this.zoneLayers[`zone_${idx++}`] = layer;
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
        const show = !!this.visibleZoneTypes[t];
        const onMap = this.map.hasLayer(layer);
        if (show && !onMap) layer.addTo(this.map);
        if (!show && onMap) this.map.removeLayer(layer);
      });
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
.carte {
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: white;
}

.carte h1 {
  color: #FCDC1E;
  font-size: 3rem;
  margin-bottom: 20px;
}

/* Panneau de filtres au-dessus de la carte */
.map-toolbar {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

/* Bloc d’une catégorie et sa liste de sous-catégories */
.type-group {
  display: flex;
  flex-direction: column;
  margin: 0 8px;
}

.type-label {
  font-weight: 600;
}

/* Sous-catégories indentées sous la catégorie */
.sub {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 24px;
  margin-top: 4px;
}

.sub-item {
  line-height: 1.2;
}

/* Conteneur Leaflet */
#map {
  width: 100%;
  max-width: 1200px;
  height: 800px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

/* Icônes SVG sans fond/bordure (pins custom) */
:deep(.pin-icon) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0;
}

/* Bouton/flèche d’enroulage des sous-catégories */
.collapse-btn {
  background: none;
  border: 0;
  padding: 0 4px 0 0;
  margin-right: 4px;
  cursor: pointer;
  line-height: 1;
}
.arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}
.arrow.open {
  transform: rotate(90deg);
}

.types-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 600px;
}
.type-label {
  font-weight: 600;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
