<template>
  <div class="payment-page">
    <div class="payment-container">
      <div class="payment-card">
        <h1>Paiement</h1>
        <div class="divider"></div>

        <div v-if="!authUser || authUser.role !== 'user'" class="auth-warning">
          <p class="warning-text">
            ⚠️ Vous devez être connecté en tant qu'utilisateur pour effectuer un paiement.
            <router-link to="/login" class="warning-link">Connectez-vous ici</router-link>
          </p>
        </div>

        <div v-else-if="panierStore.itemCount === 0" class="empty-warning">
          <p>Votre panier est vide. Impossible de procéder au paiement.</p>
          <router-link to="/reservation" class="btn-secondary">
            Retour à la billetterie
          </router-link>
        </div>

        <form v-else @submit.prevent="onSubmit" class="payment-form">
          <!-- Récapitulatif de la commande -->
          <div class="order-summary">
            <h2 class="section-title">Récapitulatif de votre commande</h2>
            <ul class="summary-list">
              <li v-for="item in panierStore.items" :key="item.id" class="summary-item">
                <span class="item-name">{{ item.displayLabel || formatItemTitle(item) }}</span>
                <span class="item-qty">× {{ item.quantity }}</span>
              </li>
            </ul>
            <div class="total-items">
              <strong>Total :</strong> {{ panierStore.totalQuantity }} place(s)
            </div>
          </div>

          <!-- Informations personnelles -->
          <div class="form-section">
            <h2 class="section-title">Informations personnelles</h2>

            <div class="input-group">
              <label for="email">Email *</label>
              <input
                id="email"
                type="email"
                v-model="formData.email"
                required
                readonly
                class="readonly-input"
              />
            </div>

            <div class="input-row">
              <div class="input-group">
                <label for="firstName">Prénom *</label>
                <input
                  id="firstName"
                  type="text"
                  v-model="formData.firstName"
                  required
                  minlength="2"
                />
              </div>

              <div class="input-group">
                <label for="lastName">Nom *</label>
                <input
                  id="lastName"
                  type="text"
                  v-model="formData.lastName"
                  required
                  minlength="2"
                />
              </div>
            </div>

            <div class="input-group">
              <label for="phone">Téléphone *</label>
              <input
                id="phone"
                type="tel"
                v-model="formData.phone"
                required
                pattern="[0-9]{10}"
                placeholder="0612345678"
                maxlength="10"
              />
              <p class="input-hint">Format: 10 chiffres sans espaces</p>
            </div>

            <div class="input-group">
              <label for="address">Adresse *</label>
              <input
                id="address"
                type="text"
                v-model="formData.address"
                required
                minlength="5"
                placeholder="123 Rue de la République"
              />
            </div>

            <div class="input-row">
              <div class="input-group">
                <label for="postalCode">Code postal *</label>
                <input
                  id="postalCode"
                  type="text"
                  v-model="formData.postalCode"
                  required
                  pattern="[0-9]{5}"
                  placeholder="75001"
                  maxlength="5"
                />
              </div>

              <div class="input-group">
                <label for="city">Ville *</label>
                <input
                  id="city"
                  type="text"
                  v-model="formData.city"
                  required
                  minlength="2"
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>

          <!-- Moyen de paiement -->
          <div class="form-section">
            <h2 class="section-title">Moyen de paiement</h2>

            <div class="payment-methods">
              <label class="payment-method" :class="{ active: paymentMethod === 'card' }">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  v-model="paymentMethod"
                />
                <div class="method-content">
                  <span class="method-name">Carte bancaire</span>
                </div>
              </label>

              <label class="payment-method" :class="{ active: paymentMethod === 'paypal' }">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  v-model="paymentMethod"
                />
                <div class="method-content">
                  <span class="method-name">PayPal</span>
                </div>
              </label>
            </div>

            <!-- Formulaire carte bancaire -->
            <div v-if="paymentMethod === 'card'" class="card-form">
              <div class="input-group">
                <label for="cardNumber">Numéro de carte *</label>
                <input
                  id="cardNumber"
                  type="text"
                  v-model="cardData.number"
                  required
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  @input="formatCardNumber"
                />
                <p v-if="cardError" class="input-error">{{ cardError }}</p>
                <div v-if="cardType" class="card-type">
                  Type de carte: <strong>{{ cardType }}</strong>
                </div>
              </div>

              <div class="input-group">
                <label for="cardName">Nom sur la carte *</label>
                <input
                  id="cardName"
                  type="text"
                  v-model="cardData.name"
                  required
                  minlength="3"
                  placeholder="JEAN DUPONT"
                  style="text-transform: uppercase"
                />
              </div>

              <div class="input-row">
                <div class="input-group">
                  <label for="cardExpiry">Date d'expiration *</label>
                  <input
                    id="cardExpiry"
                    type="text"
                    v-model="cardData.expiry"
                    required
                    placeholder="MM/AA"
                    maxlength="5"
                    @input="formatExpiry"
                  />
                  <p v-if="expiryError" class="input-error">{{ expiryError }}</p>
                </div>

                <div class="input-group">
                  <label for="cardCvv">CVV *</label>
                  <input
                    id="cardCvv"
                    type="text"
                    v-model="cardData.cvv"
                    required
                    placeholder="123"
                    maxlength="4"
                    @input="formatCvv"
                  />
                  <p class="input-hint">3 ou 4 chiffres au dos</p>
                </div>
              </div>
            </div>

            <!-- Formulaire PayPal -->
            <div v-else-if="paymentMethod === 'paypal'" class="paypal-info">
              <p class="info-text">
                Vous serez redirigé vers PayPal pour finaliser votre paiement en toute sécurité.
              </p>
            </div>
          </div>

          <p v-if="error" class="form-error">{{ error }}</p>

          <div class="form-actions">
            <router-link to="/panier" class="btn-back">
              ← Retour au panier
            </router-link>
            <button
              type="submit"
              class="btn-pay"
              :disabled="processing"
            >
              {{ processing ? 'Traitement...' : 'Payer maintenant' }}
            </button>
          </div>

          <p class="security-notice">
            🔒 Paiement sécurisé - Vos données sont cryptées
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePanierStore } from '@/stores/panier'

