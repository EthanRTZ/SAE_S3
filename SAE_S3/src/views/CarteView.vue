<template>
  <div class="carte" :class="{ embedded }">
    <div class="side-panel" :class="{ collapsed: panelCollapsed }">
      <div v-show="!panelCollapsed" class="panel-content">
        <h1>{{ $t('carte.title') }}</h1>
        <div class="map-toolbar">
          <span>{{ $t('carte.providerTypes') }}</span>
          <div class="types-filter">
            <label v-for="(val, type) in visibleTypes" :key="type" class="type-label">
              <input type="checkbox" v-model="visibleTypes[type]" /> {{ type }}
            </label>
          </div>
          <span style="margin-top:12px;">{{ $t('carte.zoneTypes') }}</span>
          <div class="types-filter">
            <label v-for="(val, zt) in visibleZoneTypes" :key="'zone-'+zt" class="type-label">
              <input type="checkbox" v-model="visibleZoneTypes[zt]" /> {{ zt }}
            </label>
          </div>
          <!-- Nouveau bloc actions groupées -->
          <div class="bulk-actions">
            <button @click="selectAll">{{ $t('carte.selectAll') }}</button>
            <button @click="deselectAll">{{ $t('carte.deselectAll') }}</button>
          </div>
        </div>
      </div>
    </div>
    <button
      v-if="showToggleButton"
      class="toggle-panel-btn"
      @click="togglePanel"
      :aria-label="panelCollapsed ? $t('carte.openFilters') : $t('carte.closeFilters')">
      {{ panelCollapsed ? '❯' : '❮' }}
    </button>
    <div ref="mapContainer" id="map"></div>
    
    <!-- AJOUT: Modal pour le formulaire d'emplacement -->
    <div v-if="showEmplacementForm" class="emplacement-form-modal" @click.self="closeEmplacementForm">
      <div class="emplacement-form-modal-content">
        <EmplacementForm
          :emplacement="selectedEmplacement"
          :is-edit="formMode === 'edit'"
          @save="saveEmplacementInfo"
          @cancel="closeEmplacementForm"
        />
      </div>
    </div>
  </div>
</template>

<script>
import EmplacementForm from '@/components/EmplacementForm.vue'

