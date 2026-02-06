<script setup>
import { ref, watch } from 'vue'
// Props: utilisateur sélectionné, mode création
const props = defineProps({
  user: { type: Object, default: null },
  isCreating: { type: Boolean, default: false },
  prestataires: { type: Array, default: () => [] },
  authUserEmail: { type: String, default: '' }
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
const onDelete = () => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${model.value.email} ?`)) {
    return
  }
  emit('delete')
}
</script>

<template>
  <div class="section-content">
    <div class="section-header">
      <button @click="onBack" class="btn-back">← Retour</button>
      <h1 class="section-title">
        {{ isCreating ? 'Créer un utilisateur' : 'Modifier l\'utilisateur' }}
      </h1>
    </div>

    <div class="user-detail-wrapper">
      <div class="user-editor-card">
        <div class="user-editor-section">
          <h3 class="user-editor-section-title">
            <span class="user-section-icon">ℹ️</span>
            Informations du compte
          </h3>

          <div class="user-form-group">
            <label class="user-form-label">Email *</label>
            <input
              v-if="isCreating"
              v-model="model.email"
              type="email"
              class="user-form-input"
              placeholder="email@example.com"
            />
            <input
              v-else
              :value="model.email"
              type="email"
              class="user-form-input"
              placeholder="email@example.com"
              disabled
            />
            <p v-if="!isCreating" class="user-form-hint">
              <span class="hint-icon">🔒</span>
              L'email ne peut pas être modifié
            </p>
          </div>

          <div class="user-form-group">
            <label class="user-form-label">
              Mot de passe {{ isCreating ? '*' : '' }}
            </label>
            <input
              v-model="model.password"
              type="text"
              class="user-form-input"
              :placeholder="isCreating ? 'Minimum 6 caractères' : 'Laisser vide pour ne pas modifier'"
            />
            <p class="user-form-hint">
              <span class="hint-icon">💡</span>
              {{ isCreating ? 'Minimum 6 caractères' : 'Laisser vide pour ne pas modifier' }}
            </p>
          </div>

          <div class="user-form-group">
            <label class="user-form-label">Rôle *</label>
            <select v-model="model.role" class="user-form-input">
              <option value="user">Utilisateur</option>
              <option value="prestataire">Prestataire</option>
              <option value="admin">Administrateur</option>
            </select>
            <p class="user-form-hint">
              <span class="hint-icon">👑</span>
              Les admins ont accès à toutes les fonctionnalités
            </p>
          </div>

          <div
            v-if="model.role === 'prestataire'"
            class="user-form-group"
          >
            <label class="user-form-label">Prestataire associé</label>
            <select v-model="model.prestataireNom" class="user-form-input">
              <option value="">-- Sélectionner un prestataire --</option>
              <option
                v-for="prestataire in prestataires"
                :key="prestataire.nom"
                :value="prestataire.nom"
              >
                {{ prestataire.nom }}
              </option>
            </select>
            <p class="user-form-hint">
              <span class="hint-icon">🏢</span>
              Requis pour les comptes prestataires
            </p>
          </div>
        </div>

        <div class="user-editor-footer">
          <button @click="onSave" class="user-btn-save">
            <span class="user-btn-icon">💾</span>
            {{ isCreating ? 'Créer l\'utilisateur' : 'Sauvegarder les modifications' }}
          </button>
          <button
            v-if="!isCreating && model?.email !== authUserEmail"
            @click="onDelete"
            class="user-btn-delete"
          >
            <span class="user-btn-icon">🗑️</span>
            Supprimer l'utilisateur
          </button>
        </div>

        <div v-if="!isCreating && model?.email === authUserEmail" class="warning-box">
          <span class="warning-icon">⚠️</span>
          <p>Vous ne pouvez pas supprimer votre propre compte</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-detail-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.user-editor-card {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-sm);
}

.user-editor-section {
  margin-bottom: 32px;
}

.user-editor-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-light);
}

.user-section-icon {
  font-size: 1.5rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.15));
  border-radius: 12px;
  border: 2px solid rgba(59, 130, 246, 0.35);
}

.user-form-group {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-form-label {
  display: block;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.user-form-input {
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

.user-form-input:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.user-form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.03);
}

.user-form-hint {
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

.user-editor-footer {
  display: flex;
  gap: 12px;
  padding-top: 24px;
  border-top: 2px solid var(--border-light);
}

.user-btn-save {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: all 0.3s ease;
  box-shadow: 0 6px 28px rgba(252, 220, 30, 0.4);
}

.user-btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(252, 220, 30, 0.6);
}

.user-btn-delete {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--red);
  padding: 14px 28px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.user-btn-delete:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
}

.user-btn-icon {
  font-size: 1.1rem;
}

.warning-box {
  margin-top: 24px;
  padding: 16px 20px;
  background: rgba(255, 152, 0, 0.1);
  border: 2px solid rgba(255, 152, 0, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--orange);
}

.warning-icon {
  font-size: 1.5rem;
}

.warning-box p {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
}
</style>
