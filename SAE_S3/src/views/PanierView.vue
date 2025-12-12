<template>
  <div class="panier-page">
    <div class="panier-container">
      <div class="panier-card">
        <h1>Mon Panier</h1>
        <div class="divider"></div>

        <div v-if="!isAuthenticatedAsUser" class="auth-warning">
          <p v-if="!authUser" class="warning-text">
            ⚠️ Vous devez être connecté avec un compte utilisateur pour finaliser votre commande.
            <router-link to="/login" class="warning-link">Connectez-vous ici</router-link>
          </p>
          <p v-else class="warning-text">
            ⚠️ Vous êtes connecté en tant que <strong>{{ authUser.role }}</strong>. Seuls les comptes utilisateurs peuvent passer commande.
          </p>
        </div>

        <div v-if="panierStore.itemCount === 0" class="empty-panier">
          <p>Votre panier est vide.</p>
          <router-link to="/reservation" class="btn-secondary">
            Retour à la billetterie
          </router-link>
        </div>

        <div v-else class="panier-content">
          <div class="panier-summary">
            <p class="summary-text">
              <strong>{{ panierStore.totalQuantity }}</strong> place(s) dans votre panier
            </p>
          </div>

          <ul class="panier-list">
            <li v-for="item in panierStore.items" :key="item.id" class="panier-item">
              <div class="item-details">
                <h3 class="item-title">{{ item.displayLabel || formatItemTitle(item) }}</h3>
                <p v-if="item.optionLabel" class="item-option">{{ item.optionLabel }}</p>
                <p class="item-quantity">Quantité : {{ item.quantity }}</p>
              </div>
              <button
                type="button"
                class="btn-remove"
                @click="removeItem(item.id)"
                aria-label="Supprimer cet article"
              >
                ✕
              </button>
            </li>
          </ul>

          <div class="panier-actions">
            <button
              type="button"
              class="btn-clear"
              @click="clearPanier"
            >
              Vider le panier
            </button>
            <button
              type="button"
              class="btn-pay"
              :disabled="!isAuthenticatedAsUser"
              @click="proceedToPayment"
            >
              Payer
            </button>
          </div>

          <div class="back-link">
            <router-link to="/reservation" class="btn-secondary">
              Continuer mes achats
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePanierStore } from '@/stores/panier'
import { useRouter } from 'vue-router'

const router = useRouter()
const panierStore = usePanierStore()
const authUser = ref(null)

const isAuthenticatedAsUser = computed(() => {
  if (!authUser.value) return false
  return authUser.value.role === 'user'
})

const loadAuthUser = () => {
  try {
    const stored = localStorage.getItem('authUser')
    authUser.value = stored ? JSON.parse(stored) : null
  } catch (e) {
    authUser.value = null
  }
}

const formatItemTitle = (item) => {
  switch (item.type) {
    case 'oneDay':
      return 'Forfait 1 jour'
    case 'twoDays':
      return 'Forfait 2 jours'
    case 'threeDays':
      return 'Forfait 3 jours'
    case 'parking':
      return 'Place de parking'
    case 'camping':
      return 'Emplacement de camping'
    default:
      return 'Article'
  }
}

const removeItem = (itemId) => {
  panierStore.removeItem(itemId)
}

const clearPanier = () => {
  if (confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
    panierStore.clearPanier()
  }
}

const proceedToPayment = () => {
  if (!isAuthenticatedAsUser.value) {
    alert('Vous devez être connecté en tant qu\'utilisateur pour payer.')
    return
  }
  router.push('/payment')
}

onMounted(() => {
  loadAuthUser()
  window.addEventListener('auth-changed', loadAuthUser)
})
</script>

<style scoped>
.panier-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background:
    radial-gradient(
      1200px 600px at 10% -10%,
      rgba(252, 220, 30, 0.08),
      transparent 60%
    ),
    radial-gradient(
      900px 500px at 110% 110%,
      rgba(32, 70, 179, 0.18),
      transparent 60%
    ),
    linear-gradient(180deg, #0b122a 0%, #07103a 100%);
  color: #fff;
}

.panier-container {
  width: 100%;
  max-width: 800px;
}

.panier-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 32px 28px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  box-shadow:
    0 12px 28px rgba(2, 6, 23, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
}

h1 {
  margin: 0 0 10px 0;
  color: #fcdc1e;
  font-size: 1.8rem;
  text-align: center;
  letter-spacing: 0.5px;
}

.divider {
  width: 60px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255,209,102,0.95), rgba(159, 120, 22, 0.9));
  margin: 10px auto 24px;
  box-shadow: 0 6px 18px rgba(255,160,60,0.12);
}

.auth-warning {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: linear-gradient(180deg, rgba(255,193,7,0.15), rgba(255,193,7,0.08));
  border: 1px solid rgba(255,193,7,0.3);
  border-radius: 12px;
}

.warning-text {
  margin: 0;
  color: #ffd166;
  font-size: 0.95rem;
  line-height: 1.6;
}

.warning-link {
  color: #FCDC1E;
  font-weight: 700;
  text-decoration: underline;
}

.empty-panier {
  text-align: center;
  padding: 40px 20px;
}

.empty-panier p {
  font-size: 1.1rem;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.85);
}

.panier-summary {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(252, 220, 30, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(252, 220, 30, 0.2);
}

.summary-text {
  margin: 0;
  color: #fcdc1e;
  font-size: 1rem;
}

.panier-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panier-item {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.item-details {
  flex: 1;
}

.item-title {
  margin: 0 0 6px 0;
  color: #fcdc1e;
  font-size: 1.1rem;
  font-weight: 600;
}

.item-option {
  margin: 0 0 4px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.item-quantity {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.btn-remove {
  background: rgba(255, 82, 82, 0.15);
  border: 1px solid rgba(255, 82, 82, 0.3);
  color: #ff5252;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: rgba(255, 82, 82, 0.25);
  border-color: #ff5252;
}

.panier-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-clear {
  flex: 1;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-clear:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-pay {
  flex: 2;
  background: linear-gradient(135deg, #fcdc1e 0%, #ffe676 100%);
  color: #0a0a0a;
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 800;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(252, 220, 30, 0.28);
  transition: all 0.12s ease;
}

.btn-pay:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(252, 220, 30, 0.35);
}

.btn-pay:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-link {
  text-align: center;
}

.btn-secondary {
  color: #fff;
  text-decoration: none;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-weight: 700;
  transition: all 0.12s ease;
  display: inline-block;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.24);
}

@media (max-width: 600px) {
  .panier-actions {
    flex-direction: column;
  }

  .panier-item {
    flex-direction: column;
  }
}
</style>
