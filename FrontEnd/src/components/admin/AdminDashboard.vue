<script setup>
const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalUsers: 0,
      totalPrestataires: 0,
      totalServices: 0,
      totalReservations: 0,
      totalAvis: 0,
      notesMoyenne: 0,
      repartitionNotes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalAvisFestival: 0,
      avisFestivalMoyenne: 0,
      repartitionNotesFestival: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    })
  }
})
</script>

<template>
  <div class="section-content">
    <h1 class="section-title">Tableau de bord</h1>

    <!-- Grille de statistiques principales -->
    <div class="dash-stats-grid">
      <div class="dash-stat-card">
        <div class="dash-stat-icon">👥</div>
        <div class="dash-stat-info">
          <div class="dash-stat-value">{{ stats.totalUsers }}</div>
          <div class="dash-stat-label">Utilisateurs</div>
        </div>
      </div>

      <div class="dash-stat-card">
        <div class="dash-stat-icon">🏢</div>
        <div class="dash-stat-info">
          <div class="dash-stat-value">{{ stats.totalPrestataires }}</div>
          <div class="dash-stat-label">Prestataires</div>
        </div>
      </div>

      <div class="dash-stat-card">
        <div class="dash-stat-icon">🛠️</div>
        <div class="dash-stat-info">
          <div class="dash-stat-value">{{ stats.totalServices }}</div>
          <div class="dash-stat-label">Services</div>
        </div>
      </div>

      <div class="dash-stat-card">
        <div class="dash-stat-icon">📅</div>
        <div class="dash-stat-info">
          <div class="dash-stat-value">{{ stats.totalReservations }}</div>
          <div class="dash-stat-label">Réservations</div>
        </div>
      </div>
    </div>

    <!-- Carte de notation globale prestataires -->
    <div class="dash-rating-overview-card">
      <div class="dash-rating-left">
        <div class="dash-rating-icon">⭐</div>
        <div class="dash-rating-main">
          <div class="dash-rating-score">
            {{ stats.totalAvis > 0 ? stats.notesMoyenne.toFixed(1) : '—' }}
          </div>
          <div class="dash-rating-stars">
            <span
              v-for="i in 5"
              :key="i"
              class="dash-star"
              :class="{ filled: stats.totalAvis > 0 && i <= Math.round(stats.notesMoyenne) }"
            >★</span>
          </div>
          <div class="dash-rating-meta">
            {{ stats.totalAvis }} avis prestataires
          </div>
        </div>
      </div>

      <div class="dash-rating-right">
        <h3>Répartition des notes prestataires</h3>
        <div class="dash-rating-distribution">
          <div
            v-for="i in [5, 4, 3, 2, 1]"
            :key="i"
            class="dash-distribution-row"
          >
            <span class="dash-distribution-label">{{ i }}★</span>
            <div class="dash-distribution-bar">
              <div
                class="dash-distribution-fill"
                :style="{
                  width: stats.totalAvis > 0 ? (stats.repartitionNotes[i] / stats.totalAvis * 100) + '%' : '0%'
                }"
              ></div>
            </div>
            <span class="dash-distribution-count">{{ stats.repartitionNotes[i] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- CARTE AVIS FESTIVAL -->
    <div class="dash-rating-overview-card festival-card">
      <div class="dash-rating-left">
        <div class="dash-rating-icon">⭐</div>
        <div class="dash-rating-main">
          <div class="dash-rating-score">
            {{ stats.totalAvisFestival > 0 ? stats.avisFestivalMoyenne.toFixed(1) : '—' }}
          </div>
          <div class="dash-rating-stars">
            <span
              v-for="i in 5"
              :key="i"
              class="dash-star"
              :class="{ filled: stats.totalAvisFestival > 0 && i <= Math.round(stats.avisFestivalMoyenne) }"
            >★</span>
          </div>
          <div class="dash-rating-meta">
            {{ stats.totalAvisFestival }} avis sur le festival
          </div>
        </div>
      </div>

      <div class="dash-rating-right">
        <h3>Répartition des notes du festival</h3>
        <div class="dash-rating-distribution">
          <div
            v-for="i in [5, 4, 3, 2, 1]"
            :key="i"
            class="dash-distribution-row"
          >
            <span class="dash-distribution-label">{{ i }}★</span>
            <div class="dash-distribution-bar">
              <div
                class="dash-distribution-fill"
                :style="{
                  width: stats.totalAvisFestival > 0 ? (stats.repartitionNotesFestival[i] / stats.totalAvisFestival * 100) + '%' : '0%'
                }"
              ></div>
            </div>
            <span class="dash-distribution-count">{{ stats.repartitionNotesFestival[i] }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Section Content */
.section-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-title {
  color: var(--yellow);
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0 0 32px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* Grille de stats */
.dash-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 28px;
  margin-bottom: 48px;
}

.dash-stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.dash-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(252, 220, 30, 0.2);
  border-color: rgba(252, 220, 30, 0.3);
}

.dash-stat-icon {
  font-size: 3rem;
  filter: drop-shadow(0 4px 8px rgba(252, 220, 30, 0.3));
}

.dash-stat-info {
  flex: 1;
}

.dash-stat-value {
  font-size: 2.8rem;
  font-weight: 900;
  color: var(--yellow);
  line-height: 1;
  margin: 0 0 8px 0;
}

.dash-stat-label {
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

/* Carte de notation */
.dash-rating-overview-card {
  display: flex;
  gap: 40px;
  padding: 32px;
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.dash-rating-overview-card.festival-card {
  background: rgba(156, 39, 176, 0.08);
  border-color: rgba(156, 39, 176, 0.2);
}

.dash-rating-left {
  display: flex;
  align-items: center;
  gap: 28px;
  min-width: 350px;
}

.dash-rating-icon {
  font-size: 5rem;
  filter: drop-shadow(0 4px 12px rgba(252, 220, 30, 0.5));
}

.dash-rating-main {
  flex: 1;
}

.dash-rating-score {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin: 0 0 12px 0;
}

.dash-rating-stars {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.dash-star {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.2);
  transition: color 0.3s ease;
}

.dash-star.filled {
  color: var(--yellow);
  text-shadow: 0 0 10px rgba(252, 220, 30, 0.5);
}

.dash-rating-meta {
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.dash-rating-right {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 28px;
}

.dash-rating-right h3 {
  color: var(--yellow);
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.dash-rating-distribution {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dash-distribution-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dash-distribution-label {
  min-width: 40px;
  font-weight: 700;
  color: var(--text);
  font-size: 0.95rem;
}

.dash-distribution-bar {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.dash-distribution-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--yellow) 0%, var(--purple) 100%);
  border-radius: 8px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.dash-distribution-count {
  min-width: 32px;
  text-align: right;
  font-weight: 700;
  color: var(--text);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .dash-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
  }

  .dash-rating-overview-card {
    flex-direction: column;
    gap: 24px;
  }

  .dash-rating-left {
    min-width: unset;
  }
}

@media (max-width: 768px) {
  .section-title {
    font-size: 2rem;
  }

  .dash-stats-grid {
    grid-template-columns: 1fr;
  }

  .dash-stat-card {
    padding: 20px;
  }

  .dash-stat-value {
    font-size: 2.2rem;
  }

  .dash-rating-score {
    font-size: 3rem;
  }

  .dash-rating-icon {
    font-size: 3.5rem;
  }
}
</style>
