<template>
  <div class="test-backend">
    <h1>Test de connexion Backend ↔ Frontend</h1>

    <div class="test-section">
      <h2>État du Backend</h2>
      <button @click="testHealth" :disabled="loading">
        {{ loading ? 'Test en cours...' : 'Tester la connexion' }}
      </button>

      <div v-if="healthResult" class="result" :class="healthResult.success ? 'success' : 'error'">
        <h3>{{ healthResult.success ? '✅ Connexion réussie' : '❌ Échec de connexion' }}</h3>
        <pre>{{ JSON.stringify(healthResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h2>Test des Endpoints</h2>

      <div class="endpoint-tests">
        <button @click="testArtistes" :disabled="loading">
          Tester /api/artistes
        </button>
        <button @click="testPrestataires" :disabled="loading">
          Tester /api/prestataires
        </button>
        <button @click="testServices" :disabled="loading">
          Tester /api/services
        </button>
      </div>

      <div v-if="apiResult" class="result" :class="apiResult.success ? 'success' : 'error'">
        <h3>{{ apiResult.endpoint }}</h3>
        <p v-if="apiResult.success">
          ✅ {{ apiResult.data.length }} résultat(s) reçu(s)
        </p>
        <p v-else>
          ❌ Erreur: {{ apiResult.error }}
        </p>
        <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="instructions">
      <h2>📋 Instructions</h2>
      <ol>
        <li>Assurez-vous que le backend est démarré : <code>cd BackEnd && npm start</code></li>
        <li>Le backend doit tourner sur <code>http://localhost:3000</code></li>
        <li>Vérifiez que PostgreSQL est lancé et accessible</li>
        <li>Cliquez sur "Tester la connexion" pour vérifier</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '@/services/api';

const loading = ref(false);
const healthResult = ref(null);
const apiResult = ref(null);

async function testHealth() {
  loading.value = true;
  healthResult.value = null;
  apiResult.value = null;

  try {
    const result = await api.testBackendConnection();
    healthResult.value = result;
  } catch (error) {
    healthResult.value = {
      success: false,
      error: error.message
    };
  } finally {
    loading.value = false;
  }
}

async function testArtistes() {
  loading.value = true;
  apiResult.value = null;

  try {
    const result = await api.getAllArtistes();
    apiResult.value = { ...result, endpoint: 'GET /api/artistes' };
  } catch (error) {
    apiResult.value = {
      success: false,
      error: error.message,
      endpoint: 'GET /api/artistes'
    };
  } finally {
    loading.value = false;
  }
}

async function testPrestataires() {
  loading.value = true;
  apiResult.value = null;

  try {
    const result = await api.getAllPrestataires();
    apiResult.value = { ...result, endpoint: 'GET /api/prestataires' };
  } catch (error) {
    apiResult.value = {
      success: false,
      error: error.message,
      endpoint: 'GET /api/prestataires'
    };
  } finally {
    loading.value = false;
  }
}

async function testServices() {
  loading.value = true;
  apiResult.value = null;

  try {
    const result = await api.getAllServices();
    apiResult.value = { ...result, endpoint: 'GET /api/services' };
  } catch (error) {
    apiResult.value = {
      success: false,
      error: error.message,
      endpoint: 'GET /api/services'
    };
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.test-backend {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
}

.test-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

h2 {
  color: #34495e;
  margin-top: 0;
}

button {
  background: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
  margin-bottom: 10px;
}

button:hover:not(:disabled) {
  background: #369970;
}

button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.endpoint-tests {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 5px;
  border: 2px solid;
}

.result.success {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.result.error {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.result h3 {
  margin-top: 0;
}

.result pre {
  background: white;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.instructions {
  background: #e7f3ff;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #0066cc;
}

.instructions h2 {
  margin-top: 0;
}

.instructions code {
  background: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #e83e8c;
}

.instructions ol {
  line-height: 1.8;
}
</style>

