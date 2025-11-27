<template>
  <div class="reservation">
    <div class="hero">
      <div class="container">
        <section class="resa-card" aria-label="Réserver un forfait">
          <h1>Réserver un forfait</h1>
          <div class="divider" aria-hidden="true"></div>

          <!-- Message d'information pour les utilisateurs non connectés ou avec mauvais rôle -->
          <div v-if="!isAuthenticatedAsUser" class="auth-warning">
            <p v-if="!authUser" class="warning-text">
              ⚠️ Vous devez être connecté avec un compte utilisateur pour réserver des billets.
              <router-link to="/login" class="warning-link">Connectez-vous ici</router-link>
            </p>
            <p v-else class="warning-text">
              ⚠️ Vous êtes connecté en tant que <strong>{{ authUser.role }}</strong>. Seuls les comptes utilisateurs peuvent réserver des billets.
            </p>
          </div>

          <div class="forfaits">
            <div class="forfait">
              <p class="stock">Places restantes: {{ forfaits.oneDay.stock }}</p>
              <label class="select-label" for="oneDaySelect">Choisis ton jour</label>
              <select
                id="oneDaySelect"
                class="day-select"
                v-model="selections.oneDay"
                @change="handleSelectionChange('oneDay')"
              >
                <option disabled value="">Sélectionne un jour</option>
                <option
                  v-for="day in getDayOptions('oneDay')"
                  :key="day.label"
                  :value="day.label"
                  :disabled="day.stock === 0"
                >
                  {{ formatOptionLabel(day) }}
                </option>
              </select>
              <p v-if="dayErrors.oneDay" class="day-error">{{ dayErrors.oneDay }}</p>
              <div class="quantity-field">
                <label class="select-label" for="qty-oneDay">Nombre de places</label>
                <input
                  id="qty-oneDay"
                  class="quantity-input"
                  type="number"
                  min="1"
                  :max="Math.max(1, getMaxQuantity('oneDay'))"
                  v-model.number="quantities.oneDay"
                  @input="handleQuantityChange('oneDay')"
                />
                <p class="quantity-hint">Disponible : {{ getMaxQuantity('oneDay') }}</p>
              </div>
              <button
                class="cta"
                :disabled="!canReserveWithoutAuth('oneDay')"
                @click="reserve('oneDay')"
              >
                Réserver 1 jour
              </button>
              <div class="option-stocks">
                <p class="option-stocks-title">Places restantes</p>
                <ul>
                  <li
                    v-for="day in getDayOptions('oneDay')"
                    :key="`${day.label}-count`"
                    :class="{ 'out-of-stock': day.stock === 0 }"
                  >
                    {{ day.label }} : <strong>{{ day.stock }}</strong>
                  </li>
                </ul>
              </div>
            </div>

            <div class="forfait">
              <p class="stock">Places restantes: {{ forfaits.twoDays.stock }}</p>
              <label class="select-label" for="twoDaySelect">Choisis tes jours</label>
              <select
                id="twoDaySelect"
                class="day-select"
                v-model="selections.twoDays"
                @change="handleSelectionChange('twoDays')"
              >
                <option disabled value="">Sélectionne une combinaison</option>
                <option
                  v-for="day in getDayOptions('twoDays')"
                  :key="day.label"
                  :value="day.label"
                  :disabled="day.stock === 0"
                >
                  {{ formatOptionLabel(day) }}
                </option>
              </select>
              <p v-if="dayErrors.twoDays" class="day-error">{{ dayErrors.twoDays }}</p>
              <div class="quantity-field">
                <label class="select-label" for="qty-twoDays">Nombre de places</label>
                <input
                  id="qty-twoDays"
                  class="quantity-input"
                  type="number"
                  min="1"
                  :max="Math.max(1, getMaxQuantity('twoDays'))"
                  v-model.number="quantities.twoDays"
                  @input="handleQuantityChange('twoDays')"
                />
                <p class="quantity-hint">Disponible : {{ getMaxQuantity('twoDays') }}</p>
              </div>
              <button
                class="cta"
                :disabled="!canReserveWithoutAuth('twoDays')"
                @click="reserve('twoDays')"
              >
                Réserver 2 jours
              </button>
              <div class="option-stocks">
                <p class="option-stocks-title">Places restantes</p>
                <ul>
                  <li
                    v-for="day in getDayOptions('twoDays')"
                    :key="`${day.label}-count`"
                    :class="{ 'out-of-stock': day.stock === 0 }"
                  >
                    {{ day.label }} : <strong>{{ day.stock }}</strong>
                  </li>
                </ul>
              </div>
            </div>

            <div class="forfait">
              <p class="stock">Places restantes: {{ forfaits.threeDays.stock }}</p>
              <div class="quantity-field">
                <label class="select-label" for="qty-threeDays">Nombre de places</label>
                <input
                  id="qty-threeDays"
                  class="quantity-input"
                  type="number"
                  min="1"
                  :max="Math.max(1, getMaxQuantity('threeDays'))"
                  v-model.number="quantities.threeDays"
                  @input="handleQuantityChange('threeDays')"
                />
                <p class="quantity-hint">Disponible : {{ getMaxQuantity('threeDays') }}</p>
              </div>
              <p v-if="dayErrors.threeDays" class="day-error">{{ dayErrors.threeDays }}</p>
              <button 
                class="cta" 
                :disabled="!canReserveWithoutAuth('threeDays')" 
                @click="reserve('threeDays')"
              >
                Réserver 3 jours
              </button>
            </div>
          </div>

        </section>
      </div>
    </div>
  </div>
  
  <div v-if="showAuthModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
    <div class="modal-card">
      <h2 id="auth-modal-title" class="modal-title">Connexion requise</h2>
      <p>
        {{ authMessage }}
      </p>
      <div class="modal-actions">
        <router-link to="/login" class="btn-login-link" @click="closeAuthModal">Aller à la connexion</router-link>
        <button class="btn-close" @click="closeAuthModal">Fermer</button>
      </div>
    </div>
  </div>
  
