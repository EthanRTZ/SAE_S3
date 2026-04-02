<template>
  <div v-if="!isKnownType" class="services-type-page services-type-invalid">
    <div class="error-container">
      <h2>{{ $t('servicesByType.errorTitle') }}</h2>
      <p>{{ $t('servicesByType.loadError') }}</p>
      <router-link to="/" class="btn-back">{{ $t('servicesByType.backHome') }}</router-link>
    </div>
  </div>
  <ServicesByTypeSection v-else :type="serviceType" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ServicesByTypeSection from '@/components/services/ServicesByTypeSection.vue'

const route = useRoute()

const VALID_TYPES = ['reservation', 'commande', 'location']
const serviceType = computed(() => String(route.params.type || ''))
const isKnownType = computed(() => VALID_TYPES.includes(serviceType.value))
</script>

<style scoped>
.services-type-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 40px 20px;
  color: #fff;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
}

.btn-back {
  background: #fcdc1e;
  color: #000;
  padding: 10px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}
</style>
