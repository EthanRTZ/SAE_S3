<script setup>
const props = defineProps({
  prestataires: { type: Array, default: () => [] }
})
const emit = defineEmits(['select', 'create'])

const onSelect = (item) => emit('select', item)
const onCreate = () => emit('create')
</script>

<template>
  <section class="admin-prestataires">
    <header class="section-header">
      <div>
        <h2>🏪 Prestataires</h2>
        <p class="section-description">{{ prestataires.length }} prestataire(s)</p>
      </div>
      <button class="btn-primary" @click="onCreate">➕ Ajouter</button>
    </header>
    <ul class="grid">
      <li v-for="p in prestataires" :key="p.nom" class="card" @click="onSelect(p)">
        <strong class="card-title">{{ p.nom }}</strong>
        <small class="card-desc">{{ p.description }}</small>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.admin-prestataires {
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
  margin-bottom: 24px;
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.card {
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card:hover {
  background: rgba(252, 220, 30, 0.08);
  border-color: rgba(252, 220, 30, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(252, 220, 30, 0.15);
}

.card-title {
  display: block;
  color: #FCDC1E;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.card-desc {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