</template>

<script>
import forfaitsData from '@/data/forfaits.json'

export default {
  name: 'ReservationView',
  data() {
    const forfaits = JSON.parse(JSON.stringify(forfaitsData))
    Object.keys(forfaits).forEach((key) => {
      if (Array.isArray(forfaits[key].days)) {
        forfaits[key].stock = forfaits[key].days.reduce((sum, day) => sum + day.stock, 0)
      }
    })
    return {
      forfaits,
      selections: {
        oneDay: '',
        twoDays: ''
      },
      quantities: {
        oneDay: 1,
        twoDays: 1,
        threeDays: 1
      },
      dayErrors: {
        oneDay: '',
        twoDays: '',
        threeDays: ''
      },
      showAuthModal: false,
      authUser: null
    }
  },
  computed: {
    isAuthenticatedAsUser() {
      if (!this.authUser) return false
      return this.authUser.role === 'user'
    },
    authMessage() {
      if (!this.authUser) {
        return 'Vous devez être connecté avec un compte utilisateur pour réserver un forfait. Veuillez vous connecter pour poursuivre votre réservation.'
      }
      if (this.authUser.role !== 'user') {
        return `Vous êtes connecté en tant que ${this.authUser.role}. Seuls les comptes utilisateurs peuvent réserver des billets.`
      }
      return 'Vous devez être connecté pour réserver un forfait.'
    }
  },
  methods: {
    loadAuthUser() {
      try {
        const stored = localStorage.getItem('authUser')
        this.authUser = stored ? JSON.parse(stored) : null
      } catch (e) {
        this.authUser = null
      }
    },
    handleStorageChange() {
      this.loadAuthUser()
    },
    requiresDaySelection(type) {
      return type === 'oneDay' || type === 'twoDays'
    },
    getDayOptions(type) {
      return this.forfaits[type]?.days ?? []
    },
    getSelectedOption(type) {
      return this.getDayOptions(type).find((option) => option.label === this.selections[type])
    },
    findOneDayOption(label) {
      return this.getDayOptions('oneDay').find((option) => option.label === label)
    },
    getThreeDayDependencyRefs() {
      const deps = []
      if (this.forfaits.threeDays) {
        deps.push(this.forfaits.threeDays)
      }
      deps.push(...this.getDayOptions('oneDay'))
      deps.push(...this.getDayOptions('twoDays'))
      return deps
    },
    formatOptionLabel(option) {
      return `${option.label} (${option.stock} places)`
    },
    clearDayError(type) {
      if (this.dayErrors[type]) {
        this.dayErrors[type] = ''
      }
    },
    handleSelectionChange(type) {
      this.clearDayError(type)
      this.sanitizeQuantity(type)
    },
    handleQuantityChange(type) {
      this.clearDayError(type)
      this.sanitizeQuantity(type)
    },
    getMaxQuantity(type) {
      if (this.requiresDaySelection(type)) {
        const selected = this.getSelectedOption(type)
        if (!selected) {
          return 0
        }
        if (
          type === 'twoDays' &&
          Array.isArray(selected.linkedDays) &&
          selected.linkedDays.length > 0
        ) {
          const linkedDayStocks = selected.linkedDays.map((label) => {
            const dayOption = this.findOneDayOption(label)
            return dayOption ? dayOption.stock : 0
          })
          return Math.min(selected.stock, ...linkedDayStocks)
        }
        return selected.stock
      }
       if (type === 'threeDays') {
         const stocks = this.getThreeDayDependencyRefs().map((ref) => ref?.stock ?? 0)
         if (!stocks.length) {
           return 0
         }
         return Math.min(...stocks)
       }
      return this.forfaits[type]?.stock ?? 0
    },
    sanitizeQuantity(type) {
      const max = this.getMaxQuantity(type)
      if (max === 0) {
        this.quantities[type] = 1
        return
      }
      if (!this.quantities[type] || this.quantities[type] < 1) {
        this.quantities[type] = 1
      } else if (this.quantities[type] > max) {
        this.quantities[type] = max
      }
    },
    canReserveWithoutAuth(type) {
      // Vérifie si on peut réserver sans tenir compte de l'authentification
      // (pour permettre le clic et afficher la modale)
      const forfait = this.forfaits[type]
      if (!forfait || forfait.stock === 0) {
        return false
      }
      if (!this.quantities[type] || this.quantities[type] < 1) {
        return false
      }
      if (!this.requiresDaySelection(type)) {
        return this.getMaxQuantity(type) > 0
      }
      const selected = this.getSelectedOption(type)
      return Boolean(selected && selected.stock > 0)
    },
    reserve(type) {
      // Vérifier si l'utilisateur est connecté avec le rôle "user"
      if (!this.isAuthenticatedAsUser) {
        this.showAuthModal = true
        return
      }

      if (this.requiresDaySelection(type) && !this.selections[type]) {
        this.dayErrors[type] = 'Choisis un jour avant de réserver.'
        return
      }

      const forfait = this.forfaits[type]
      if (!forfait || forfait.stock === 0) {
        return
      }

      const maxQty = this.getMaxQuantity(type)
      this.sanitizeQuantity(type)
      const requestedQty = Math.min(this.quantities[type], maxQty)
      if (requestedQty <= 0) {
        return
      }

      if (this.requiresDaySelection(type)) {
        const selected = this.getSelectedOption(type)
        if (!selected) {
          this.dayErrors[type] = 'Choisis un jour avant de réserver.'
          return
        }
        let effectiveMax = selected.stock
        if (
          type === 'twoDays' &&
          Array.isArray(selected.linkedDays) &&
          selected.linkedDays.length > 0
        ) {
          const linkedDayStocks = selected.linkedDays.map((label) => {
            const dayOption = this.findOneDayOption(label)
            return dayOption ? dayOption.stock : 0
          })
          effectiveMax = Math.min(effectiveMax, ...linkedDayStocks)
          const insufficient = selected.linkedDays.find((label, index) => linkedDayStocks[index] < requestedQty)
          if (insufficient) {
            this.dayErrors.twoDays = 'Pas assez de places sur ' + insufficient + '.'
            return
          }
        }

        if (effectiveMax < requestedQty) {
          this.dayErrors[type] = 'Pas assez de places pour cette option.'
          return
        }
        selected.stock -= requestedQty
        forfait.stock = Math.max(0, forfait.stock - requestedQty)

        if (type === 'twoDays' && Array.isArray(selected.linkedDays)) {
          let oneDayDeduction = 0
          selected.linkedDays.forEach((label) => {
            const dayRef = this.findOneDayOption(label)
            if (dayRef) {
              dayRef.stock = Math.max(0, dayRef.stock - requestedQty)
              oneDayDeduction += requestedQty
            }
          })
          if (oneDayDeduction > 0) {
            this.forfaits.oneDay.stock = Math.max(0, this.forfaits.oneDay.stock - oneDayDeduction)
          }
        }

        this.sanitizeQuantity(type)
        return
      }

      if (type === 'threeDays') {
        this.clearDayError('threeDays')
        const dependencies = this.getThreeDayDependencyRefs()
        const hasCapacity = dependencies.every((ref) => ref && ref.stock >= requestedQty)
        if (!hasCapacity) {
          this.dayErrors.threeDays = 'Pas assez de places disponibles sur les autres options.'
          return
        }
        dependencies.forEach((ref) => {
          ref.stock -= requestedQty
        })
        this.sanitizeQuantity(type)
        return
      }

      if (forfait.stock >= requestedQty) {
        forfait.stock -= requestedQty
        this.sanitizeQuantity(type)
      }
    },
    closeAuthModal() {
      this.showAuthModal = false
    }
  },
  mounted() {
    this.loadAuthUser()
    window.addEventListener('storage', this.handleStorageChange)
    window.addEventListener('auth-changed', this.handleStorageChange)
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.handleStorageChange)
    window.removeEventListener('auth-changed', this.handleStorageChange)
  }
}
</script>

