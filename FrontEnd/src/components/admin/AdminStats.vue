<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  avisStatsParPrestataire: {
    type: Array,
    default: () => []
  },
  stats: {
    type: Object,
    default: () => ({
      totalAvisFestival: 0,
      avisFestivalMoyenne: 0,
      repartitionNotesFestival: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      dernierAvisFestival: []
    })
  }
})

const emit = defineEmits(['selectPrestataire'])

// Ref pour le canvas Chart.js
const chartCanvas = ref(null)
const selectedPrestataireStats = ref(null)
let chartInstance = null

const selectPrestataireStats = (item) => {
  selectedPrestataireStats.value = item
}

// MODIFICATION: Fonction pour créer le graphique directement dans le composant
const createBarChart = () => {
  if (!chartCanvas.value) return

  // Charger Chart.js si nécessaire
  if (!window.Chart) {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js'
    script.onload = () => initChart()
    document.head.appendChild(script)
  } else {
    initChart()
  }
}

const initChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }

  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')

  // Préparer les données
  const sortedStats = [...props.avisStatsParPrestataire]
    .filter(p => p.nbAvis > 0)
    .sort((a, b) => b.moyenne - a.moyenne)

  if (sortedStats.length === 0) return

  const labels = sortedStats.map(p => p.nom)
  const data = sortedStats.map(p => p.moyenne)
  const backgroundColors = sortedStats.map(p => {
    if (p.moyenne >= 4.5) return 'rgba(34, 197, 94, 0.8)'
    if (p.moyenne >= 4) return 'rgba(252, 220, 30, 0.8)'
    if (p.moyenne >= 3) return 'rgba(255, 152, 0, 0.8)'
    return 'rgba(239, 68, 68, 0.8)'
  })

  chartInstance = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Note moyenne',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c.replace('0.8', '1')),
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 50
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#FCDC1E',
          bodyColor: '#e5e7eb',
          borderColor: 'rgba(252, 220, 30, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function (context) {
              const prestataire = sortedStats[context.dataIndex]
              return [
                `Note: ${context.parsed.y.toFixed(2)} / 5`,
                `Nombre d'avis: ${prestataire.nbAvis}`
              ]
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          ticks: {
            stepSize: 1,
            color: 'rgba(226, 232, 240, 0.8)',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: 'rgba(226, 232, 240, 0.8)',
            font: {
              size: 11,
              weight: '600'
            },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  })
}

// MODIFICATION: Créer le graphique au montage et lors des changements
onMounted(() => {
  nextTick(() => {
    if (chartCanvas.value && props.avisStatsParPrestataire.length > 0) {
      createBarChart()
    }
  })
})

watch(() => props.avisStatsParPrestataire, (newVal) => {
  if (newVal.length > 0 && chartCanvas.value) {
    nextTick(() => {
      createBarChart()
    })
  }
}, { deep: true })
</script>

