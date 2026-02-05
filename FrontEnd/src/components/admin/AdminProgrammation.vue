<script setup>
import { ref } from 'vue'

const props = defineProps({
  programmation: {
    type: Object,
    default: () => ({ stages: [], schedules: [] })
  },
  selectedDayIndex: { type: Number, default: 0 },
  selectedStage: { type: String, default: '' },
  editingSlot: { type: Object, default: null }
})

const emit = defineEmits([
  'update:selectedDayIndex',
  'update:selectedStage',
  'update:editingSlot',
  'addSlot',
  'editSlot',
  'deleteSlot',
  'saveSlot',
  'cancelEdit',
  'save'
])

const localSelectedDayIndex = ref(props.selectedDayIndex)
const localSelectedStage = ref(props.selectedStage)

const updateDay = (value) => {
  localSelectedDayIndex.value = value
  emit('update:selectedDayIndex', value)
}

const updateStage = (value) => {
  localSelectedStage.value = value
  emit('update:selectedStage', value)
}

const handleAddSlot = () => {
  emit('addSlot', localSelectedDayIndex.value, localSelectedStage.value)
}

const handleEditSlot = (slotIndex) => {
  emit('editSlot', localSelectedDayIndex.value, localSelectedStage.value, slotIndex)
}

const handleDeleteSlot = (slotIndex) => {
  emit('deleteSlot', localSelectedDayIndex.value, localSelectedStage.value, slotIndex)
}

const handleSaveSlot = () => {
  emit('saveSlot')
}

const handleCancelEdit = () => {
  emit('cancelEdit')
}

const handleSave = () => {
  emit('save')
}

const getCurrentSlots = () => {
  if (!props.programmation.schedules[localSelectedDayIndex.value]) return []
  return props.programmation.schedules[localSelectedDayIndex.value][localSelectedStage.value] || []
}

const isEditing = (slotIndex) => {
  return props.editingSlot &&
         props.editingSlot.dayIndex === localSelectedDayIndex.value &&
         props.editingSlot.stageName === localSelectedStage.value &&
         props.editingSlot.slotIndex === slotIndex
}
</script>