<style scoped>
.reservation {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: linear-gradient(to bottom, #6f47c1 0%, #1629bf 50%, #11338A 100%);
  color: #f6f7fb;
  padding: 48px 16px;
  box-sizing: border-box;
}

.hero {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 36px 0;
  position: relative;
}

.container {
  max-width: 1100px;
  width: 100%;
  margin: 0 16px;
}

.resa-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 215, 80, 0.08);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 18px 50px rgba(2,6,23,0.65), inset 0 1px 0 rgba(255,255,255,0.02);
  color: #f8fafc;
  line-height: 1.6;
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
}

h1 {
  margin: 0 0 10px 0;
  font-size: 1.65rem;
  font-weight: 800;
  color: #FCDC1E;
  letter-spacing: 0.4px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.45);
}

.divider {
  width: 56px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255,209,102,0.95), rgba(159, 120, 22, 0.9));
  margin: 10px 0 18px 0;
  box-shadow: 0 6px 18px rgba(255,160,60,0.12);
}

.forfaits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.forfait {
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 215, 80, 0.06);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 8px 28px rgba(2,6,23,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.select-label {
  width: 100%;
  font-size: 0.9rem;
  color: #f8f6ed;
  font-weight: 600;
}

.day-select {
  width: 100%;
  background: rgba(1,4,16,0.4);
  border: 1px solid rgba(255, 215, 80, 0.3);
  color: #f8fafc;
  padding: 10px 12px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.day-select:focus {
  outline: none;
  border-color: #ffd166;
  box-shadow: 0 0 0 2px rgba(255, 209, 102, 0.35);
}

.day-error {
  width: 100%;
  font-size: 0.85rem;
  color: #ff8a80;
  margin: 0;
  text-align: left;
}

.quantity-field {
  width: 100%;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quantity-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 215, 80, 0.3);
  background: rgba(1,4,16,0.4);
  color: #f8fafc;
  font-weight: 600;
}

.quantity-input:focus {
  outline: none;
  border-color: #ffd166;
  box-shadow: 0 0 0 2px rgba(255, 209, 102, 0.35);
}

.quantity-hint {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.7);
}