<template>
  <div class="section-content">
    <h1 class="section-title">Statistiques</h1>

    <!-- SECTION PRESTATAIRES -->
    <div class="stats-main-section">
      <div class="stats-section-header">
        <h2 class="stats-section-title">🏢 Statistiques des Prestataires</h2>
        <p class="stats-section-subtitle">Performances et retours clients sur les prestataires du festival</p>
      </div>

      <!-- Graphique Chart.js -->
      <div v-if="avisStatsParPrestataire.length > 0" class="chart-card-full">
        <h3>📊 Notes moyennes des prestataires</h3>
        <div class="chart-container">
          <canvas ref="chartCanvas" id="prestataireChart"></canvas>
        </div>
        <p class="chart-hint">
          💡 Ce graphique montre la note moyenne de chaque prestataire basée sur les avis des festivaliers.
          Les barres sont colorées selon la qualité: vert (≥4.5), jaune (≥4), orange (≥3), rouge (&lt;3).
        </p>
      </div>

      <div v-else class="chart-card-full">
        <h3>📊 Notes moyennes des prestataires</h3>
        <div class="chart-container" style="display: flex; align-items: center; justify-content: center;">
          <p style="color: rgba(226, 232, 240, 0.7); font-size: 1.1rem;">
            ⏳ Chargement des données...
          </p>
        </div>
      </div>

      <!-- Avis stats section -->
      <div class="avis-stats-section">
        <h2 class="avis-section-title">📊 Notes et avis des prestataires</h2>
        <p class="avis-section-subtitle">
          Vue d'ensemble des avis (notes et commentaires) laissés par les festivaliers sur chaque prestataire.
        </p>

        <div class="avis-stats-grid">
          <!-- Liste des prestataires -->
          <div class="avis-prestataires-list">
            <h3 class="list-title">Sélectionner un prestataire</h3>
            <div class="prestataire-cards">
              <div
                v-for="item in avisStatsParPrestataire"
                :key="item.nom"
                @click="selectPrestataireStats(item)"
                :class="['prestataire-stat-card', { 'selected': selectedPrestataireStats && selectedPrestataireStats.nom === item.nom }]"
              >
                <div class="card-header">
                  <h4>{{ item.nom }}</h4>
                  <span class="badge-avis">{{ item.nbAvis }} avis</span>
                </div>
                <div class="card-rating">
                  <div class="rating-value" v-if="item.nbAvis">
                    {{ item.moyenne.toFixed(1) }}
                  </div>
                  <div class="rating-value no-rating" v-else>—</div>
                  <div class="rating-stars-mini">
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="star-mini"
                      :class="{ filled: item.nbAvis && i <= Math.round(item.moyenne) }"
                    >★</span>
                  </div>
                </div>
                <div class="card-footer" v-if="item.dernierAvis">
                  <span class="last-comment-label">Dernier avis :</span>
                  <p class="last-comment-text">
                    "{{ item.dernierAvis.commentaire.length > 50 ? (item.dernierAvis.commentaire.slice(0, 50) + '...') : item.dernierAvis.commentaire }}"
                  </p>
                </div>
                <div class="card-footer" v-else>
                  <p class="no-comment-text">Aucun avis pour le moment</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Panneau de détail -->
          <div class="avis-detail-panel" v-if="selectedPrestataireStats">
            <div class="detail-header">
              <h3>{{ selectedPrestataireStats.nom }}</h3>
              <button @click="selectedPrestataireStats = null" class="btn-close-detail">✕</button>
            </div>

            <div class="detail-content">
              <div class="detail-score-section">
                <div class="detail-score-main">
                  <div class="detail-score-value">
                    {{ selectedPrestataireStats.nbAvis ? selectedPrestataireStats.moyenne.toFixed(1) : '—' }}
                  </div>
                  <div class="detail-score-label">sur 5</div>
                </div>
                <div class="detail-score-stars">
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="star-detail"
                    :class="{ filled: selectedPrestataireStats.nbAvis && i <= Math.round(selectedPrestataireStats.moyenne) }"
                  >★</span>
                </div>
                <div class="detail-score-meta">
                  Basé sur {{ selectedPrestataireStats.nbAvis }} avis
                </div>
              </div>

              <div class="detail-distribution">
                <h4>Répartition des notes</h4>
                <div class="distribution-bars">
                  <div
                    v-for="i in [5,4,3,2,1]"
                    :key="i"
                    class="distribution-bar-row"
                  >
                    <span class="distribution-star-label">{{ i }}★</span>
                    <div class="distribution-bar-bg">
                      <div
                        class="distribution-bar-fg"
                        :style="{ width: selectedPrestataireStats.nbAvis ? (selectedPrestataireStats.parNote[i] / selectedPrestataireStats.nbAvis) * 100 + '%' : '0%' }"
                      ></div>
                    </div>
                    <span class="distribution-count-label">
                      {{ selectedPrestataireStats.parNote[i] }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="detail-info-box">
                <p>💡 Ces statistiques sont basées sur les avis saisis par les festivaliers directement sur la page du prestataire.</p>
              </div>
            </div>
          </div>

          <div class="avis-detail-panel empty" v-else>
            <div class="empty-state">
              <span class="empty-icon">📊</span>
              <h3>Aucun prestataire sélectionné</h3>
              <p>Cliquez sur un prestataire dans la liste de gauche pour voir les détails de ses avis.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION FESTIVAL -->
    <div class="stats-main-section">
      <div class="stats-section-header festival-header">
        <h2 class="stats-section-title">🎪 Statistiques du Festival</h2>
        <p class="stats-section-subtitle">Retours festivaliers et performances commerciales de l'événement</p>
      </div>

      <div class="festival-avis-stats">
        <h3 class="festival-subsection-title">⭐ Notes et avis du festival</h3>

        <div class="festival-rating-overview">
          <div class="festival-rating-card-main">
            <div class="festival-rating-icon-wrapper">
              <div class="festival-rating-icon-large">🎉</div>
            </div>
            <div class="festival-rating-details">
              <div class="festival-rating-score-huge">
                {{ stats.totalAvisFestival > 0 ? stats.avisFestivalMoyenne.toFixed(1) : '—' }}
              </div>
              <div class="festival-rating-stars-large">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="star-huge"
                  :class="{ filled: stats.totalAvisFestival > 0 && i <= Math.round(stats.avisFestivalMoyenne) }"
                >★</span>
              </div>
              <div class="festival-rating-label">
                Note moyenne du festival
              </div>
              <div class="festival-rating-count">
                {{ stats.totalAvisFestival }} avis festivaliers
              </div>
            </div>
          </div>

          <div class="festival-rating-distribution-card">
            <h4>Répartition des notes</h4>
            <div class="festival-distribution-bars">
              <div
                v-for="i in [5, 4, 3, 2, 1]"
                :key="i"
                class="festival-distribution-row"
              >
                <span class="festival-dist-label">{{ i }}★</span>
                <div class="festival-dist-bar-bg">
                  <div
                    class="festival-dist-bar-fill"
                    :style="{
                      width: stats.totalAvisFestival > 0 ? (stats.repartitionNotesFestival[i] / stats.totalAvisFestival * 100) + '%' : '0%'
                    }"
                  ></div>
                </div>
                <span class="festival-dist-count">{{ stats.repartitionNotesFestival[i] }}</span>
                <span class="festival-dist-percent">
                  {{ stats.totalAvisFestival > 0 ? Math.round((stats.repartitionNotesFestival[i] / stats.totalAvisFestival) * 100) : 0 }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="festival-comments-section">
          <h4 class="comments-title">💬 Commentaires des festivaliers</h4>
          <div v-if="stats.dernierAvisFestival.length > 0" class="comments-list">
            <div
              v-for="avis in stats.dernierAvisFestival"
              :key="avis.id"
              class="comment-card"
            >
              <div class="comment-header">
                <div class="comment-author">
                  <span class="author-icon">👤</span>
                  <strong>{{ avis.nom || 'Anonyme' }}</strong>
                </div>
                <div class="comment-rating">
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="comment-star"
                    :class="{ filled: i <= avis.note }"
                  >★</span>
                </div>
              </div>
              <p class="comment-text">{{ avis.commentaire }}</p>
              <div class="comment-date">
                {{ new Date(avis.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) }}
              </div>
            </div>
          </div>
          <div v-else class="no-comments">
            <span class="no-comments-icon">💭</span>
            <p>Aucun avis sur le festival pour le moment</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

/* Stats Main Section */
.stats-main-section {
  margin-bottom: 48px;
}

.stats-section-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border);
}

