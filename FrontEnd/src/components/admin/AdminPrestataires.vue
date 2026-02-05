<script setup>
const props = defineProps({
  prestataires: { type: Array, default: () => [] },
  customPrestataires: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['select'])

const hasModifications = (prestataire) => {
  return !!props.customPrestataires[prestataire.nom]
}

const getModifiedFields = (prestataire) => {
  const custom = props.customPrestataires[prestataire.nom]
  if (!custom) return []

  // Simplifié : retourner juste les clés modifiées
  return Object.keys(custom)
}

const selectPrestataire = (prestataire) => {
  emit('select', prestataire)
}
</script>

<template>
  <div class="section-content">
    <div class="section-header">
      <h1 class="section-title">Gestion des prestataires</h1>
    </div>

    <div class="prest-config-wrapper">
      <div class="prest-intro-card">
        <div class="prest-intro-icon">🏢</div>
        <div class="prest-intro-content">
          <h3>Gérez vos prestataires</h3>
          <p>Modifiez les informations, descriptions et services de tous les prestataires du festival. Les modifications sont sauvegardées localement et peuvent être réinitialisées à tout moment.</p>
        </div>
      </div>

      <div v-if="Object.keys(customPrestataires).length > 0" class="prest-modifications-alert">
        <div class="prest-alert-icon">📝</div>
        <div class="prest-alert-content">
          <strong class="prest-alert-title">{{ Object.keys(customPrestataires).length }} prestataire(s) modifié(s)</strong>
          <p class="prest-alert-text">Des modifications locales sont en cours sur certains prestataires</p>
        </div>
      </div>

      <div class="prest-stats-row">
        <div class="prest-stat-box">
          <div class="prest-stat-icon">🏢</div>
          <div class="prest-stat-details">
            <div class="prest-stat-number">{{ prestataires.length }}</div>
            <div class="prest-stat-label">Prestataires</div>
          </div>
        </div>
        <div class="prest-stat-box">
          <div class="prest-stat-icon">✏️</div>
          <div class="prest-stat-details">
            <div class="prest-stat-number">{{ Object.keys(customPrestataires).length }}</div>
            <div class="prest-stat-label">Modifiés</div>
          </div>
        </div>
        <div class="prest-stat-box">
          <div class="prest-stat-icon">🛠️</div>
          <div class="prest-stat-details">
            <div class="prest-stat-number">{{ prestataires.reduce((acc, p) => acc + (p.services?.length || 0), 0) }}</div>
            <div class="prest-stat-label">Services</div>
          </div>
        </div>
      </div>

      <div class="prest-list-container">
        <h3 class="prest-list-title">Liste des prestataires</h3>
        <div class="prest-grid">
          <div
            v-for="prestataire in prestataires"
            :key="prestataire.nom"
            @click="selectPrestataire(prestataire)"
            class="prest-card"
            :class="{ 'prest-card-modified': hasModifications(prestataire) }"
          >
            <div v-if="hasModifications(prestataire)" class="prest-modified-badge">
              <span class="prest-badge-icon">✏️</span>
              Modifié
            </div>

            <div class="prest-card-header">
              <img
                v-if="prestataire.image"
                :src="prestataire.image"
                :alt="prestataire.nom"
                class="prest-card-image"
              />
              <div v-else class="prest-card-placeholder">
                <span class="prest-placeholder-icon">🏢</span>
              </div>
            </div>

            <div class="prest-card-body">
              <h4 class="prest-card-name">{{ prestataire.nom }}</h4>
              <span class="prest-card-type">{{ prestataire.type }}</span>

              <div class="prest-card-meta">
                <div class="prest-meta-item">
                  <span class="prest-meta-icon">🛠️</span>
                  <span class="prest-meta-value">{{ prestataire.services?.length || 0 }} service(s)</span>
                </div>
              </div>

              <div v-if="hasModifications(prestataire)" class="prest-card-changes">
                <span class="prest-changes-label">Modifications :</span>
                <div class="prest-changes-tags">
                  <span
                    v-for="field in getModifiedFields(prestataire)"
                    :key="field"
                    class="prest-change-tag"
                  >{{ field }}</span>
                </div>
              </div>
            </div>

            <div class="prest-card-footer">
              <button class="prest-btn-view">
                <span class="prest-btn-icon">👁️</span>
                Voir les détails
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.prest-config-wrapper {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.prest-intro-card {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.2);
}

.prest-intro-icon {
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

.prest-intro-content {
  flex: 1;
}

.prest-intro-content h3 {
  color: var(--purple, #a855f7);
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.prest-intro-content p {
  color: var(--text, rgba(226, 232, 240, 0.95));
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
}

.prest-modifications-alert {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 32px;
  background: rgba(234, 179, 8, 0.1);
  border: 2px solid rgba(234, 179, 8, 0.3);
  border-radius: 16px;
}

.prest-alert-icon {
  font-size: 2.5rem;
}

.prest-alert-content {
  flex: 1;
}

.prest-alert-title {
  color: var(--yellow, #FCDC1E);
  font-size: 1.1rem;
  font-weight: 800;
  display: block;
  margin-bottom: 6px;
}

.prest-alert-text {
  color: rgba(226, 232, 240, 0.8);
  font-size: 0.95rem;
  margin: 0;
}

.prest-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.prest-stat-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
}

.prest-stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.7);
}

.prest-stat-icon {
  font-size: 2.5rem;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 16px;
  border: 2px solid rgba(252, 220, 30, 0.35);
  flex-shrink: 0;
}

.prest-stat-details {
  flex: 1;
}

.prest-stat-number {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--yellow, #FCDC1E);
  line-height: 1;
  margin-bottom: 6px;
}

.prest-stat-label {
  font-size: 0.9rem;
  color: rgba(148, 163, 184, 0.9);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prest-list-container {
  margin-top: 32px;
}

.prest-list-title {
  color: var(--text, #e5e7eb);
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.prest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.prest-card {
  position: relative;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.prest-card:hover {
  transform: translateY(-4px);
  border-color: var(--blue, #3b82f6);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.9);
}

.prest-card-modified {
  border-color: rgba(234, 179, 8, 0.5);
}

.prest-modified-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(234, 179, 8, 0.9);
  color: #0a0a0a;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.4);
}

.prest-badge-icon {
  font-size: 0.9rem;
}

.prest-card-header {
  width: 100%;
  height: 160px;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.05);
}

.prest-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.prest-card:hover .prest-card-image {
  transform: scale(1.05);
}

.prest-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
}

.prest-placeholder-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.prest-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prest-card-name {
  color: var(--yellow, #FCDC1E);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
}

.prest-card-type {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(168, 85, 247, 0.2);
  color: var(--purple, #a855f7);
  border: 1px solid rgba(168, 85, 247, 0.3);
  align-self: flex-start;
}

.prest-card-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prest-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: rgba(226, 232, 240, 0.8);
}

.prest-meta-icon {
  font-size: 1rem;
}

.prest-meta-value {
  font-weight: 600;
}

.prest-card-changes {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 10px;
  padding: 12px;
}

.prest-changes-label {
  display: block;
  color: var(--yellow, #FCDC1E);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.prest-changes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prest-change-tag {
  background: rgba(234, 179, 8, 0.2);
  color: rgba(234, 179, 8, 1);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.prest-card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.prest-btn-view {
  width: 100%;
  background: linear-gradient(135deg, var(--blue, #3b82f6) 0%, #2563eb 100%);
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.prest-btn-view:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.prest-btn-icon {
  font-size: 1rem;
}
</style>
