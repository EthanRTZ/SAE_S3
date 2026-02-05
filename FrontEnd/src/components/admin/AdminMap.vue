<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps({
  prestataires: { type: Array, default: () => [] }
})
// Expose a container for Leaflet map; parent can init via composable
const mapRef = ref(null)
const emit = defineEmits(['ready'])

onMounted(() => emit('ready', mapRef))
</script>

<template>
  <section class="admin-map">
    <div class="map-header">
      <h2>🗺️ Carte Interactive</h2>
      <p class="map-description">Gestion des emplacements prestataires</p>
    </div>
    <div ref="mapRef" class="map-container"></div>
  </section>
</template>

<style scoped>
.admin-map {
  padding: 28px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.map-header {
  margin-bottom: 20px;
}

.map-header h2 {
  color: #FCDC1E;
  font-size: 1.8rem;
  margin: 0 0 8px 0;
  font-weight: 800;
}

.map-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  margin: 0;
}

.map-container {
  width: 100%;
  height: 520px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(252, 220, 30, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
