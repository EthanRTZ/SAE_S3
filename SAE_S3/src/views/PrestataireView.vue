<template>
  <div class="prestataire">
    <div class="container">
      <h1 class="title">Prestataires</h1>

      <div class="filter-bar">
        <div class="filter-label">Filtrer par type</div>
        <div class="chip-list">
          <button
            v-for="type in types"
            :key="type"
            type="button"
            class="filter-chip"
            :class="{ active: selectedTypes.includes(type) }"
            @click="toggleType(type)"
          >
            {{ type }}
            <span v-if="selectedTypes.includes(type)" class="chip-close" aria-hidden="true">×</span>
          </button>
        </div>
        <button 
          v-if="selectedTypes.length" 
          type="button" 
          class="clear-filters" 
          @click="resetFilters"
        >
          Tout afficher
        </button>
      </div>

      <div v-if="loading" class="loading-message">
        Chargement des prestataires...
      </div>

      <div v-else-if="!filteredPrestataires.length" class="empty-state">
        Aucun prestataire ne correspond à ce filtre.
      </div>

      <div v-else class="cards">
        <div v-for="p in filteredPrestataires" :key="p.nom" class="card">
          <div class="card-header">
            <h2 class="card-title">{{ p.nom }}</h2>
            <span class="badge">{{ p.type }}</span>
          </div>
          <p class="description">{{ p.description }}</p>

          <div v-if="p.services && p.services.length" class="services">
            <h3>Services</h3>
            <ul>
              <li v-for="s in p.services" :key="s.nom">
                <span class="service-name">{{ s.nom }}</span>
                <span v-if="s.description" class="service-desc">— {{ s.description }}</span>
                <span v-if="s.prix !== null && s.prix !== undefined" class="service-price"> ({{ formatPrix(s.prix) }})</span>
              </li>
            </ul>
          </div>

          <div class="contacts">
            <a v-if="p.site" :href="p.site" target="_blank" rel="noopener" class="link">Site web</a>
          </div>
        </div>
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
    }
  },
  async mounted() {
    try {
      const response = await fetch('/data/prestataires.json');
      const data = await response.json();
      this.prestataires = data.prestataires || [];
      this.types = [...new Set(this.prestataires.map(p => p.type))];
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
    } finally {
      this.loading = false;
    }
  },
  computed: {
    filteredPrestataires() {
      if (!this.selectedTypes.length) return this.prestataires;
      return this.prestataires.filter(p => this.selectedTypes.includes(p.type));
    },
  },
  methods: {
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
    }
  }
}
</script>

<style scoped>
.prestataire {
  min-height: calc(100vh - 70px);
  padding: 88px 16px 60px;
  background: radial-gradient(circle at 15% 20%, rgba(252, 220, 30, 0.15), transparent 45%),
              radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.08), transparent 50%),
              linear-gradient(145deg, #051036 0%, #000428 65%, #02198b 100%);
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
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;
  background: rgba(4, 16, 61, 0.65);
  border: 1px solid rgba(252, 220, 30, 0.3);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
}

.filter-label {
  font-weight: 800;
  color: #FCDC1E;
  min-width: 160px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1;
}

.filter-chip {
  border: 2px solid rgba(252, 220, 30, 0.4);
  background: rgba(255, 255, 255, 0.06);
  color: #FCDC1E;
  padding: 6px 18px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.filter-chip:hover {
  border-color: #FCDC1E;
  box-shadow: 0 6px 18px rgba(252, 220, 30, 0.3);
}

.filter-chip.active {
  background: linear-gradient(135deg, #FCDC1E 0%, #f7d000 100%);
  color: #0b0b0b;
  border-color: transparent;
  box-shadow: 0 12px 24px rgba(252, 220, 30, 0.45);
}

.chip-close {
  margin-left: 6px;
  font-weight: 900;
}

.clear-filters {
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #FCDC1E;
  font-weight: 700;
  cursor: pointer;
  padding: 8px 18px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}

.clear-filters:hover {
  background: #FCDC1E;
  color: #021045;
  box-shadow: 0 10px 20px rgba(252, 220, 30, 0.35);
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

.service-name { font-weight: 600; }
.service-desc { color: rgba(255, 255, 255, 0.6); }
.service-price { color: #FCDC1E; font-weight: 700; }

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
</style>
