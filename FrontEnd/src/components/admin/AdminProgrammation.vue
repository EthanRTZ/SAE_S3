<script setup>
const props = defineProps({
  programmation: { type: Object, default: () => ({ stages: [], schedules: [] }) }
})
const emit = defineEmits(['addSlot', 'editSlot', 'deleteSlot', 'save'])

</script>

<template>
  <section class="admin-programmation">
    <header class="section-header">
      <div>
        <h2>🎵 Programmation</h2>
        <p class="section-description">Gestion des scènes et créneaux</p>
      </div>
      <button class="btn-primary" @click="$emit('save')">💾 Sauvegarder</button>
    </header>

    <div v-for="(day, dayIndex) in programmation.schedules" :key="dayIndex" class="day">
      <h3 class="day-title">📅 Jour {{ dayIndex + 1 }}</h3>
      <div v-for="stage in programmation.stages" :key="stage.name" class="stage">
        <div class="stage-header">
          <h4 class="stage-name">{{ stage.name }}</h4>
          <button class="btn-add" @click="$emit('addSlot', dayIndex, stage.name)">➕ Ajouter un créneau</button>
        </div>
        <ul class="list">
          <li v-for="(slot, slotIndex) in (programmation.schedules[dayIndex]?.[stage.name] || [])" :key="slotIndex" class="list-item">
            <div class="slot-info">
              <strong class="slot-artist">{{ slot.artist }}</strong>
              <small class="slot-time">{{ slot.start }} - {{ slot.end }} • {{ slot.style }}</small>
            </div>
            <div class="slot-actions">
              <button class="btn-edit" @click="$emit('editSlot', dayIndex, stage.name, slotIndex)">✏️</button>
              <button class="btn-danger-small" @click="$emit('deleteSlot', dayIndex, stage.name, slotIndex)">🗑️</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-programmation {
  padding: 28px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(252, 220, 30, 0.2);
}

.section-header h2 {
  color: #FCDC1E;
  font-size: 1.8rem;
  margin: 0 0 8px 0;
  font-weight: 800;
}

.section-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  margin: 0;
}

.btn-primary {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  padding: 10px 20px;
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

.day {
  margin-bottom: 32px;
}

.day-title {
  color: #FCDC1E;
  font-size: 1.5rem;
  margin: 0 0 20px 0;
  font-weight: 700;
}

.stage {
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 16px;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(252, 220, 30, 0.15);
}

.stage-name {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.2rem;
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
  font-size: 0.85rem;
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
  gap: 10px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.list-item:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(252, 220, 30, 0.2);
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slot-artist {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  font-weight: 700;
}

.slot-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.slot-actions {
  display: flex;
  gap: 8px;
}

.btn-edit {
  background: rgba(33, 150, 243, 0.15);
  color: #2196F3;
  border: 1px solid rgba(33, 150, 243, 0.3);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.25);
  border-color: rgba(33, 150, 243, 0.5);
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
</style>