.stats-section-title {
  color: var(--yellow);
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.stats-section-subtitle {
  color: var(--text-muted);
  font-size: 1rem;
  margin: 0;
  line-height: 1.6;
}

/* Chart Card */
.chart-card-full {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid var(--border);
  padding: 28px 32px;
  margin-bottom: 36px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.chart-card-full h3 {
  margin: 0 0 24px 0;
  color: var(--text);
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.chart-container {
  position: relative;
  height: 440px;
  width: 100%;
  margin-bottom: 20px;
}

#prestataireChart {
  width: 100% !important;
  height: 100% !important;
}

.chart-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 16px 0 0 0;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid var(--yellow);
}

/* Avis Stats Section */
.avis-stats-section {
  margin-top: 40px;
}

.avis-section-title {
  color: var(--text);
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 12px 0;
}

.avis-section-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0 0 28px 0;
  line-height: 1.6;
}

.avis-stats-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.5fr);
  gap: 24px;
}

/* Liste prestataires */
.avis-prestataires-list {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid var(--border-light);
  padding: 24px;
}

.list-title {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 20px 0;
}

.prestataire-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

.prestataire-stat-card {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.prestataire-stat-card:hover {
  background: rgba(252, 220, 30, 0.08);
  border-color: rgba(252, 220, 30, 0.3);
  transform: translateX(4px);
}

.prestataire-stat-card.selected {
  background: rgba(252, 220, 30, 0.15);
  border-color: var(--yellow);
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h4 {
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.badge-avis {
  background: var(--purple);
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rating-value {
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--yellow);
  line-height: 1;
}

.rating-value.no-rating {
  color: var(--text-muted);
}

.rating-stars-mini {
  display: flex;
  gap: 2px;
}

.star-mini {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.2);
}

.star-mini.filled {
  color: var(--yellow);
  text-shadow: 0 0 8px rgba(252, 220, 30, 0.5);
}

.card-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.last-comment-label {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.last-comment-text {
  color: var(--text);
  font-size: 0.9rem;
  margin: 8px 0 0 0;
  font-style: italic;
}

.no-comment-text {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

/* Detail Panel */
.avis-detail-panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid var(--border);
  padding: 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.avis-detail-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: var(--text);
  font-size: 1.3rem;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border);
}

.detail-header h3 {
  color: var(--yellow);
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
}

.btn-close-detail {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close-detail:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
  transform: scale(1.1);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-score-section {
  text-align: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid var(--border-light);
}

.detail-score-main {
  margin-bottom: 16px;
}

.detail-score-value {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.detail-score-label {
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 600;
  margin-top: 8px;
}

.detail-score-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.star-detail {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.2);
}

.star-detail.filled {
  color: var(--yellow);
  text-shadow: 0 0 12px rgba(252, 220, 30, 0.5);
}

.detail-score-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.detail-distribution h4 {
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.distribution-star-label {
  min-width: 40px;
  font-weight: 700;
  color: var(--text);
  font-size: 0.95rem;
}

.distribution-bar-bg {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.distribution-bar-fg {
  height: 100%;
  background: linear-gradient(90deg, var(--yellow) 0%, var(--purple) 100%);
  border-radius: 8px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.distribution-count-label {
  min-width: 32px;
  text-align: right;
  font-weight: 700;
  color: var(--text);
  font-size: 0.9rem;
}

.detail-info-box {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  padding: 16px;
}

.detail-info-box p {
  color: var(--text);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.6;
}

/* Festival Stats */
.festival-subsection-title {
  color: var(--text);
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 24px 0;
}

.festival-rating-overview {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(0, 1.6fr);
  gap: 20px;
  margin-bottom: 32px;
}

.festival-rating-card-main {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid var(--border);
  padding: 32px;
  display: flex;
  gap: 24px;
  align-items: center;
}

.festival-rating-icon-wrapper {
  flex-shrink: 0;
}

.festival-rating-icon-large {
  font-size: 5rem;
  filter: drop-shadow(0 4px 12px rgba(252, 220, 30, 0.5));
}

.festival-rating-details {
  flex: 1;
  text-align: center;
}

.festival-rating-score-huge {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 16px;
}

.festival-rating-stars-large {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
}

.star-huge {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.2);
}

.star-huge.filled {
  color: var(--yellow);
  text-shadow: 0 0 12px rgba(252, 220, 30, 0.5);
}

.festival-rating-label {
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.festival-rating-count {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.festival-rating-distribution-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid var(--border);
  padding: 28px;
}

.festival-rating-distribution-card h4 {
  color: var(--yellow);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.festival-distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.festival-distribution-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.festival-dist-label {
  min-width: 40px;
  font-weight: 700;
  color: var(--text);
  font-size: 0.95rem;
}

.festival-dist-bar-bg {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.festival-dist-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--yellow) 0%, var(--purple) 100%);
  border-radius: 8px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.festival-dist-count {
  min-width: 32px;
  text-align: right;
  font-weight: 700;
  color: var(--text);
  font-size: 0.9rem;
}

.festival-dist-percent {
  min-width: 48px;
  text-align: right;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

/* Comments Section */
.festival-comments-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid var(--border-light);
  padding: 28px;
}

.comments-title {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 20px 0;
}

.comments-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.comment-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.comment-card:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(252, 220, 30, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-size: 0.9rem;
}

.author-icon {
  font-size: 1.2rem;
}

.comment-rating {
  display: flex;
  gap: 2px;
}

.comment-star {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.2);
}

.comment-star.filled {
  color: var(--yellow);
}

.comment-text {
  color: var(--text);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.comment-date {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-style: italic;
}

.no-comments {
  text-align: center;
  padding: 40px;
}

.no-comments-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 16px;
}

.no-comments p {
  color: var(--text-muted);
  font-size: 1rem;
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .avis-stats-grid {
    grid-template-columns: 1fr;
  }

  .festival-rating-overview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .section-title {
    font-size: 2rem;
  }

  .comments-list {
    grid-template-columns: 1fr;
  }

  .festival-rating-card-main {
    flex-direction: column;
    text-align: center;
  }
}
</style>