const router = useRouter()
const panierStore = usePanierStore()
const authUser = ref(null)
const processing = ref(false)
const error = ref('')
const paymentMethod = ref('card')

const formData = ref({
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  postalCode: '',
  city: ''
})

const cardData = ref({
  number: '',
  name: '',
  expiry: '',
  cvv: ''
})

const cardError = ref('')
const expiryError = ref('')

const loadAuthUser = () => {
  try {
    const stored = localStorage.getItem('authUser')
    authUser.value = stored ? JSON.parse(stored) : null
    if (authUser.value) {
      formData.value.email = authUser.value.email
    }
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

// Algorithme de Luhn pour valider le numéro de carte
const luhnCheck = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, '')
  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// Détection du type de carte
const detectCardType = (number) => {
  const cleaned = number.replace(/\D/g, '')

  if (/^4/.test(cleaned)) return 'Visa'
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard'
  if (/^3[47]/.test(cleaned)) return 'American Express'
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover'

  return null
}

const cardType = computed(() => {
  if (cardData.value.number.length > 0) {
    return detectCardType(cardData.value.number)
  }
  return null
})

const formatCardNumber = (e) => {
  let value = e.target.value.replace(/\D/g, '')
  let formatted = ''

  for (let i = 0; i < value.length && i < 16; i++) {
    if (i > 0 && i % 4 === 0) {
      formatted += ' '
    }
    formatted += value[i]
  }

  cardData.value.number = formatted
  cardError.value = ''
}

const formatExpiry = (e) => {
  let value = e.target.value.replace(/\D/g, '')

  if (value.length >= 2) {
    value = value.slice(0, 2) + '/' + value.slice(2, 4)
  }

  cardData.value.expiry = value
  expiryError.value = ''
}

const formatCvv = (e) => {
  cardData.value.cvv = e.target.value.replace(/\D/g, '')
}

const validateCard = () => {
  const cleaned = cardData.value.number.replace(/\D/g, '')

  if (cleaned.length < 13 || cleaned.length > 19) {
    cardError.value = 'Le numéro de carte doit contenir entre 13 et 19 chiffres'
    return false
  }

  if (!luhnCheck(cardData.value.number)) {
    cardError.value = 'Numéro de carte invalide'
    return false
  }

  cardError.value = ''
  return true
}

const validateExpiry = () => {
  const parts = cardData.value.expiry.split('/')
  if (parts.length !== 2) {
    expiryError.value = 'Format invalide (MM/AA)'
    return false
  }

  const month = parseInt(parts[0])
  const year = parseInt('20' + parts[1])

  if (month < 1 || month > 12) {
    expiryError.value = 'Mois invalide (01-12)'
    return false
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    expiryError.value = 'Carte expirée'
    return false
  }

  if (year > currentYear + 10) {
    expiryError.value = 'Date d\'expiration invalide'
    return false
  }

  expiryError.value = ''
  return true
}

const onSubmit = async () => {
  error.value = ''

  // Validation des informations personnelles
  if (!formData.value.firstName || !formData.value.lastName) {
    error.value = 'Veuillez renseigner votre nom complet'
    return
  }

  if (!/^[0-9]{10}$/.test(formData.value.phone)) {
    error.value = 'Le numéro de téléphone doit contenir 10 chiffres'
    return
  }

  if (!/^[0-9]{5}$/.test(formData.value.postalCode)) {
    error.value = 'Le code postal doit contenir 5 chiffres'
    return
  }

  // Validation du paiement
  if (paymentMethod.value === 'card') {
    if (!validateCard()) return
    if (!validateExpiry()) return

    if (!cardData.value.name || cardData.value.name.length < 3) {
      error.value = 'Veuillez renseigner le nom sur la carte'
      return
    }

    if (!/^[0-9]{3,4}$/.test(cardData.value.cvv)) {
      error.value = 'Le CVV doit contenir 3 ou 4 chiffres'
      return
    }
  }

  processing.value = true

  // Simulation du traitement du paiement
  setTimeout(() => {
    try {
      const now = new Date()

      // Enregistrer la commande dans localStorage
      const order = {
        id: `ORDER-${Date.now()}`,
        userEmail: authUser.value.email,
        items: panierStore.items,
        totalQuantity: panierStore.totalQuantity,
        personalInfo: formData.value,
        paymentMethod: paymentMethod.value,
        status: 'confirmed',
        createdAt: now.toISOString()
      }

      // Sauvegarder l'historique des commandes
      const orders = JSON.parse(localStorage.getItem('userOrders') || '[]')
      orders.push(order)
      localStorage.setItem('userOrders', JSON.stringify(orders))

      // Ajouter chaque article du panier dans "Mes réservations"
      const existingReservations = JSON.parse(localStorage.getItem('userReservations') || '[]')

      panierStore.items.forEach(item => {
        const reservationId = `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`
        const reservation = {
          id: reservationId,
          userEmail: authUser.value.email,
          type: item.type,
          quantity: item.quantity,
          displayLabel: item.displayLabel || formatItemTitle(item),
          optionLabel: item.optionLabel || '',
          createdAt: now.toISOString(),
          orderId: order.id, // Lien avec la commande
          personalInfo: {
            firstName: formData.value.firstName,
            lastName: formData.value.lastName,
            phone: formData.value.phone
          }
        }
        existingReservations.push(reservation)
      })

      // Sauvegarder les réservations mises à jour
      localStorage.setItem('userReservations', JSON.stringify(existingReservations))

      // Vider le panier
      panierStore.clearPanier()

      // Rediriger vers la page des réservations
      alert('✅ Paiement effectué avec succès ! Vos billets ont été ajoutés à vos réservations.')
      router.push('/mes-reservations')
    } catch (e) {
      error.value = 'Une erreur est survenue lors du traitement du paiement'
    } finally {
      processing.value = false
    }
  }, 2000)
}

onMounted(() => {
  loadAuthUser()
  if (!authUser.value || authUser.value.role !== 'user') {
    router.push('/login')
  }
  if (panierStore.itemCount === 0) {
    router.push('/panier')
  }
})
</script>

<style scoped>
.payment-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 28px;
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

.payment-container {
  width: 100%;
  max-width: 800px;
}

.payment-card {
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

.auth-warning,
.empty-warning {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: linear-gradient(180deg, rgba(255,193,7,0.15), rgba(255,193,7,0.08));
  border: 1px solid rgba(255,193,7,0.3);
  border-radius: 12px;
  text-align: center;
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

.payment-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.order-summary {
  background: rgba(252, 220, 30, 0.08);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(252, 220, 30, 0.2);
}

.section-title {
  margin: 0 0 16px 0;
  color: #fcdc1e;
  font-size: 1.2rem;
  font-weight: 700;
}

.summary-list {
  list-style: none;
  padding: 0;
  margin: 0 0 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.item-name {
  flex: 1;
}

.item-qty {
  color: #fcdc1e;
  font-weight: 600;
}

.total-items {
  padding-top: 12px;
  border-top: 1px solid rgba(252, 220, 30, 0.3);
  color: #fcdc1e;
  font-size: 1.05rem;
}

.form-section {
  background: rgba(255, 255, 255, 0.03);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.input-group {
  margin-bottom: 16px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.input-group input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.95rem;
  transition: all 0.12s ease;
}

.input-group input:focus {
  outline: none;
  border-color: #fcdc1e;
  box-shadow: 0 0 0 3px rgba(252, 220, 30, 0.15);
}

.readonly-input {
  background: rgba(255, 255, 255, 0.03) !important;
  cursor: not-allowed;
  opacity: 0.7;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.input-hint {
  margin: 4px 0 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.input-error {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: #ff8a80;
}

.payment-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.payment-method {
  display: flex;
  padding: 16px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.12s ease;
}

.payment-method input[type="radio"] {
  display: none;
}

.payment-method.active {
  border-color: #fcdc1e;
  background: rgba(252, 220, 30, 0.1);
}

.method-content {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.method-icon {
  font-size: 1.5rem;
}

.method-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.card-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-type {
  margin-top: 4px;
  font-size: 0.85rem;
  color: #fcdc1e;
}

.paypal-info {
  padding: 20px;
  background: rgba(0, 112, 217, 0.1);
  border: 1px solid rgba(0, 112, 217, 0.3);
  border-radius: 10px;
}

.info-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  text-align: center;
}

.form-error {
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(255,155,155,0.16), rgba(255,155,155,0.10));
  border: 1px solid rgba(255,120,120,0.35);
  border-radius: 10px;
  color: #ff8a80;
  font-size: 0.9rem;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-back {
  flex: 1;
  padding: 12px 18px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  transition: all 0.12s ease;
}

.btn-back:hover {
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
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.security-notice {
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.btn-secondary {
  display: inline-block;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.12s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.24);
}

@media (max-width: 600px) {
  .input-row {
    grid-template-columns: 1fr;
  }

  .payment-methods {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-back,
  .btn-pay {
    width: 100%;
  }
}
</style>
