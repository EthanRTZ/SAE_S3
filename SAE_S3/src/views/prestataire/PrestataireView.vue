<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authUser = ref(null)
const prestataireInfo = ref(null)
const loading = ref(true)

const loadAuthFromStorage = () => {
  try {
    const raw = localStorage.getItem('authUser')
    authUser.value = raw ? JSON.parse(raw) : null
  } catch (e) {
    authUser.value = null
  }
}

const isPrestataire = computed(() => authUser.value?.role === 'prestataire')
const prestataireNom = computed(() => authUser.value?.prestataireNom || '')

const loadPrestataireInfo = async () => {
  if (!isPrestataire.value || !prestataireNom.value) {
    prestataireInfo.value = null
    loading.value = false
    return
  }

  try {
    const customRaw = localStorage.getItem('customPrestataires')
    let customPrestataires = null
    if (customRaw) {
      try {
        customPrestataires = JSON.parse(customRaw)
      } catch (e) {
        // ignore
      }
    }

    const resp = await fetch('/data/prestataires.json', { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    const prestataires = data.prestataires || []

    let prestataire = prestataires.find(p => p.nom === prestataireNom.value) || null

    if (prestataire && customPrestataires && customPrestataires[prestataireNom.value]) {
      prestataire = { ...prestataire, ...customPrestataires[prestataireNom.value] }
    }

    prestataireInfo.value = prestataire
  } catch (e) {
    prestataireInfo.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAuthFromStorage()

  if (!isPrestataire.value) {
    router.push('/login')
    return
  }

  loadPrestataireInfo()
})
</script>

<template>
  <div class="prestataire-page">
    <div v-if="loading" class="loading">
      Chargement...
    </div>

    <div v-else-if="!isPrestataire" class="access-denied">
      <h2>Accès restreint</h2>
      <p>Vous devez être connecté en tant que prestataire pour accéder à cette page.</p>
      <router-link to="/login" class="btn-primary">Se connecter</router-link>
    </div>

    <div v-else-if="prestataireInfo" class="prestataire-content">
      <div class="prestataire-header">
        <h1>Espace Prestataire</h1>
        <p class="welcome">Bienvenue, {{ prestataireNom }}</p>
      </div>

      <div class="prestataire-info-card">
        <h2>Vos informations</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Nom :</span>
            <span class="value">{{ prestataireInfo.nom }}</span>
          </div>
          <div class="info-item">
            <span class="label">Type :</span>
            <span class="value">{{ prestataireInfo.type }}</span>
          </div>
          <div class="info-item">
            <span class="label">Emplacement :</span>
            <span class="value">{{ prestataireInfo.emplacement }}</span>
          </div>
        </div>
      </div>

      <div class="actions-section">
        <h2>Actions</h2>
        <div class="actions-grid">
          <button class="action-card">
            <h3>Gérer les offres</h3>
            <p>Ajouter ou modifier vos offres</p>
          </button>
          <button class="action-card">
            <h3>Statistiques</h3>
            <p>Voir vos performances</p>
          </button>
          <router-link to="/profile" class="action-card">
            <h3>Mon profil</h3>
            <p>Modifier vos informations</p>
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="no-info">
      <h2>Informations indisponibles</h2>
      <p>Impossible de charger vos informations de prestataire.</p>
    </div>
  </div>
</template>

<style scoped>
.prestataire-page {
  min-height: calc(100vh - 64px);
  padding: 40px 20px;
  background: linear-gradient(180deg, #0b122a 0%, #07103a 100%);
  color: #fff;
}

.loading,
.access-denied,
.no-info {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 40px 20px;
}

.access-denied h2,
.no-info h2 {
  color: #FCDC1E;
  margin-bottom: 16px;
}

.btn-primary {
  display: inline-block;
  margin-top: 20px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  transition: transform 0.12s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.prestataire-content {
  max-width: 1200px;
  margin: 0 auto;
}

.prestataire-header {
  text-align: center;
  margin-bottom: 40px;
}

.prestataire-header h1 {
  color: #FCDC1E;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.welcome {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
}

.prestataire-info-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 30px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  margin-bottom: 40px;
}

.prestataire-info-card h2 {
  color: #FCDC1E;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.value {
  font-weight: 700;
  color: #fff;
}

.actions-section h2 {
  color: #FCDC1E;
  margin-bottom: 20px;
  text-align: center;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 30px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
  display: block;
}

.action-card:hover {
  background: rgba(252, 220, 30, 0.1);
  border-color: rgba(252, 220, 30, 0.3);
  transform: translateY(-4px);
}

.action-card h3 {
  color: #FCDC1E;
  margin-bottom: 10px;
}

.action-card p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .prestataire-header h1 {
    font-size: 2rem;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
