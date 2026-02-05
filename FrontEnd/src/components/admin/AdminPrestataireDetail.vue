<script setup>
import { ref, watch } from 'vue'
import WysiwygEditor from '@/components/WysiwygEditor.vue'

const props = defineProps({
  prestataire: { type: Object, default: null },
  hasModifications: { type: Boolean, default: false },
  modifiedFields: { type: Array, default: () => [] }
})

const emit = defineEmits(['save', 'back', 'reset'])

// CORRECTION: Normaliser la description en chaîne de caractères
const normalizePrestataire = (prestataire) => {
  if (!prestataire) return null

  const normalized = JSON.parse(JSON.stringify(prestataire))

  // S'assurer que description est une chaîne
  if (typeof normalized.description !== 'string') {
    normalized.description = normalized.description ? String(normalized.description) : ''
  }

  return normalized
}

const model = ref(normalizePrestataire(props.prestataire))

watch(() => props.prestataire, (newVal) => {
  if (newVal) {
    model.value = normalizePrestataire(newVal)
  }
}, { deep: true })

const addService = () => {
  if (!model.value) return
  if (!model.value.services) {
    model.value.services = []
  }
  model.value.services.push({
    nom: 'Nouveau service',
    description: 'Description du service',
    actif: true
  })
}

const toggleService = (index) => {
  if (!model.value?.services?.[index]) return
  model.value.services[index].actif = !model.value.services[index].actif
}

const deleteService = (index) => {
  if (!model.value?.services) return
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return
  model.value.services.splice(index, 1)
}

const onSave = () => {
  if (!model.value) return

  // S'assurer que description est une chaîne avant de sauvegarder
  const toSave = JSON.parse(JSON.stringify(model.value))
  if (typeof toSave.description !== 'string') {
    toSave.description = toSave.description ? String(toSave.description) : ''
  }

  emit('save', toSave)
}

const onBack = () => {
  emit('back')
}

const onReset = () => {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser ce prestataire ? Toutes les modifications locales seront supprimées.')) {
    emit('reset')
  }
}
</script>

<template>
  <div v-if="model" class="section-content">
    <div class="section-header">
      <button @click="onBack" class="btn-back">← Retour</button>
      <h1 class="section-title">{{ model.nom }}</h1>
    </div>

    <div class="prest-detail-wrapper">
      <div v-if="hasModifications" class="prest-detail-alert">
        <div class="prest-detail-alert-icon">⚠️</div>
        <div class="prest-detail-alert-content">
          <strong class="prest-detail-alert-title">Ce prestataire a des modifications locales</strong>
          <p class="prest-detail-alert-text">
            Champs modifiés : {{ modifiedFields.join(', ') || 'Aucun' }}
          </p>
        </div>
        <button @click="onReset" class="prest-btn-reset-detail">
          <span class="prest-btn-icon">🔄</span>
          Réinitialiser
        </button>
      </div>

      <div class="prest-editor-card">
        <div class="prest-editor-section">
          <h3 class="prest-editor-section-title">
            <span class="prest-section-icon">ℹ️</span>
            Informations générales
          </h3>

          <div class="prest-form-group">
            <label class="prest-form-label">Nom du prestataire</label>
            <input
              v-model="model.nom"
              type="text"
              class="prest-form-input"
              placeholder="Nom du prestataire"
            />
          </div>

          <div class="prest-form-group">
            <label class="prest-form-label">Type</label>
            <input
              v-model="model.type"
              type="text"
              class="prest-form-input"
              placeholder="Type de prestataire"
            />
          </div>

          <div class="prest-form-group">
            <label class="prest-form-label">Image (URL)</label>
            <input
              v-model="model.image"
              type="text"
              class="prest-form-input"
              placeholder="https://..."
            />
            <div v-if="model.image" class="prest-image-preview">
              <img :src="model.image" alt="Aperçu" />
            </div>
          </div>
        </div>

        <div class="prest-editor-section">
          <h3 class="prest-editor-section-title">
            <span class="prest-section-icon">📝</span>
            Description (Éditeur WYSIWYG)
          </h3>

          <div class="prest-form-group">
            <WysiwygEditor
              v-model="model.description"
              :height="600"
              placeholder="Décrivez le prestataire, ajoutez des images..."
            />
            <p class="prest-form-hint">
              <span class="hint-icon">💡</span>
              Utilisez l'éditeur pour formater le texte et insérer des images
            </p>
          </div>

          <div class="prest-form-group">
            <label class="prest-form-label">Aperçu de la description</label>
            <div class="prest-preview-box" v-html="model.description"></div>
          </div>
        </div>

        <div class="prest-editor-section">
          <div class="prest-services-header">
            <h3 class="prest-editor-section-title">
              <span class="prest-section-icon">🛠️</span>
              Services ({{ model.services?.length || 0 }})
            </h3>
            <button @click="addService" class="prest-btn-add-service">
              <span class="prest-btn-icon">➕</span>
              Ajouter un service
            </button>
          </div>

          <div v-if="model.services?.length" class="prest-services-list">
            <div
              v-for="(service, index) in model.services"
              :key="index"
              class="prest-service-card"
              :class="{ 'prest-service-inactive': service.actif === false }"
            >
              <div class="prest-service-number">
                <span class="prest-number-icon">📋</span>
                Service {{ index + 1 }}
              </div>

              <div class="prest-service-content">
                <div class="prest-form-group">
                  <label class="prest-form-label-small">Nom du service</label>
                  <input
                    v-model="service.nom"
                    type="text"
                    class="prest-form-input"
                    placeholder="Nom du service"
                  />
                </div>

                <div class="prest-form-group">
                  <label class="prest-form-label-small">Description</label>
                  <textarea
                    v-model="service.description"
                    class="prest-form-textarea"
                    rows="3"
                    placeholder="Description du service"
                  ></textarea>
                </div>
              </div>

              <div class="prest-service-actions">
                <button
                  @click="toggleService(index)"
                  :class="['prest-btn-toggle', { 'prest-btn-toggle-active': service.actif !== false }]"
                >
                  <span class="prest-toggle-icon">{{ service.actif !== false ? '✓' : '✗' }}</span>
                  {{ service.actif !== false ? 'Actif' : 'Inactif' }}
                </button>
                <button @click="deleteService(index)" class="prest-btn-delete-service">
                  <span class="prest-btn-icon">🗑️</span>
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          <div v-else class="prest-services-empty">
            <div class="prest-empty-icon">🛠️</div>
            <h4 class="prest-empty-title">Aucun service</h4>
            <p class="prest-empty-text">Ajoutez des services pour ce prestataire</p>
          </div>
        </div>

        <div class="prest-editor-footer">
          <button @click="onSave" class="prest-btn-save">
            <span class="prest-btn-icon">💾</span>
            Sauvegarder toutes les modifications
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-prestataire-detail {
  padding: 28px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(252, 220, 30, 0.2);
}

