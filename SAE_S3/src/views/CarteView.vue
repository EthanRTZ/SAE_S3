<template>
  <div class="carte">
    <h1>Carte</h1>

    <!-- Panneau de filtres: afficher les zones + filtrer les pins par catégories/sous-catégories -->
    <div class="map-toolbar">
      <!-- Toggles des zones -->
      <label><input type="checkbox" v-model="showCircle" /> Cercle</label>
      <label><input type="checkbox" v-model="showPolygon" /> Polygone</label>

      <span style="margin-left:12px;">Types:</span>

      <!-- Catégorie Restaurant (avec bouton pour enrouler/dérouler les sous-catégories) -->
      <div class="type-group">
        <label class="type-label">
          <!-- Flèche pour enrouler/dérouler la liste des sous-catégories -->
          <button
            type="button"
            class="collapse-btn"
            :aria-expanded="!collapsed.restaurant"
            @click.stop="toggleCollapse('restaurant')"
            title="Afficher/masquer les sous-catégories"
          >
            <span class="arrow" :class="{ open: !collapsed.restaurant }">▸</span>
          </button>
          <!-- Case principale: active/désactive toutes les sous-catégories -->
          <input type="checkbox" v-model="visibleTypes.restaurant._all" @change="syncTypeAll('restaurant')" />
          Restaurant
        </label>
        <!-- Sous-catégories de Restaurant (indentées) -->
        <div class="sub" v-if="visibleTypes.restaurant" v-show="!collapsed.restaurant">
          <label class="sub-item"><input type="checkbox" v-model="visibleTypes.restaurant.fastfood" /> Fast-food</label>
          <label class="sub-item"><input type="checkbox" v-model="visibleTypes.restaurant.gourmet" /> Gastronomique</label>
          <label class="sub-item"><input type="checkbox" v-model="visibleTypes.restaurant.cafe" /> Café</label>
        </div>
      </div>

      <!-- Catégorie Scène (avec bouton pour enrouler/dérouler) -->
      <div class="type-group">
        <label class="type-label">
          <button
            type="button"
            class="collapse-btn"
            :aria-expanded="!collapsed.scene"
            @click.stop="toggleCollapse('scene')"
            title="Afficher/masquer les sous-catégories"
          >
            <span class="arrow" :class="{ open: !collapsed.scene }">▸</span>
          </button>
          <input type="checkbox" v-model="visibleTypes.scene._all" @change="syncTypeAll('scene')" />
          Scène
        </label>
        <!-- Sous-catégories de Scène -->
        <div class="sub" v-if="visibleTypes.scene" v-show="!collapsed.scene">
          <label class="sub-item"><input type="checkbox" v-model="visibleTypes.scene.indoor" /> Indoor</label>
          <label class="sub-item"><input type="checkbox" v-model="visibleTypes.scene.outdoor" /> Outdoor</label>
        </div>
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

      // Etats d’affichage des zones
      showCircle: true,      // afficher/masquer le cercle
      showPolygon: true,     // afficher/masquer le polygone
      circleLayer: null,     // calque Leaflet du cercle
      polygonLayer: null,    // calque Leaflet du polygone

      // Catégories visibles avec leurs sous-catégories (structure de filtre)
      visibleTypes: {
        restaurant: { _all: true, fastfood: true, gourmet: true, cafe: true },
        scene:      { _all: true, indoor: true, outdoor: true },
      },

      // Données des marqueurs (exemples)
      // Chaque marqueur a un type (categorie) et subType (sous-catégorie) pour le filtrage
      markers: [
        { id: 'm1', type: 'restaurant', subType: 'gourmet',  lat: 47.304164, lng: 4.965223, title: 'Restaurant gastro' },
        { id: 'm2', type: 'restaurant', subType: 'fastfood', lat: 47.304500, lng: 4.965700, title: 'Fast-food' },
        { id: 'm3', type: 'scene',      subType: 'outdoor',  lat: 47.304700, lng: 4.966000, title: 'Scène extérieure' },
        { id: 'm4', type: 'scene',      subType: 'indoor',   lat: 47.303900, lng: 4.964900, title: 'Scène intérieure' },
      ],
      markerLayers: {}, // Dictionnaire id -> L.Marker pour manipuler facilement les calques

      // Référence à l’objet Leaflet (L) + vue initiale
      _L: null,
      lat: 47.304164,
      lng: 4.965223,
      zoom: 16.5,

      // Etat d’enroulage/déroulage des sous-listes
      collapsed: { restaurant: false, scene: false },
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
        this.map = L.map(this.$refs.mapContainer, { zoomSnap: 0 }).setView([this.lat, this.lng], this.zoom);

        // 2) Ajoute un fond de carte OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(this.map);

        // 3) Crée les zones (cercle + polygone) puis les ajoute selon leurs toggles
        // Cercle: périmètre de 250 m autour des coordonnées
        this.circleLayer = L.circle([this.lat, this.lng], {
          radius: 250,
          color: '#FCDC1E',
          weight: 2,
          fillColor: '#FCDC1E',
          fillOpacity: 0.2,
        }).bindPopup('Zone 250 m');
        if (this.showCircle) this.circleLayer.addTo(this.map);

        // Polygone: exemple de 4 points autour des coordonnées
        this.polygonLayer = L.polygon(
          [
            [this.lat + 0.0012, this.lng + 0.0015],
            [this.lat + 0.0012, this.lng - 0.0015],
            [this.lat - 0.001,  this.lng - 0.0012],
            [this.lat - 0.001,  this.lng + 0.0012],
          ],
          {
            color: '#e74c3c',
            weight: 2,
            fillColor: '#e74c3c',
            fillOpacity: 0.15,
          }
        ).bindPopup('Zone polygone');
        if (this.showPolygon) this.polygonLayer.addTo(this.map);

        // 4) Instancie les marqueurs (avec l’icône selon type/sous-type) puis applique le filtrage
        this.initMarkers();
        this.updateMarkersVisibility();
      })
      .catch((e) => console.error(e));
  },
  watch: {
    // Quand on coche/décoche le cercle
    showCircle(val) {
      if (!this.map || !this.circleLayer) return;
      val ? this.circleLayer.addTo(this.map) : this.map.removeLayer(this.circleLayer);
    },
    // Quand on coche/décoche le polygone
    showPolygon(val) {
      if (!this.map || !this.polygonLayer) return;
      val ? this.polygonLayer.addTo(this.map) : this.map.removeLayer(this.polygonLayer);
    },
    // Filtrage: toute modification des catégories/sous-catégories met à jour l’affichage des marqueurs
    visibleTypes: {
      deep: true,
      handler() {
        this.updateMarkersVisibility();
      },
    },
  },
  methods: {
    // Coche/decoche toutes les sous-catégories d’un type à partir de la case “_all”
    syncTypeAll(typeKey) {
      const group = this.visibleTypes[typeKey];
      if (!group) return;
      const val = !!group._all;
      Object.keys(group).forEach((k) => {
        if (k !== '_all') group[k] = val;
      });
      this.updateMarkersVisibility();
    },

    // Retourne une icône SVG colorée en fonction du type/sous-type
    // (divIcon sans fond/bordure grâce à la classe CSS pin-icon)
    getIconForType(type, subType) {
      const L = this._L;
      const colors = {
        restaurant: { _color: '#e67e22', fastfood: '#f39c12', gourmet: '#d35400', cafe: '#c97b1a' },
        scene:      { _color: '#8e44ad', indoor:  '#8e44ad',  outdoor: '#9b59b6' },
      };
      const palette = colors[type] || {};
      const color = palette[subType] || palette._color || '#2c3e50';
      const svg = `
        <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="${color}"/>
        </svg>
      `;
      return L.divIcon({
        html: svg,
        className: 'leaflet-div-icon pin-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -30],
      });
    },

    // Construit tous les marqueurs à partir des données (this.markers)
    // et mémorise type/sous-type sur le calque pour le filtrage ultérieur
    initMarkers() {
      const L = this._L;
      if (!L || !this.map) return;
      this.markerLayers = {};
      this.markers.forEach((m) => {
        const icon = this.getIconForType(m.type, m.subType);
        const layer = L.marker([m.lat, m.lng], { icon });
        layer._pinType = m.type;       // type principal
        layer._pinSubType = m.subType; // sous-catégorie
        layer.bindPopup(`${m.title}`);
        this.markerLayers[m.id] = layer;
      });
    },

    // Affiche ou cache les marqueurs selon le filtre visibleTypes
    // Règle: le type doit être “_all” + la sous-catégorie doit être cochée
    updateMarkersVisibility() {
      if (!this.map) return;
      Object.values(this.markerLayers).forEach((layer) => {
        const t = layer._pinType;
        const s = layer._pinSubType;
        const group = this.visibleTypes[t];
        const shouldShow = !!(group && group._all && group[s]);
        const onMap = this.map.hasLayer(layer);
        if (shouldShow && !onMap) layer.addTo(this.map);
        if (!shouldShow && onMap) this.map.removeLayer(layer);
      });
    },

    // Enroule/déroule l’affichage des sous-catégories d’une catégorie
    toggleCollapse(key) {
      this.collapsed[key] = !this.collapsed[key];
    },
  },
  beforeUnmount() {
    // Nettoyage Leaflet
    if (this.map) {
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
</style>
