<script setup>
import { ref, watch } from 'vue'
const props = defineProps({
  prestataire: { type: Object, default: null }
})
const emit = defineEmits(['save', 'back'])

const model = ref(props.prestataire ? { ...props.prestataire } : null)
watch(() => props.prestataire, (p) => {
  model.value = p ? { ...p } : null
})

const addService = () => {
  if (!model.value) return
  model.value.services ||= []
  model.value.services.push({ nom: '', description: '', actif: true })
}

const toggleService = (idx) => {
  if (!model.value?.services?.[idx]) return
  model.value.services[idx].actif = !model.value.services[idx].actif
}

const deleteService = (idx) => {
  if (!model.value?.services) return
  if (!confirm('Supprimer ce service ?')) return
  model.value.services.splice(idx, 1)
}

const onSave = () => emit('save', { ...model.value })
const onBack = () => emit('back')
</script>

<template>
  <section v-if="model" class="admin-prestataire-detail">
    <header class="section-header">
      <h2>{{ model.nom }}</h2>
      <button class="btn-back" @click="onBack">← Retour</button>
    </header>

    <div class="form-grid">
      <label class="form-label">
        <span>Nom</span>
        <input v-model="model.nom" class="input" />
      </label>
      <label class="form-label">
        <span>Description</span>
        <textarea v-model="model.description" class="textarea" rows="3" />
      </label>
    </div>

    <div class="services-section">
      <div class="services-header">
        <h3>Services</h3>
        <button class="btn-add" @click="addService">➕ Ajouter un service</button>
      </div>
      <ul class="list">
        <li v-for="(s, i) in model.services || []" :key="i" class="list-item">
          <input v-model="s.nom" placeholder="Nom du service" class="input-inline" />
          <input v-model="s.description" placeholder="Description" class="input-inline" />
          <label class="checkbox-label">
            <input type="checkbox" v-model="s.actif" class="checkbox" />
            <span>Actif</span>
          </label>
          <button class="btn-danger-small" @click="deleteService(i)">🗑️</button>
        </li>
      </ul>
    </div>

    <footer class="actions">
      <button class="btn-primary" @click="onSave">💾 Sauvegarder</button>
    </footer>
  </section>
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.input, .textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.input:focus, .textarea:focus {
  outline: none;
  border-color: #FCDC1E;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 3px rgba(252, 220, 30, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.services-section {
  margin-bottom: 24px;
}

.services-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.services-header h3 {
  color: #FCDC1E;
  font-size: 1.3rem;
  margin: 0;
  font-weight: 700;
}

.btn-add {
  background: rgba(252, 220, 30, 0.15);
  color: #FCDC1E;
  border: 1px solid rgba(252, 220, 30, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-add:hover {
  background: rgba(252, 220, 30, 0.25);
  border-color: rgba(252, 220, 30, 0.5);
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  display: grid;
  grid-template-columns: 1fr 1.5fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.list-item:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(252, 220, 30, 0.2);
}

.input-inline {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.input-inline:focus {
  outline: none;
  border-color: #FCDC1E;
  box-shadow: 0 0 0 2px rgba(252, 220, 30, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  cursor: pointer;
}

.checkbox {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.btn-danger-small {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-danger-small:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid rgba(252, 220, 30, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #ffe676;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.4);
}
</style>