export default {
  name: 'CarteView',
  components: {
    EmplacementForm
  },
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

      // Emplacements disponibles et choisis
      emplacementsDisponibles: [],
      emplacementsChoisis: {}, // { prestataireNom: "coordonnées" }
      emplacementsLibresMarkers: {}, // Marqueurs pour emplacements vides

      // Ajouts zones
      zones: [],
      visibleZoneTypes: {},
      zoneLayers: {},
      zoneMarkers: {}, // Marqueurs de symboles pour les zones

      // Équipements (toilettes, points d'eau)
      equipements: [],
      equipementLayers: {},

      // Référence à l'objet Leaflet (L) + vue initiale
      _L: null,
      lat: 47.304164,
      lng: 4.965223,
      zoom: 16.4,

      // Panneau de filtres rétractable
      panelCollapsed: false,

      // MODIFICATION: Emplacements avec statut
      emplacements: [], // Tous les emplacements avec leur statut
      
      // AJOUT: Gestion du formulaire d'emplacement
      showEmplacementForm: false,
      selectedEmplacement: null,
      formMode: 'add' // 'add' ou 'edit'
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

    // Fonction utilitaire: s'assure que Leaflet (window.L) est chargé avant d'initialiser la carte
    const ensureLeaflet = () =>
      new Promise((resolve, reject) => {
        if (window.L) return resolve(window.L);
        const existing = document.querySelector(`script[src="${jsSrc}"]`);
        if (existing) {
          const wait = () => (window.L ? resolve(window.L) : setTimeout(wait, 50));
          return wait();
        }
        try {
          const script = document.createElement('script');
          script.src = jsSrc;
          script.async = true;
          script.onload = () => resolve(window.L);
          script.onerror = () => reject(new Error('Leaflet load failed'));
          document.body.appendChild(script);
        } catch (e) {
          reject(e);
        }
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
        this.loadEquipements(); // ajout équipements

        // Écouter les mises à jour d'emplacements
        window.addEventListener('emplacement-updated', () => {
          this.loadPrestataires();
        });
        
        // AJOUT: Écouter les changements d'authentification pour mettre à jour les popups
        this.handleAuthChanged = () => {
          this.initEmplacementsLibres();
        };
        window.addEventListener('auth-changed', this.handleAuthChanged);
        
        // AJOUT: Fonction globale pour ouvrir le formulaire depuis les popups
        window.openEmplacementForm = (emplacementId) => {
          this.openEmplacementForm(emplacementId);
        };
      })
      .catch((e) => console.error(e));
  },
  watch: {
    '$i18n.locale'() {
      this.loadPrestataires();
      this.$nextTick(() => {
        if (this.map) {
          this.updateMarkersVisibility();
        }
      });
    },
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
    // N'affiche le bouton que si la route correspond à la carte
    showToggleButton() {
      const r = this.$route;
      if (!r) return true; // fallback si pas de router
      return r.name === 'Carte' || /carte/i.test(r.path || '');
    },
    // AJOUT: Vérification de l'authentification et du rôle
    authUser() {
      try {
        const raw = localStorage.getItem('authUser');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    isAuthenticated() {
      return !!this.authUser;
    },
    userRole() {
      return this.authUser?.role || 'user';
    },
    isAdmin() {
      return this.userRole === 'admin';
    },
    isPrestataire() {
      return this.userRole === 'prestataire';
    },
    prestataireNom() {
      return this.authUser?.prestataireNom || '';
    },
  },
  methods: {
    // MODIFICATION: Charger les emplacements avec statut
    async loadPrestataires() {
      try {
        const [emplacementsRes, zonesRes] = await Promise.all([
          fetch('/data/emplacements.json'),
          fetch('/data/zones.json')
        ]);
        const emplacementsData = await emplacementsRes.json();
        const zonesData = await zonesRes.json();

        // Charger les emplacements avec statut
        this.emplacements = emplacementsData.emplacements || [];
        this.zones = zonesData.zones || [];
        
        // AJOUT: Charger les informations d'emplacement depuis localStorage
        try {
          const emplacementsInfoRaw = localStorage.getItem('emplacementsInfo');
          if (emplacementsInfoRaw) {
            const emplacementsInfo = JSON.parse(emplacementsInfoRaw);
            this.emplacements = this.emplacements.map(e => {
              const info = emplacementsInfo[e.id];
              if (info) {
                return { ...e, ...info };
              }
              return e;
            });
          }
        } catch (e) {
          console.error('Erreur chargement informations emplacements', e);
        }

        // AJOUT: Charger les personnalisations des prestataires
        let customPrestataires = {};
        try {
          const customRaw = localStorage.getItem('customPrestataires');
          customPrestataires = customRaw ? JSON.parse(customRaw) : {};
        } catch (e) {
          console.error('Erreur chargement custom prestataires', e);
        }

        // Charger les emplacements attribués depuis localStorage
        try {
          const emplacementsRaw = localStorage.getItem('emplacementsAttribues')
          const emplacementsAttribues = emplacementsRaw ? JSON.parse(emplacementsRaw) : {}

          // Mettre à jour le statut des emplacements
          this.emplacements = this.emplacements.map(e => {
            const prestataireAttribue = Object.entries(emplacementsAttribues).find(
              ([, coords]) => coords === e.coordonnees
            )

            if (prestataireAttribue) {
              return {
                ...e,
                statut: 'pris',
                prestataireNom: prestataireAttribue[0]
              }
            }
            return e
          })
        } catch (e) {
          console.error('Erreur chargement emplacements attribués', e)
        }

        // Charger les demandes en attente
        try {
          const demandesRaw = localStorage.getItem('demandesEmplacement')
          const demandes = demandesRaw ? JSON.parse(demandesRaw) : []

          // Mettre à jour le statut des emplacements avec demande en attente
          this.emplacements = this.emplacements.map(e => {
            const demandePendante = demandes.find(
              d => d.coordonnees === e.coordonnees && d.statut === 'en_attente'
            )

            if (demandePendante && e.statut !== 'pris') {
              return {
                ...e,
                statut: 'en_attente',
                prestataireNom: demandePendante.prestataireNom
              }
            }
            return e
          })
        } catch (e) {
          console.error('Erreur chargement demandes', e)
        }

        // Charger les prestataires (avec support bilingue)
        const prestatairesRes = await fetch('/data/prestataires.json');
        const prestatairesData = await prestatairesRes.json();
        const currentLang = this.$i18n?.locale || 'fr';
        this.prestataires = (prestatairesData.prestataires || []).map(p => {
          // Chercher l'emplacement attribué au prestataire
          const emplacement = this.emplacements.find(e =>
            (e.statut === 'pris' || e.statut === 'en_attente') &&
            e.prestataireNom === p.nom
          );

          // Normaliser le format bilingue depuis prestataires.json
          let prestataire = { ...p };
          
          // Gérer la description bilingue depuis prestataires.json
          if (p.description && typeof p.description === 'object' && p.description.fr !== undefined) {
            prestataire.description = p.description[currentLang] || p.description.fr || '';
          }
          
          // Gérer les services bilingues depuis prestataires.json
          if (p.services && Array.isArray(p.services)) {
            prestataire.services = p.services.map(s => {
              const service = { ...s };
              // Si c'est le format bilingue
              if (s.nom && typeof s.nom === 'object' && s.nom.fr !== undefined) {
                service.nom = s.nom[currentLang] || s.nom.fr || '';
                service.description = (s.description && typeof s.description === 'object' && s.description.fr !== undefined) 
                  ? (s.description[currentLang] || s.description.fr || '')
                  : (s.description || '');
              }
              return service;
            });
          }

          // AJOUT: Appliquer les personnalisations (avec support bilingue)
          const custom = customPrestataires[p.nom] || {};
          
          // Gérer popupText bilingue
          if (custom.popupText) {
            if (typeof custom.popupText === 'object' && custom.popupText.fr !== undefined) {
              prestataire.popupText = custom.popupText[currentLang] || custom.popupText.fr || '';
            } else if (typeof custom.popupText === 'string') {
              prestataire.popupText = custom.popupText;
            }
          }
          
          // Copier les autres champs
          if (custom.email) prestataire.email = custom.email;
          if (custom.tel) prestataire.tel = custom.tel;
          if (custom.site) prestataire.site = custom.site;

          if (emplacement) {
            return { ...prestataire, coordone: emplacement.coordonnees };
          }
          return prestataire;
        });

        // Construit l'ensemble des types
        const typeSet = new Set(this.prestataires.map(a => a.type).filter(Boolean));
        const obj = {};
        typeSet.forEach(t => { obj[t] = true; });
        this.visibleTypes = obj;

        this.initMarkers();
        this.initEmplacementsLibres();
        this.updateMarkersVisibility();
      } catch (e) {
        console.error('Erreur chargement activités', e);
      }
    },
    // Ajout: chargement des zones
    async loadZones() {
      try {
        const res = await fetch('/data/zones.json');
        const data = await res.json();
        // Afficher toutes les zones
        this.zones = data.zones || [];
        // Construire les filtres sans la zone festival et les scènes (toujours visibles)
        const typeSet = new Set(this.zones.map(z => z.type).filter(t => t !== 'festival' && t !== 'scène'));
        const obj = {};
        typeSet.forEach(t => { obj[t] = true; });
        this.visibleZoneTypes = obj;
        this.initZones();
        this.updateZonesVisibility();
      } catch (e) {
        console.error('Erreur chargement zones', e);
      }
    },
    // Ajout: chargement des équipements (toilettes, points d'eau)
    async loadEquipements() {
      try {
        const res = await fetch('/data/equipements.json');
        const data = await res.json();
        this.equipements = data.equipements || [];
        this.initEquipements();
      } catch (e) {
        console.error('Erreur chargement équipements', e);
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
        'Point d\'eau': '#2196F3',     // Bleu pour l'eau
        'Toilettes': '#9E9E9E',        // Gris pour les toilettes
      };
      // Retourne la couleur du type ou une couleur par défaut si le type n'existe pas
      return colorMap[type] || '#888888';
    },

    // Génère une icône pour un type
    getIconForType(type) {
      const L = this._L;
      const color = this.colorFromType(type || '');

      let svg = '';

      // Icône spéciale pour les points d'eau (goutte d'eau)
      if (type === 'Point d\'eau') {
        svg = `
          <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.69c0 0 5.66 5.66 5.66 9.66 0 4-4.53 7.16-5.66 7.16s-5.66-3.16-5.66-7.16c0-4 5.66-9.66 5.66-9.66z" fill="${color}" stroke="#FFFFFF" stroke-width="1.2"/>
            <circle cx="12" cy="10" r="2.5" fill="#FFFFFF" opacity="0.9"/>
          </svg>
        `;
      }
      // Icône spéciale pour les toilettes
      else if (type === 'Toilettes') {
        svg = `
          <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="${color}" stroke="#FFFFFF" stroke-width="1.5"/>
            <text x="12" y="17" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">WC</text>
          </svg>
        `;
      }
      // Icône par défaut (pin) pour les autres types
      else {
        svg = `
          <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="${color}"/>
          </svg>
        `;
      }

      return L.divIcon({
        html: svg,
        className: 'leaflet-div-icon pin-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28],
      });
    },

    // Génère une icône pour un emplacement vide
    getEmptyLocationIcon() {
      const L = this._L;
      const svg = `
        <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="#cccccc" stroke="#666666" stroke-width="0.5"/>
        </svg>
      `;
      return L.divIcon({
        html: svg,
        className: 'leaflet-div-icon pin-icon empty-location-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28],
      });
    },

    // MODIFICATION: Initialise les marqueurs pour les emplacements libres
    initEmplacementsLibres() {
      const L = this._L;
      if (!L || !this.map) return;
      
      // AJOUT: Récupérer les informations d'authentification
      let authUser = null;
      try {
        const raw = localStorage.getItem('authUser');
        authUser = raw ? JSON.parse(raw) : null;
      } catch (e) {
        authUser = null;
      }
      const userRole = authUser?.role || 'user';
      const isAdmin = userRole === 'admin';
      const isPrestataire = userRole === 'prestataire';
      const prestataireNom = authUser?.prestataireNom || '';

      // Nettoyer les anciens marqueurs d'emplacements libres
      Object.values(this.emplacementsLibresMarkers).forEach(m => {
        if (this.map.hasLayer(m)) this.map.removeLayer(m);
      });
      this.emplacementsLibresMarkers = {};

      // Créer un marqueur pour chaque emplacement
      this.emplacements.forEach((emplacement) => {
        const coords = emplacement.coordonnees;
        const parts = coords.split(',').map(s => parseFloat(s.trim()));
        if (parts.length !== 2 || parts.some(isNaN)) return;
        const [lat, lng] = parts;

        let color = '#4caf50'; // Vert - disponible
        let radius = 8;
        let label = 'Disponible';
        let fillOpacity = 0.8;

        if (emplacement.statut === 'pris') {
          color = '#FCDC1E'; // Jaune - occupé
          radius = 10;
          label = 'Attribué';
          fillOpacity = 0.9;
        } else if (emplacement.statut === 'en_attente') {
          color = '#ff9800'; // Orange - en attente
          radius = 9;
          label = 'En attente';
          fillOpacity = 0.85;
        }

        const marker = L.circleMarker([lat, lng], {
          radius: radius,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: fillOpacity
        });

        let html = '';
        if (emplacement.statut === 'libre') {
          // Vérifier si l'emplacement a des informations
          const hasInfo = emplacement.nom_emplacement || 
                         emplacement.moyens_logistiques || 
                         emplacement.surface_volume || 
                         emplacement.nombre_prises || 
                         emplacement.acces_eau || 
                         emplacement.description;
          
          // Construire les informations de l'emplacement
          const emplacementInfoParts = [];
          if (emplacement.nom_emplacement) {
            emplacementInfoParts.push(`<p class="emplacement-info-title"><strong>📍 ${emplacement.nom_emplacement}</strong></p>`);
          }
          if (emplacement.surface_volume) {
            emplacementInfoParts.push(`<p class="emplacement-info">${this.$t('carte.surface')}: ${emplacement.surface_volume}</p>`);
          }
          if (emplacement.nombre_prises) {
            emplacementInfoParts.push(`<p class="emplacement-info">${this.$t('carte.outlets')}: ${emplacement.nombre_prises}</p>`);
          }
          if (emplacement.acces_eau) {
            emplacementInfoParts.push(`<p class="emplacement-info">✓ ${this.$t('carte.water')}</p>`);
          }
          if (emplacement.moyens_logistiques) {
            emplacementInfoParts.push(`<p class="emplacement-info"><small>${emplacement.moyens_logistiques}</small></p>`);
          }
          
          // AJOUT: Vérifier si l'utilisateur peut modifier les informations
          const canEditEmplacement = isAdmin;
          
          if (!hasInfo) {
            // Emplacement vide - bouton "Saisir les informations"
            html = `
              <div class="popup-prestataire-emplacement">
                <h3 class="prestataire-nom">${label}</h3>
                <p class="prestataire-type"><strong>Emplacement #${emplacement.id}</strong></p>
                <p class="coordinates" style="margin: 8px 0; font-family: monospace; font-size: 0.8rem; color: rgba(255,255,255,0.7);">${coords}</p>
                ${canEditEmplacement ? `
                  <button onclick="window.openEmplacementForm(${emplacement.id})" class="btn-add-info">
                    ${this.$t('carte.addLocationInfo')}
                  </button>
                ` : ''}
              </div>
            `;
          } else {
            // Emplacement avec infos - afficher infos + bouton "Modifier"
            html = `
              <div class="popup-prestataire-emplacement">
                <h3 class="prestataire-nom">${emplacement.nom_emplacement || 'Emplacement #' + emplacement.id}</h3>
                <p class="status-badge status-libre">${label}</p>
                ${emplacementInfoParts.length > 0 ? `<div class="emplacement-infos-section">${emplacementInfoParts.join('')}</div>` : ''}
                ${canEditEmplacement ? `
                  <button onclick="window.openEmplacementForm(${emplacement.id})" class="btn-edit-info">
                    ${this.$t('carte.editLocation')}
                  </button>
                ` : ''}
              </div>
            `;
          }

          marker.bindPopup(html, {
            maxWidth: 300,
            className: 'prestataire-popup'
          });

          marker.bindTooltip(this.$t('carte.availableLocation'), {
            permanent: false,
            direction: 'top',
            offset: [0, -10]
          });
        } else {
          // Emplacement occupé ou en attente - afficher les infos du prestataire + infos emplacement
          const prestataire = this.prestataires.find(p => p.nom === emplacement.prestataireNom);
          const prestataireNom = encodeURIComponent(emplacement.prestataireNom || '');
          
          // AJOUT: Vérifier si l'emplacement a des informations
          const hasEmplacementInfo = emplacement.nom_emplacement || 
                                    emplacement.moyens_logistiques || 
                                    emplacement.surface_volume || 
                                    emplacement.nombre_prises || 
                                    emplacement.acces_eau || 
                                    emplacement.description;
          
          // AJOUT: Construire les informations de l'emplacement
          const emplacementInfoParts = [];
          if (emplacement.nom_emplacement) {
            emplacementInfoParts.push(`<p class="emplacement-info-title"><strong>📍 ${emplacement.nom_emplacement}</strong></p>`);
          }
          if (emplacement.surface_volume) {
            emplacementInfoParts.push(`<p class="emplacement-info">${this.$t('carte.surface')}: ${emplacement.surface_volume}</p>`);
          }
          if (emplacement.nombre_prises) {
            emplacementInfoParts.push(`<p class="emplacement-info">${this.$t('carte.outlets')}: ${emplacement.nombre_prises}</p>`);
          }
          if (emplacement.acces_eau) {
            emplacementInfoParts.push(`<p class="emplacement-info">✓ ${this.$t('carte.water')}</p>`);
          }
          if (emplacement.moyens_logistiques) {
            emplacementInfoParts.push(`<p class="emplacement-info"><small>${emplacement.moyens_logistiques}</small></p>`);
          }

          // AJOUT: Vérifier si l'utilisateur peut modifier les informations
          // Les admins peuvent tout modifier, les prestataires peuvent modifier leur propre emplacement
          const canEditEmplacement = isAdmin || 
            (isPrestataire && emplacement.prestataireNom === prestataireNom);
          
          if (prestataire) {
            // MODIFICATION: Utiliser le texte personnalisé si disponible
            const customPopupText = prestataire.popupText;
            const description = customPopupText || this.cleanHtml(prestataire.description || '');
            const descriptionCourte = description.substring(0, 120) + (description.length > 120 ? '...' : '');

            html = `
              <div class="popup-prestataire-emplacement">
                <h3 class="prestataire-nom">${emplacement.prestataireNom}</h3>
                <p class="prestataire-type"><strong>Type:</strong> ${prestataire.type}</p>
                ${descriptionCourte ? `<p class="prestataire-desc">${descriptionCourte}</p>` : ''}
                ${emplacementInfoParts.length > 0 ? `<div class="emplacement-infos-section">${emplacementInfoParts.join('')}</div>` : ''}
                <p class="status-badge status-${emplacement.statut}">${label}</p>
                <a href="/prestataire/${prestataireNom}" class="popup-link-btn">
                  ${this.$t('carte.seeDetails')}
                </a>
                ${canEditEmplacement ? (hasEmplacementInfo ? `
                  <button onclick="window.openEmplacementForm(${emplacement.id})" class="btn-edit-info" style="margin-top: 8px;">
                    ${this.$t('carte.editLocation')}
                  </button>
                ` : `
                  <button onclick="window.openEmplacementForm(${emplacement.id})" class="btn-add-info" style="margin-top: 8px;">
                    ${this.$t('carte.addLocationInfo')}
                  </button>
                `) : ''}
              </div>
            `;
          } else {
            html = `
              <div class="popup-prestataire-emplacement">
                <h3 class="prestataire-nom">${emplacement.prestataireNom}</h3>
                ${emplacementInfoParts.length > 0 ? `<div class="emplacement-infos-section">${emplacementInfoParts.join('')}</div>` : ''}
                <p class="status-badge status-${emplacement.statut}">${label}</p>
                <a href="/prestataire/${prestataireNom}" class="popup-link-btn">
                  ${this.$t('carte.seeDetails')}
                </a>
                ${canEditEmplacement ? (hasEmplacementInfo ? `
                  <button onclick="window.openEmplacementForm(${emplacement.id})" class="btn-edit-info" style="margin-top: 8px;">
                    ${this.$t('carte.editLocation')}
                  </button>
                ` : `
                  <button onclick="window.openEmplacementForm(${emplacement.id})" class="btn-add-info" style="margin-top: 8px;">
                    ${this.$t('carte.addLocationInfo')}
                  </button>
                `) : ''}
              </div>
            `;
          }

          marker.bindPopup(html, {
            maxWidth: 300,
            className: 'prestataire-popup'
          });

          marker.bindTooltip(`${emplacement.prestataireNom}`, {
            permanent: false,
            direction: 'top',
            offset: [0, -10]
          });

          // SUPPRIMÉ: la redirection automatique au clic
          // La popup s'ouvrira naturellement au clic grâce à Leaflet
        }

        marker._emplacementCoords = coords;
        marker._emplacementStatut = emplacement.statut;
        marker.addTo(this.map);
        this.emplacementsLibresMarkers[`empty_${emplacement.id}`] = marker;
      });
    },

    // Crée les marqueurs depuis les prestataires
    initMarkers() {
      const L = this._L;
      if (!L || !this.map) return;
      this.markerLayers = {};
      let idx = 0;
      this.prestataires.forEach(a => {
        // Ne pas afficher le pin rouge si le prestataire a un emplacement attribué
        const hasEmplacement = this.emplacements.some(e =>
          (e.statut === 'pris' || e.statut === 'en_attente') &&
          e.prestataireNom === a.nom
        );
        if (hasEmplacement) return;

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
            <p><strong>${this.$t('carte.type')}</strong> ${a.type}</p>
            ${a.description ? `<p>${a.description}</p>` : ''}
            <a href="/prestataire/${prestataireNom}" class="popup-link">${this.$t('carte.seeDetails')}</a>
          </div>
        `;
        layer._pinType = a.type;
        layer.bindPopup(html);
        
        layer.bindTooltip(`${a.nom} (${a.type})`, {
          permanent: false,
          direction: 'top',
          offset: [0, -10]
        });
        
        layer.on('click', () => {
          this.$router.push(`/prestataire/${prestataireNom}`);
        });
        const id = `act_${idx++}`;
        this.markerLayers[id] = layer;
      });
    },

    // Crée les marqueurs pour les équipements (toilettes, points d'eau)
    initEquipements() {
      const L = this._L;
      if (!L || !this.map) return;
      this.equipementLayers = {};
      let idx = 0;
      this.equipements.forEach(eq => {
        if (!eq.coordone) return;
        const parts = eq.coordone.split(',').map(s => parseFloat(s.trim()));
        if (parts.length !== 2 || parts.some(isNaN)) return;
        const [lat, lng] = parts;
        const icon = this.getIconForType(eq.type);
        const layer = L.marker([lat, lng], { icon });

        const html = `
          <div class="popup-activite">
            <h3>${eq.type}</h3>
          </div>
        `;
        layer._equipementType = eq.type;
        layer.bindPopup(html);

        // Tooltip au survol
        layer.bindTooltip(eq.type, {
          permanent: false,
          direction: 'top',
          offset: [0, -10]
        });

        const id = `eq_${idx++}`;
        this.equipementLayers[id] = layer;
        layer.addTo(this.map); // Toujours visible
      });
    },

    getZoneColor(type) {
      if (type === 'parking') return '#0066FF';
      if (type === 'camping') return '#2ECC71';
      if (type === 'VIP') return '#9B59B6';
      if (type === 'festival') return '#FFD700'; // Jaune pour le festival
      return '#888888';
    },

    // Couleur spécifique pour chaque scène
    getSceneColor(nom) {
      const sceneColors = {
        'MOTHERSHIP': '#FF1744',      // Rouge vif
        'ZERO GRAVITY': '#00E5FF',    // Cyan vif
        'CARGO': '#FF9800',           // Orange vif
        'ANTDT CLUB': '#E91E63',      // Rose/Magenta
      };
      return sceneColors[nom] || '#9C27B0';
    },

    // Calcule le centre (centroid) d'un polygone
    getPolygonCenter(latlngs) {
      let latSum = 0;
      let lngSum = 0;
      latlngs.forEach(coord => {
        latSum += coord[0];
        lngSum += coord[1];
      });
      return [latSum / latlngs.length, lngSum / latlngs.length];
    },

    // Crée une icône de symbole pour une zone
    getZoneIcon(type, nom) {
      const L = this._L;
      if (!L) return null;

      let symbol = '';
      let bgColor = '#FFFFFF';
      let textColor = '#000000';
      let borderColor = '#000000';

      if (type === 'parking') {
        symbol = 'P';
        bgColor = '#FFFFFF';
        textColor = '#0066FF';
        borderColor = '#0066FF';
      } else if (type === 'camping') {
        symbol = '🏕️';
        bgColor = 'rgba(46, 204, 113, 0.9)';
        textColor = '#FFFFFF';
        borderColor = '#2ECC71';
      } else if (type === 'VIP') {
        symbol = '⭐';
        bgColor = 'rgba(155, 89, 182, 0.9)';
        textColor = '#FFFFFF';
        borderColor = '#9B59B6';
      } else if (type === 'scène') {
        symbol = '🎵';
        const sceneColor = this.getSceneColor(nom);
        bgColor = sceneColor;
        textColor = '#FFFFFF';
        borderColor = sceneColor;
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
      `;

      return L.divIcon({
        html: html,
        className: 'zone-icon-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
    },

    // Ajout: création des polygones zones
    initZones() {
      const L = this._L;
      if (!L || !this.map) return;
      this.zoneLayers = {};
      this.zoneMarkers = {};
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
        
        // Traitement spécial pour la zone festival (pas de marqueur)
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
        } else if (z.type === 'scène') {
          // Traitement spécial pour les scènes avec style attrayant
          const sceneColor = this.getSceneColor(z.nom);
          const popupContent = `
            <div class="popup-scene">
              <h3 style="margin: 0 0 8px 0; color: ${sceneColor}; font-weight: bold; font-size: 1.2em;">
                🎵 ${z.nom}
              </h3>
              ${z.sponsor ? `<p style="margin: 0; color: #666; font-size: 0.9em;">by ${z.sponsor}</p>` : ''}
            </div>
          `;
          const layer = L.polygon(latlngs, {
            color: sceneColor,
            weight: 4,
            fillColor: sceneColor,
            fillOpacity: 0.4,
            opacity: 0.9,
            dashArray: '0',
          }).bindPopup(popupContent, {
            className: 'scene-popup'
          });
          layer._zoneType = z.type;
          layer._zoneNom = z.nom;
          this.zoneLayers[`zone_${idx++}`] = layer;
          
          // Ajouter un marqueur de symbole au centre
          const center = this.getPolygonCenter(latlngs);
          const icon = this.getZoneIcon(z.type, z.nom);
          if (icon) {
            const marker = L.marker(center, { icon, interactive: false });
            marker._zoneType = z.type;
            marker._zoneNom = z.nom;
            this.zoneMarkers[`zone_marker_${idx - 1}`] = marker;
          }
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
          
          // Ajouter un marqueur de symbole au centre
          const center = this.getPolygonCenter(latlngs);
          const icon = this.getZoneIcon(z.type, z.nom);
          if (icon) {
            const marker = L.marker(center, { icon, interactive: false });
            marker._zoneType = z.type;
            marker._zoneNom = z.nom;
            this.zoneMarkers[`zone_marker_${idx - 1}`] = marker;
          }
        }
      });
    },

    // Affiche/cache selon visibleTypes
    updateMarkersVisibility() {
      if (!this.map) return;

      // Filtrer les pins rouges (prestataires sans emplacement)
      Object.values(this.markerLayers).forEach(layer => {
        const t = layer._pinType;
        const show = !!this.visibleTypes[t];
        const onMap = this.map.hasLayer(layer);
        if (show && !onMap) layer.addTo(this.map);
        if (!show && onMap) this.map.removeLayer(layer);
      });

      // AJOUT: Filtrer les ronds (emplacements occupés)
      Object.values(this.emplacementsLibresMarkers).forEach(marker => {
        const coords = marker._emplacementCoords;
        const statut = marker._emplacementStatut;

        // Les emplacements libres sont toujours visibles
        if (statut === 'libre') {
          const onMap = this.map.hasLayer(marker);
          if (!onMap) marker.addTo(this.map);
          return;
        }

        // Pour les emplacements occupés/en attente, vérifier le type du prestataire
        const emplacement = this.emplacements.find(e => e.coordonnees === coords);
        if (!emplacement || !emplacement.prestataireNom) {
          if (this.map.hasLayer(marker)) this.map.removeLayer(marker);
          return;
        }

        const prestataire = this.prestataires.find(p => p.nom === emplacement.prestataireNom);
        const type = prestataire ? prestataire.type : null;
        const show = type && !!this.visibleTypes[type];

        const onMap = this.map.hasLayer(marker);
        if (show && !onMap) marker.addTo(this.map);
        if (!show && onMap) this.map.removeLayer(marker);
      });
    },
    // Ajout: visibilité zones
    updateZonesVisibility() {
      if (!this.map) return;
      Object.values(this.zoneLayers).forEach(layer => {
        const t = layer._zoneType;
        // La zone festival et les scènes sont toujours visibles
        const show = t === 'festival' || t === 'scène' || !!this.visibleZoneTypes[t];
        const onMap = this.map.hasLayer(layer);
        if (show && !onMap) layer.addTo(this.map);
        if (!show && onMap) this.map.removeLayer(layer);
      });
      // Gérer la visibilité des marqueurs de symboles
      Object.entries(this.zoneMarkers).forEach(([key, marker]) => {
        const t = marker._zoneType;
        const show = t === 'scène' || !!this.visibleZoneTypes[t];
        const onMap = this.map.hasLayer(marker);
        if (show && !onMap) marker.addTo(this.map);
        if (!show && onMap) this.map.removeLayer(marker);
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
    // AJOUT: Méthode cleanHtml manquante
    cleanHtml(html) {
      if (!html) return '';
      if (!html.includes('<')) return html;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    },
    
    // AJOUT: Ouvrir le formulaire d'emplacement
    openEmplacementForm(emplacementId) {
      // AJOUT: Vérification des permissions
      let authUser = null;
      try {
        const raw = localStorage.getItem('authUser');
        authUser = raw ? JSON.parse(raw) : null;
      } catch (e) {
        authUser = null;
      }
      const userRole = authUser?.role || 'user';
      const isAdmin = userRole === 'admin';
      const isPrestataire = userRole === 'prestataire';
      const prestataireNom = authUser?.prestataireNom || '';
      
      const emplacement = this.emplacements.find(e => e.id === emplacementId);
      if (!emplacement) return;
      
      // Vérifier si l'utilisateur peut modifier cet emplacement
      const canEdit = isAdmin || 
        (isPrestataire && emplacement.prestataireNom === prestataireNom);
      
      if (!canEdit) {
        alert(this.$t('carte.noPermission'));
        return;
      }
      
      this.selectedEmplacement = emplacement;
      this.formMode = (emplacement.nom_emplacement || emplacement.moyens_logistiques || 
                      emplacement.surface_volume || emplacement.nombre_prises || 
                      emplacement.acces_eau || emplacement.description) ? 'edit' : 'add';
      this.showEmplacementForm = true;
      
      // Fermer la popup Leaflet
      if (this.map) {
        this.map.closePopup();
      }
    },
    
    // AJOUT: Fermer le formulaire
    closeEmplacementForm() {
      this.showEmplacementForm = false;
      this.selectedEmplacement = null;
    },
    
    // AJOUT: Sauvegarder les informations d'emplacement
    async saveEmplacementInfo(emplacementData) {
      try {
        // Sauvegarder dans localStorage
        const emplacementsInfoRaw = localStorage.getItem('emplacementsInfo') || '{}';
        const emplacementsInfo = JSON.parse(emplacementsInfoRaw);
        emplacementsInfo[emplacementData.id] = {
          nom_emplacement: emplacementData.nom_emplacement,
          moyens_logistiques: emplacementData.moyens_logistiques,
          surface_volume: emplacementData.surface_volume,
          nombre_prises: emplacementData.nombre_prises,
          acces_eau: emplacementData.acces_eau,
          description: emplacementData.description
        };
        localStorage.setItem('emplacementsInfo', JSON.stringify(emplacementsInfo));
        
        // Mettre à jour l'emplacement local
        const index = this.emplacements.findIndex(e => e.id === emplacementData.id);
        if (index !== -1) {
          this.emplacements[index] = { ...this.emplacements[index], ...emplacementsInfo[emplacementData.id] };
        }
        
        // Recharger les marqueurs
        this.initEmplacementsLibres();
        
        // Fermer le formulaire
        this.closeEmplacementForm();
        
        alert(this.$t('carte.locationSaved'));
      } catch (e) {
        console.error('Erreur sauvegarde emplacement', e);
        alert(this.$t('carte.locationError'));
      }
    },
  },
  beforeUnmount() {
    // Nettoyage Leaflet
    if (this.map) {
      Object.values(this.markerLayers || {}).forEach(l => this.map.hasLayer(l) && this.map.removeLayer(l));
      Object.values(this.zoneLayers || {}).forEach(l => this.map.hasLayer(l) && this.map.removeLayer(l));
      Object.values(this.zoneMarkers || {}).forEach(l => this.map.hasLayer(l) && this.map.removeLayer(l));
      Object.values(this.equipementLayers || {}).forEach(l => this.map.hasLayer(l) && this.map.removeLayer(l));
      this.map.remove();
      this.map = null;
    }
    
    // AJOUT: Nettoyage écouteur d'authentification
    if (typeof window !== 'undefined') {
      window.removeEventListener('auth-changed', this.handleAuthChanged);
      delete window.openEmplacementForm;
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
  background: rgba(255, 233, 168, 0.35) !important;
  padding: 6px;
  border-radius: 6px;
}

/* Badges/étiquettes de filtre: appliquer le fond (texte inchangé) */
.type-label {
  font-weight: 600;
  background: rgba(255, 233, 168, 0.35) !important;
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

:deep(.empty-location-icon) {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

:deep(.empty-location-icon:hover) {
  opacity: 1;
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

/* Styles pour le popup des emplacements disponibles */
:deep(.popup-emplacement) {
  padding: 12px;
  min-width: 200px;
  text-align: center;
}

:deep(.popup-emplacement h3) {
  margin: 0 0 8px 0;
  color: #888;
  font-size: 1rem;
}

:deep(.popup-emplacement p) {
  margin: 4px 0;
  color: #666;
  font-size: 0.85rem;
}

:deep(.popup-emplacement .coordinates) {
  font-family: monospace;
  font-size: 0.8rem;
  color: #999;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 8px;
  display: inline-block;
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

/* Styles pour les popups des scènes */
:deep(.scene-popup) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.popup-scene) {
  padding: 10px;
  min-width: 180px;
  text-align: center;
}

:deep(.popup-scene h3) {
  margin: 0 0 8px 0;
  font-weight: bold;
  font-size: 1.2em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

:deep(.popup-scene p) {
  margin: 0;
  color: #666;
  font-size: 0.9em;
  font-style: italic;
}

/* Styles pour les icônes de zones */
:deep(.zone-icon-marker) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* AJOUT: Styles pour les badges de statut */
:deep(.status-badge) {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.status-pris) {
  background: rgba(252, 220, 30, 0.2);
  border: 2px solid #FCDC1E;
  color: #FCDC1E;
}

:deep(.status-en_attente) {
  background: rgba(255, 152, 0, 0.2);
  border: 2px solid #ff9800;
  color: #ff9800;
}

:deep(.status-libre) {
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid #4caf50;
  color: #4caf50;
}

/* Styles pour les popups des prestataires sur emplacements */
:deep(.prestataire-popup .leaflet-popup-content-wrapper) {
  background: rgba(4, 16, 61, 0.95);
  border: 2px solid rgba(252, 220, 30, 0.4);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

:deep(.prestataire-popup .leaflet-popup-tip) {
  background: rgba(4, 16, 61, 0.95);
  border: 2px solid rgba(252, 220, 30, 0.4);
  border-top: none;
  border-right: none;
}

:deep(.popup-prestataire-emplacement) {
  padding: 16px;
  min-width: 240px;
  max-width: 300px;
}

:deep(.popup-prestataire-emplacement .prestataire-nom) {
  margin: 0 0 12px 0;
  color: #FCDC1E;
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.3;
}

:deep(.popup-prestataire-emplacement .prestataire-type) {
  margin: 8px 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

:deep(.popup-prestataire-emplacement .prestataire-type strong) {
  color: #FCDC1E;
}

:deep(.popup-prestataire-emplacement .prestataire-desc) {
  margin: 12px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* AJOUT: Styles pour les informations d'emplacement dans les popups prestataires */
:deep(.popup-prestataire-emplacement .emplacement-infos-section) {
  margin: 12px 0;
  padding: 8px;
  background: rgba(252, 220, 30, 0.1);
  border-left: 3px solid #FCDC1E;
  border-radius: 4px;
}

:deep(.popup-prestataire-emplacement .emplacement-info-title) {
  margin: 0 0 6px 0;
  color: #FCDC1E;
  font-size: 0.95rem;
  font-weight: 700;
}

:deep(.popup-prestataire-emplacement .emplacement-info) {
  margin: 4px 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
}

:deep(.popup-prestataire-emplacement .coordinates) {
  font-family: monospace;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  margin: 8px 0;
  display: inline-block;
}

/* AJOUT: Styles pour les boutons dans les popups prestataires */
:deep(.popup-prestataire-emplacement .btn-add-info),
:deep(.popup-prestataire-emplacement .btn-edit-info) {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(252, 220, 30, 0.3);
  text-align: center;
}

:deep(.popup-prestataire-emplacement .btn-add-info:hover),
:deep(.popup-prestataire-emplacement .btn-edit-info:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(252, 220, 30, 0.4);
}

:deep(.popup-prestataire-emplacement .status-badge) {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  margin: 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.popup-prestataire-emplacement .status-pris) {
  background: rgba(252, 220, 30, 0.2);
  border: 2px solid #FCDC1E;
  color: #FCDC1E;
}

:deep(.popup-prestataire-emplacement .status-en_attente) {
  background: rgba(255, 152, 0, 0.2);
  border: 2px solid #ff9800;
  color: #ff9800;
}

:deep(.popup-link-btn) {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
  width: 100%;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.popup-link-btn:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(252, 220, 30, 0.5);
  background: linear-gradient(135deg, #ffe676 0%, #FCDC1E 100%);
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

/* AJOUT: Styles pour les boutons dans les popups d'emplacement */
:deep(.popup-emplacement .btn-add-info),
:deep(.popup-emplacement .btn-edit-info) {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(252, 220, 30, 0.3);
  text-align: center;
}

:deep(.popup-emplacement .btn-add-info:hover),
:deep(.popup-emplacement .btn-edit-info:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(252, 220, 30, 0.4);
}

/* AJOUT: Modal pour le formulaire */
.emplacement-form-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.emplacement-form-modal-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalFadeIn 0.2s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