<template>
  <div class="section-content">
    <div class="section-header">
      <h1 class="section-title">Gestion de la programmation</h1>
    </div>

    <div class="prog-config-wrapper">
      <div class="prog-intro-card">
        <div class="prog-intro-icon">🎵</div>
        <div class="prog-intro-content">
          <h3>Programmation artistique</h3>
          <p>Gérez les créneaux horaires des artistes sur les différentes scènes du festival. Planifiez les performances jour par jour et scène par scène pour offrir la meilleure expérience aux festivaliers.</p>
        </div>
      </div>

      <div class="prog-controls-card">
        <div class="prog-control-group">
          <label class="prog-control-label">
            <span class="prog-label-icon">📅</span>
            Sélectionner le jour
          </label>
          <select :value="localSelectedDayIndex" @change="updateDay(Number($event.target.value))" class="prog-select">
            <option v-for="(day, index) in programmation.schedules" :key="index" :value="index">
              {{ day.day || `Jour ${index + 1}` }}
            </option>
          </select>
        </div>

        <div class="prog-control-group">
          <label class="prog-control-label">
            <span class="prog-label-icon">🎤</span>
            Sélectionner la scène
          </label>
          <select :value="localSelectedStage" @change="updateStage($event.target.value)" class="prog-select">
            <option v-for="stage in programmation.stages" :key="stage.name" :value="stage.name">
              {{ stage.name }} {{ stage.by ? `(by ${stage.by})` : '' }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="localSelectedStage && programmation.schedules[localSelectedDayIndex]" class="prog-slots-container">
        <div class="prog-slots-header">
          <div class="prog-slots-title-wrapper">
            <h3 class="prog-slots-title">{{ localSelectedStage }}</h3>
            <p class="prog-slots-subtitle">Créneaux programmés pour cette scène</p>
          </div>
          <button @click="handleAddSlot" class="btn-prog-add">
            <span class="btn-prog-icon">➕</span>
            Ajouter un créneau
          </button>
        </div>

        <div v-if="getCurrentSlots().length" class="prog-slots-grid">
          <div
            v-for="(slot, slotIndex) in getCurrentSlots()"
            :key="slotIndex"
            class="prog-slot-card"
            :class="{ 'prog-slot-editing': isEditing(slotIndex) }"
          >
            <div v-if="isEditing(slotIndex)" class="prog-slot-editor">
              <div class="prog-editor-header">
                <span class="prog-editor-icon">✏️</span>
                <h4>Modifier le créneau</h4>
              </div>

              <div class="prog-form-group">
                <label class="prog-form-label">Nom de l'artiste</label>
                <input v-model="slot.artist" class="prog-form-input" placeholder="Ex: Nekfeu, PNL..." />
              </div>

              <div class="prog-form-row">
                <div class="prog-form-group">
                  <label class="prog-form-label">Heure de début</label>
                  <input v-model="slot.start" type="time" class="prog-form-input" />
                </div>
                <div class="prog-form-group">
                  <label class="prog-form-label">Heure de fin</label>
                  <input v-model="slot.end" type="time" class="prog-form-input" />
                </div>
              </div>

              <div class="prog-form-group">
                <label class="prog-form-label">Style musical</label>
                <input v-model="slot.style" class="prog-form-input" placeholder="Ex: Rap, Trap, Boom Bap..." />
              </div>

              <div class="prog-editor-actions">
                <button @click="handleSaveSlot" class="btn-prog-save">
                  <span class="btn-prog-icon">💾</span>
                  Sauvegarder
                </button>
                <button @click="handleCancelEdit" class="btn-prog-cancel">
                  <span class="btn-prog-icon">❌</span>
                  Annuler
                </button>
              </div>
            </div>

            <div v-else class="prog-slot-display">
              <div class="prog-slot-badge">
                <span class="prog-badge-icon">🎤</span>
                Créneau {{ slotIndex + 1 }}
              </div>
              <div class="prog-slot-info">
                <h4 class="prog-artist-name">{{ slot.artist }}</h4>
                <div class="prog-slot-meta">
                  <span class="prog-time-badge">
                    <span class="prog-time-icon">🕐</span>
                    {{ slot.start }} - {{ slot.end }}
                  </span>
                  <span class="prog-style-badge">
                    <span class="prog-style-icon">🎵</span>
                    {{ slot.style }}
                  </span>
                </div>
              </div>
              <div class="prog-slot-actions">
                <button @click="handleEditSlot(slotIndex)" class="btn-prog-edit">
                  <span class="btn-action-icon">✏️</span>
                </button>
                <button @click="handleDeleteSlot(slotIndex)" class="btn-prog-delete">
                  <span class="btn-action-icon">🗑️</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="prog-empty-state">
          <div class="prog-empty-icon">🎭</div>
          <h3 class="prog-empty-title">Aucun créneau programmé</h3>
          <p class="prog-empty-text">Il n'y a pas encore d'artistes programmés sur cette scène pour ce jour.</p>
          <button @click="handleAddSlot" class="btn-prog-add-first">
            <span class="btn-prog-icon">➕</span>
            Ajouter le premier créneau
          </button>
        </div>
      </div>

      <div class="prog-global-actions">
        <button @click="handleSave" class="btn-prog-save-all">
          <span class="btn-prog-icon">💾</span>
          Sauvegarder toute la programmation
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Variables */
:root {
  --bg-dark: rgba(15, 23, 42, 0.96);
  --border: rgba(148, 163, 184, 0.5);
  --border-light: rgba(148, 163, 184, 0.3);
  --text: #e5e7eb;
  --text-muted: rgba(148, 163, 184, 0.9);
  --yellow: #FCDC1E;
  --purple: #a855f7;
  --blue: #3b82f6;
  --red: #ef4444;
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 28px rgba(15, 23, 42, 0.7);
}

.section-content {
  max-width: 1600px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 32px;
}

.section-title {
  color: var(--yellow);
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.prog-config-wrapper {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.prog-intro-card {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.2);
}

.prog-intro-icon {
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

.prog-intro-content {
  flex: 1;
}

.prog-intro-content h3 {
  color: var(--purple);
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.prog-intro-content p {
  color: var(--text);
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
}

.prog-controls-card {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  box-shadow: var(--shadow-sm);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.prog-control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prog-control-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.prog-label-icon {
  font-size: 1.1rem;
}

.prog-select {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid var(--border-light);
  color: var(--text);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  font-family: inherit;
  cursor: pointer;
}

.prog-select:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.prog-slots-container {
  margin-top: 32px;
}

.prog-slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}

.prog-slots-title-wrapper {
  flex: 1;
}

.prog-slots-title {
  color: var(--yellow);
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 6px 0;
  text-transform: uppercase;
}

.prog-slots-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

.btn-prog-add, .btn-prog-add-first {
  background: linear-gradient(135deg, var(--blue) 0%, #2563eb 100%);
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

.btn-prog-add:hover, .btn-prog-add-first:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);
}

.prog-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.prog-slot-card {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.prog-slot-card:hover {
  transform: translateY(-4px);
  border-color: var(--blue);
  box-shadow: var(--shadow-md);
}

.prog-slot-editing {
  border-color: var(--purple);
}

.prog-slot-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prog-editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-light);
}

.prog-editor-icon {
  font-size: 1.5rem;
}

.prog-editor-header h4 {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
}

.prog-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prog-form-label {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.prog-form-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid var(--border-light);
  color: var(--text);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.prog-form-input:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.prog-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.prog-editor-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.btn-prog-save {
  flex: 1;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  padding: 12px 20px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(252, 220, 30, 0.4);
}

.btn-prog-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(252, 220, 30, 0.6);
}

.btn-prog-cancel {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  padding: 12px 20px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-prog-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.prog-slot-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prog-slot-badge {
  background: linear-gradient(135deg, var(--purple) 0%, #818cf8 100%);
  color: #fff;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
}

.prog-badge-icon {
  font-size: 0.9rem;
}

.prog-slot-info {
  flex: 1;
}

.prog-artist-name {
  color: var(--yellow);
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 12px 0;
}

.prog-slot-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.prog-time-badge, .prog-style-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-light);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.prog-time-icon, .prog-style-icon {
  font-size: 1rem;
}

.prog-slot-actions {
  display: flex;
  gap: 8px;
  align-self: flex-start;
}

.btn-prog-edit {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: var(--blue);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-prog-edit:hover {
  background: rgba(59, 130, 246, 0.25);
  transform: translateY(-2px);
}

.btn-prog-delete {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--red);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-prog-delete:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
}

.btn-action-icon {
  font-size: 1rem;
}

.prog-empty-state {
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed var(--border-light);
  border-radius: 20px;
  padding: 60px 32px;
  text-align: center;
}

.prog-empty-icon {
  font-size: 5rem;
  opacity: 0.3;
  display: block;
  margin-bottom: 20px;
}

.prog-empty-title {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.prog-empty-text {
  color: var(--text-muted);
  font-size: 1rem;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.prog-global-actions {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 32px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(168, 85, 247, 0.08) 100%);
  border: 2px solid var(--border-light);
  border-radius: 20px;
}

.btn-prog-save-all {
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  padding: 16px 40px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(252, 220, 30, 0.5);
}

.btn-prog-save-all:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(252, 220, 30, 0.7);
}

.btn-prog-icon {
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .prog-controls-card {
    grid-template-columns: 1fr;
  }

  .prog-slots-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .section-title {
    font-size: 2rem;
  }

  .prog-intro-card {
    flex-direction: column;
    text-align: center;
  }

  .prog-slots-header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-prog-add, .btn-prog-save-all {
    width: 100%;
    justify-content: center;
  }

  .prog-form-row {
    grid-template-columns: 1fr;
  }
}
</style>
