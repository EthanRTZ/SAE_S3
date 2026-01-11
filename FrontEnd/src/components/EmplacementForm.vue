<template>
  <div class="emplacement-form">
    <h3 class="form-title">{{ isEdit ? $t('carte.editLocation') : $t('carte.addLocationInfo') }}</h3>
    <form @submit.prevent="handleSubmit" class="form-content">
      <div class="form-group">
        <label for="nom_emplacement">{{ $t('carte.locationName') }}</label>
        <input
          id="nom_emplacement"
          v-model="formData.nom_emplacement"
          type="text"
          :placeholder="$t('carte.locationNamePlaceholder')"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="moyens_logistiques">{{ $t('carte.logistics') }}</label>
        <textarea
          id="moyens_logistiques"
          v-model="formData.moyens_logistiques"
          :placeholder="$t('carte.logisticsPlaceholder')"
          rows="3"
          class="form-textarea"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="surface_volume">{{ $t('carte.surfaceVolume') }}</label>
        <input
          id="surface_volume"
          v-model="formData.surface_volume"
          type="text"
          :placeholder="$t('carte.surfaceVolumePlaceholder')"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="nombre_prises">{{ $t('carte.numberOfOutlets') }}</label>
        <input
          id="nombre_prises"
          v-model.number="formData.nombre_prises"
          type="number"
          min="0"
          class="form-input"
        />
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="formData.acces_eau"
            class="form-checkbox"
          />
          <span>{{ $t('carte.waterAccess') }}</span>
        </label>
      </div>

      <div class="form-group">
        <label for="description">{{ $t('carte.description') }}</label>
        <textarea
          id="description"
          v-model="formData.description"
          :placeholder="$t('carte.descriptionPlaceholder')"
          rows="4"
          class="form-textarea"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-save">{{ $t('carte.save') }}</button>
        <button type="button" @click="handleCancel" class="btn-cancel">{{ $t('carte.cancel') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  emplacement: {
    type: Object,
    required: true
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel'])

const formData = ref({
  nom_emplacement: '',
  moyens_logistiques: '',
  surface_volume: '',
  nombre_prises: null,
  acces_eau: false,
  description: ''
})

// Initialiser le formulaire avec les données de l'emplacement
watch(() => props.emplacement, (newEmplacement) => {
  if (newEmplacement) {
    formData.value = {
      nom_emplacement: newEmplacement.nom_emplacement || '',
      moyens_logistiques: newEmplacement.moyens_logistiques || '',
      surface_volume: newEmplacement.surface_volume || '',
      nombre_prises: newEmplacement.nombre_prises || null,
      acces_eau: newEmplacement.acces_eau || false,
      description: newEmplacement.description || ''
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  const dataToSave = {
    ...props.emplacement,
    ...formData.value,
    // Convertir les chaînes vides en null pour cohérence
    nom_emplacement: formData.value.nom_emplacement || null,
    moyens_logistiques: formData.value.moyens_logistiques || null,
    surface_volume: formData.value.surface_volume || null,
    nombre_prises: formData.value.nombre_prises || null,
    description: formData.value.description || null
  }
  emit('save', dataToSave)
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.emplacement-form {
  padding: 16px;
  min-width: 300px;
  max-width: 400px;
  background: #fff;
  border-radius: 8px;
}

.form-title {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2046b3;
  text-align: center;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.form-input,
.form-textarea {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2046b3;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  box-shadow: 0 2px 6px rgba(252, 220, 30, 0.3);
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(252, 220, 30, 0.4);
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-cancel:hover {
  background: #e8e8e8;
}
</style>
