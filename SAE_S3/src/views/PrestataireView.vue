<template>
  <div class="prestataire">
    <div class="container">
      <h1 class="title">{{ $t('prestataire.title') }}</h1>
      <p class="subtitle">{{ $t('prestataire.subtitle') }}</p>

      <div class="filter-bar">
        <div class="filter-label">{{ $t('prestataire.filterByType') }}</div>
        <div class="filter-dropdown-wrapper">
          <button
            type="button"
            class="filter-dropdown-toggle"
            :class="{ active: selectedTypes.length > 0, open: isDropdownOpen }"
            @click="toggleDropdown"
          >
            <span v-if="selectedTypes.length === 0">{{ $t('prestataire.allTypes') }}</span>
            <span v-else-if="selectedTypes.length === 1">{{ selectedTypes[0] }}</span>
            <span v-else>{{ selectedTypes.length }} {{ $t('prestataire.typeSelected') }}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div v-if="isDropdownOpen" class="filter-dropdown-menu" @click.stop>
            <div class="dropdown-options">
              <label
                v-for="type in types"
                :key="type"
                class="dropdown-option"
                :class="{ selected: selectedTypes.includes(type) }"
              >
                <input
                  type="checkbox"
                  :checked="selectedTypes.includes(type)"
                  @change="toggleType(type)"
                />
                <span>{{ type }}</span>
              </label>
            </div>
            <div v-if="selectedTypes.length" class="dropdown-actions">
              <button
                type="button"
                class="clear-filters-small"
                @click="resetFilters"
              >
                {{ $t('prestataire.reset') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-message">
        {{ $t('prestataire.loading') }}
      </div>

      <div v-else-if="!filteredPrestataires.length" class="empty-state">
        {{ $t('prestataire.noMatch') }}
      </div>

      <div v-else class="cards">
        <router-link
          v-for="p in filteredPrestataires"
          :key="p.nom"
          :to="`/prestataire/${encodeURIComponent(p.nom)}`"
          class="card card-clickable"
        >
          <div class="card-header">
            <h2 class="card-title">{{ p.nom }}</h2>
            <span class="badge">{{ p.type }}</span>
          </div>
          <p class="description">{{ cleanHtml(p.description) }}</p>

          <div v-if="p.services && p.services.length" class="services">
            <h3>{{ $t('prestataire.services') }}</h3>
            <ul>
              <li v-for="s in (p.services || []).filter(s => s.public !== false)" :key="s.nom">
                <div class="service-item">
                  <div class="service-info">
                    <span class="service-name">{{ s.nom }}</span>
                    <span v-if="s.description" class="service-desc">— {{ s.description }}</span>
                  </div>
                  <span class="service-price" :class="{ 'price-free': (s.prix || 0) === 0 }">
                    {{ formatServicePrix(s.prix) }}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <!-- Bouton de réservation pour le prestataire Terrain de basket -->
          <div v-if="isBasketPrestataire(p)" class="reservation-cta" @click.stop.prevent>
            <router-link to="/reservation-basket" class="btn-reserve">
              🏀 {{ $t('prestataire.reserveSlot') }}
            </router-link>
          </div>

          <div class="contacts" @click.stop>
            <a v-if="p.site" :href="p.site" target="_blank" rel="noopener" class="link">{{ $t('prestataire.website') }}</a>
          </div>
        </router-link>
      </div>
    </div>
  </div>
  
</template>

<script>
export default {
  name: 'PrestataireView',
  data() {
    return {
      prestataires: [],
      types: [],
      selectedTypes: [],
      loading: true,
      isDropdownOpen: false,
    }
  },
  async mounted() {
    await this.loadPrestataires();
    // Fermer le dropdown si on clique en dehors
    document.addEventListener('click', this.handleClickOutside);
    // Écouter les mises à jour
    this.prestataireUpdateHandler = () => this.loadPrestataires();
    this.storageChangeHandler = (e) => {
      if (e.key === 'customPrestataires' || !e.key) {
        this.loadPrestataires();
      }
    };
    window.addEventListener('prestataire-updated', this.prestataireUpdateHandler);
    window.addEventListener('storage', this.storageChangeHandler);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    if (this.prestataireUpdateHandler) {
      window.removeEventListener('prestataire-updated', this.prestataireUpdateHandler);
    }
    if (this.storageChangeHandler) {
      window.removeEventListener('storage', this.storageChangeHandler);
    }
  },
  computed: {
    filteredPrestataires() {
      if (!this.selectedTypes.length) return this.prestataires;
      return this.prestataires.filter(p => this.selectedTypes.includes(p.type));
    },
  },
  watch: {
    '$i18n.locale'() {
      this.loadPrestataires();
    }
  },
  methods: {
    toggleDropdown(event) {
      event.stopPropagation();
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    handleClickOutside(event) {
      const dropdown = event.target.closest('.filter-dropdown-wrapper');
      if (!dropdown && this.isDropdownOpen) {
        this.isDropdownOpen = false;
      }
    },
    toggleType(type) {
      if (this.selectedTypes.includes(type)) {
        this.selectedTypes = this.selectedTypes.filter(t => t !== type);
      } else {
        this.selectedTypes = [...this.selectedTypes, type];
      }
    },
    resetFilters() {
      this.selectedTypes = [];
    },
    formatPrix(val) {
      if (val === 0) return 'gratuit';
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
    },
    formatServicePrix(prix) {
      if (prix === undefined || prix === null) return this.$t('home.free');
      if (prix === 0) return this.$t('home.free');
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(prix);
    },
    cleanHtml(html) {
      if (!html) return '';
      // Si c'est déjà du texte brut, le retourner tel quel
      if (!html.includes('<')) return html;
      // Sinon, extraire le texte depuis le HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    },
    async loadPrestataires() {
      this.loading = true;
      try {
        const prestatairesResp = await fetch('/data/prestataires.json', { cache: 'no-store' });
        const prestatairesData = prestatairesResp.ok ? await prestatairesResp.json() : { prestataires: [] };
        let allPrestataires = prestatairesData.prestataires || [];

        // Normaliser le format bilingue depuis prestataires.json
        const currentLang = this.$i18n?.locale || 'fr';
        allPrestataires = allPrestataires.map(p => {
          const updated = { ...p };
          // Gérer la description bilingue
          if (p.description && typeof p.description === 'object' && p.description.fr !== undefined) {
            updated.description = p.description[currentLang] || p.description.fr || '';
          }
          // Gérer les services bilingues
          if (p.services && Array.isArray(p.services)) {
            updated.services = p.services.map(s => {
              const service = { ...s };
              if (s.nom && typeof s.nom === 'object' && s.nom.fr !== undefined) {
                service.nom = s.nom[currentLang] || s.nom.fr || '';
                service.description = (s.description && typeof s.description === 'object' && s.description.fr !== undefined)
                  ? (s.description[currentLang] || s.description.fr || '')
                  : (s.description || '');
              }
              return service;
            });
          }
          return updated;
        });

        // Appliquer les modifications locales si elles existent (avec support bilingue)
        const custom = JSON.parse(localStorage.getItem('customPrestataires') || '{}');
        allPrestataires = allPrestataires.map(p => {
          const local = custom[p.nom];
          if (!local) return p;

          const updated = { ...p };

          // Présentation / description personnalisée
          if (local.presentationHtml) {
            if (typeof local.presentationHtml === 'object' && local.presentationHtml.fr !== undefined) {
              updated.description = local.presentationHtml[currentLang] || local.presentationHtml.fr || p.description || '';
            } else if (typeof local.presentationHtml === 'string') {
              updated.description = local.presentationHtml;
            }
          }

          // Services personnalisés
          if (local.services && Array.isArray(local.services)) {
            updated.services = local.services.map(s => {
              const service = { ...s };
              if (s.nom && typeof s.nom === 'object' && s.nom.fr !== undefined) {
                service.nom = s.nom[currentLang] || s.nom.fr || '';
                service.description = (s.description && typeof s.description === 'object' && s.description.fr !== undefined)
                  ? (s.description[currentLang] || s.description.fr || '')
                  : (s.description || '');
              }
              return service;
            });
          }

          if (local.email) updated.email = local.email;
          if (local.tel) updated.tel = local.tel;
          if (local.site) updated.site = local.site;

          return updated;
        });

        this.prestataires = allPrestataires;
        this.types = [...new Set(this.prestataires.map(p => p.type))];
      } catch (error) {
        console.error('Erreur lors du chargement des prestataires:', error);
      } finally {
        this.loading = false;
      }
    },

    isBasketPrestataire(prestataire) {
      const nom = prestataire.nom?.toLowerCase() || ''
      return nom.includes('terrain de basket') ||
             nom.includes('basket') ||
             nom === 'terrain de basket'
    },
  }
}
</script>

<style scoped>
.prestataire {
  min-height: calc(100vh - 70px);
  padding: 88px 16px 60px;
  background: linear-gradient(to bottom, #6f47c1 0%, #1629bf 50%, #11338A 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  color: #FCDC1E;
  font-size: clamp(2.2rem, 4vw, 2.8rem);
  margin-bottom: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
  font-size: 1rem;
}

.filter-bar {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  background: rgba(4, 16, 61, 0.65);
  border: 1px solid rgba(252, 220, 30, 0.3);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  z-index: 100;
}

.filter-label {
  font-weight: 800;
  color: #FCDC1E;
  min-width: 160px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.filter-dropdown-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.filter-dropdown-toggle {
  width: 100%;
  border: 2px solid rgba(252, 220, 30, 0.4);
  background: rgba(255, 255, 255, 0.06);
  color: #FCDC1E;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
}

.filter-dropdown-toggle:hover {
  border-color: #FCDC1E;
  box-shadow: 0 6px 18px rgba(252, 220, 30, 0.3);
  background: rgba(255, 255, 255, 0.1);
}

.filter-dropdown-toggle.active {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.2) 0%, rgba(247, 208, 0, 0.2) 100%);
  border-color: #FCDC1E;
}

.filter-dropdown-toggle.open {
  border-color: #FCDC1E;
  box-shadow: 0 6px 18px rgba(252, 220, 30, 0.3);
}

.dropdown-arrow {
  font-size: 0.8rem;
  transition: transform 0.2s ease;
  margin-left: 10px;
}

.filter-dropdown-toggle.open .dropdown-arrow {
  transform: rotate(180deg);
}

.filter-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(4, 16, 61, 0.95);
  border: 2px solid rgba(252, 220, 30, 0.4);
  border-radius: 12px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 9999;
  max-height: 400px;
  overflow-y: auto;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-options {
  padding: 8px;
}

.dropdown-option {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  gap: 10px;
}

.dropdown-option:hover {
  background: rgba(252, 220, 30, 0.15);
  color: #FCDC1E;
}

.dropdown-option.selected {
  background: rgba(252, 220, 30, 0.25);
  color: #FCDC1E;
}

.dropdown-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #FCDC1E;
}

.dropdown-option span {
  flex: 1;
}

.dropdown-actions {
  border-top: 1px solid rgba(252, 220, 30, 0.2);
  padding: 8px;
}

.clear-filters-small {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #FCDC1E;
  font-weight: 700;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.clear-filters-small:hover {
  background: #FCDC1E;
  color: #021045;
  box-shadow: 0 6px 16px rgba(252, 220, 30, 0.35);
}

.loading-message,
.empty-state {
  color: #FCDC1E;
  font-weight: 800;
  text-align: center;
  padding: 40px 20px;
  font-size: 1.1rem;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

@media screen and (max-width: 980px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}
@media screen and (max-width: 640px) {
  .cards { grid-template-columns: 1fr; }
}

.card {
  border: 1px solid rgba(252, 220, 30, 0.25);
  border-radius: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  min-height: 230px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-clickable {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 40px rgba(0, 0, 0, 0.55);
  border-color: rgba(252, 220, 30, 0.5);
  background: rgba(255, 255, 255, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.card-title {
  color: #FCDC1E;
  font-size: 1.3rem;
  letter-spacing: 0.5px;
  flex: 1;
}

.badge {
  background: rgba(252, 220, 30, 0.15);
  color: #FCDC1E;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(252, 220, 30, 0.4);
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.description {
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 10px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.services h3 {
  font-size: 0.95rem;
  color: #FCDC1E;
  margin: 10px 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.services ul {
  list-style: none;
  padding-left: 0;
}

.services li {
  margin: 4px 0;
  color: rgba(255, 255, 255, 0.75);
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.service-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.service-name { font-weight: 600; }
.service-desc { color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; }
.service-price { 
  color: #FCDC1E; 
  font-weight: 700;
  font-size: 1rem;
  padding: 4px 10px;
  background: rgba(252,220,30,0.15);
  border-radius: 6px;
  border: 1px solid rgba(252,220,30,0.3);
  white-space: nowrap;
}
.service-price.price-free {
  color: #4caf50;
  background: rgba(76,175,80,0.15);
  border-color: rgba(76,175,80,0.3);
}

.contacts {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.link {
  color: #FCDC1E;
  text-decoration: none;
  font-weight: 700;
  border: 1px solid rgba(252, 220, 30, 0.4);
  padding: 6px 10px;
  border-radius: 10px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
}
.link:hover {
  color: #021045;
  background: #FCDC1E;
  border-color: #FCDC1E;
  box-shadow: 0 8px 16px rgba(252, 220, 30, 0.35);
}

/* Bouton de réservation */
.reservation-cta {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(252, 220, 30, 0.2);
}

.btn-reserve {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #fcdc1e 0%, #ffe676 100%);
  color: #0a0a0a;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
  width: 100%;
  justify-content: center;
}

.btn-reserve:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(252, 220, 30, 0.4);
}
</style>