.section-header h2 {
  color: #FCDC1E;
  font-size: 1.8rem;
  margin: 0;
  font-weight: 800;
}

.btn-back {
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: rgba(252, 220, 30, 0.1);
  border-color: rgba(252, 220, 30, 0.3);
}

.prest-detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.prest-detail-alert {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 152, 0, 0.1);
  border: 2px solid rgba(255, 152, 0, 0.4);
  border-radius: 16px;
  padding: 20px;
}

.prest-detail-alert-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.prest-detail-alert-content {
  flex: 1;
}

.prest-detail-alert-title {
  color: var(--orange, #ff9800);
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
}

.prest-detail-alert-text {
  color: rgba(226, 232, 240, 0.8);
  font-size: 0.9rem;
  margin: 0;
}

.prest-btn-reset-detail {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.3s ease;
}

.prest-btn-reset-detail:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.prest-editor-card {
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.prest-editor-section {
  padding: 28px 0;
  border-bottom: 2px solid rgba(148, 163, 184, 0.2);
}

.prest-editor-section:last-child {
  border-bottom: none;
}

.prest-editor-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text, #e5e7eb);
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 24px 0;
}

.prest-section-icon {
  font-size: 1.5rem;
}

.prest-form-group {
  margin-bottom: 24px;
}

.prest-form-label,
.prest-form-label-small {
  display: block;
  color: rgba(148, 163, 184, 0.9);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.prest-form-input,
.prest-form-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(148, 163, 184, 0.3);
  color: var(--text, #e5e7eb);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.prest-form-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.6;
}

.prest-form-input:focus,
.prest-form-textarea:focus {
  outline: none;
  border-color: var(--blue, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.prest-image-preview {
  margin-top: 12px;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(148, 163, 184, 0.3);
}

.prest-image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.prest-form-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin: 8px 0 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.hint-icon {
  font-size: 1rem;
}

.prest-preview-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 20px;
  min-height: 150px;
  color: var(--text, #e5e7eb);
  line-height: 1.6;
}

.prest-services-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.prest-btn-add-service {
  background: linear-gradient(135deg, var(--blue, #3b82f6) 0%, #2563eb 100%);
  border: none;
  color: #fff;
  padding: 12px 24px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.prest-btn-add-service:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);
}

.prest-services-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prest-service-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: start;
  transition: all 0.3s ease;
}

.prest-service-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--purple, #a855f7);
}

.prest-service-inactive {
  opacity: 0.6;
  border-style: dashed;
}

.prest-service-number {
  background: linear-gradient(135deg, var(--purple, #a855f7) 0%, #818cf8 100%);
  color: #fff;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.prest-number-icon {
  font-size: 1rem;
}

.prest-service-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prest-service-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prest-btn-toggle {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--red, #ef4444);
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.prest-btn-toggle-active {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: var(--green, #22c55e);
}

.prest-btn-toggle:hover {
  transform: translateY(-2px);
}

.prest-toggle-icon {
  font-size: 1rem;
}

.prest-btn-delete-service {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--red, #ef4444);
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.prest-btn-delete-service:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
}

.prest-services-empty {
  text-align: center;
  padding: 60px 20px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed rgba(148, 163, 184, 0.3);
  border-radius: 16px;
}

.prest-empty-icon {
  font-size: 4rem;
  opacity: 0.5;
  display: block;
  margin-bottom: 16px;
}

.prest-empty-title {
  color: var(--text, #e5e7eb);
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.prest-empty-text {
  color: rgba(148, 163, 184, 0.9);
  font-size: 0.95rem;
  margin: 0;
}

.prest-editor-footer {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid rgba(148, 163, 184, 0.2);
}

.prest-btn-save {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  background: linear-gradient(135deg, var(--yellow, #FCDC1E) 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: all 0.3s ease;
  box-shadow: 0 6px 28px rgba(252, 220, 30, 0.4);
}

.prest-btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(252, 220, 30, 0.6);
}

.prest-btn-icon {
  font-size: 1.1rem;
}
</style>
