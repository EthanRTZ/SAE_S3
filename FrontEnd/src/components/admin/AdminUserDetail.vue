<script setup>
import { ref, watch } from 'vue'
// Props: utilisateur sélectionné, mode création
const props = defineProps({
  user: { type: Object, default: null },
  isCreating: { type: Boolean, default: false }
})

// Emits: save(updated), back(), delete(email)
const emit = defineEmits(['save', 'back', 'delete'])

const defaultUser = { email: '', password: '', role: 'user', prestataireNom: '' }
const model = ref(props.user ? { ...props.user } : { ...defaultUser })

watch(() => props.user, (u) => {
  if (u) {
    model.value = { ...u }
  } else {
    model.value = { ...defaultUser }
  }
})

const onSave = () => emit('save', { ...model.value })
const onBack = () => emit('back')
const onDelete = () => emit('delete', model.value.email)
</script>

<template>
  <section class="admin-user-detail">
    <header class="section-header">
      <h2>{{ isCreating ? '➕ Créer un utilisateur' : '✏️ Modifier l\'utilisateur' }}</h2>
      <button class="btn-back" @click="onBack">← Retour</button>
    </header>

    <div class="form-grid">
      <label class="form-label">
        <span>Email</span>
        <input v-model="model.email" type="email" class="input" />
      </label>
      <label class="form-label">
        <span>Mot de passe</span>
        <input v-model="model.password" type="password" class="input" />
      </label>
      <label class="form-label">
        <span>Rôle</span>
        <select v-model="model.role" class="input">
          <option value="user">Utilisateur</option>
          <option value="admin">Admin</option>
          <option value="prestataire">Prestataire</option>
        </select>
      </label>
      <label class="form-label">
        <span>Prestataire associé</span>
        <input v-model="model.prestataireNom" type="text" class="input" placeholder="Nom du prestataire" />
      </label>
    </div>

    <footer class="actions">
      <button class="btn-primary" @click="onSave">💾 Sauvegarder</button>
      <button class="btn-danger" v-if="!isCreating" @click="onDelete">🗑️ Supprimer</button>
    </footer>
  </section>
</template>

<style scoped>
.admin-user-detail {
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
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.input {
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

.input:focus {
  outline: none;
  border-color: #FCDC1E;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 3px rgba(252, 220, 30, 0.1);
}

select.input {
  cursor: pointer;
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

.btn-danger {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}
</style>