.option-stocks {
  width: 100%;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
}

.option-stocks-title {
  margin: 0 0 4px 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.5px;
}

.option-stocks ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.95rem;
  color: #f8fafc;
}

.option-stocks li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-stocks li strong {
  color: #ffd166;
}

.option-stocks li.out-of-stock strong {
  color: #ff8a80;
}

.stock {
  margin: 0;
  font-weight: 700;
  color: #ffd166;
}

.cta {
  background: linear-gradient(90deg,#ffd166, #dcb00b);
  border: none;
  color: #1b1b1b;
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(255,120,80,0.18), inset 0 -6px 24px rgba(255,255,255,0.04);
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
}
.cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 42px rgba(255,100,50,0.22);
}
.cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.auth-warning {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: linear-gradient(180deg, rgba(255,193,7,0.15), rgba(255,193,7,0.08));
  border: 1px solid rgba(255,193,7,0.3);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255,193,7,0.1);
}

.warning-text {
  margin: 0;
  color: #ffd166;
  font-size: 1rem;
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.warning-link {
  color: #FCDC1E;
  font-weight: 700;
  text-decoration: underline;
  transition: color 0.12s ease;
}

.warning-link:hover {
  color: #fff176;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-card {
  background: linear-gradient(180deg, #0b1e55 0%, #051237 100%);
  border: 1px solid rgba(255, 215, 80, 0.12);
  border-radius: 14px;
  padding: 22px;
  width: min(520px, 92vw);
  box-shadow: 0 18px 50px rgba(2,6,23,0.8);
  color: #fff;
}

.modal-title {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  color: #FCDC1E;
}

.modal-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-close {
  background: transparent;
  color: #ffdca3;
  border: 1px solid rgba(255,255,255,0.12);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.btn-close:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
}

.btn-login-link {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid rgba(0,0,0,0.05);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.btn-login-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(252,220,30,0.3);
}

@media (max-width: 900px) {
  .forfaits {
    grid-template-columns: 1fr;
  }
}
</style>
