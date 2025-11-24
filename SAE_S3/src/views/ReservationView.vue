<template>
  <div class="reservation">
    <div class="hero">
      <div class="container">
        <section class="resa-card" aria-label="Réserver un forfait">
          <h1>Réserver un forfait</h1>
          <div class="divider" aria-hidden="true"></div>

          <div class="forfaits">
            <div class="forfait">
              <p class="stock">Places restantes: {{ forfaits.oneDay.stock }}</p>
              <label class="select-label" for="oneDaySelect">Choisis ton jour</label>
              <select
                id="oneDaySelect"
                class="day-select"
                v-model="selections.oneDay"
                @change="clearDayError('oneDay')"
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
              <button
                class="cta"
                :disabled="!canReserve('oneDay')"
                @click="reserve('oneDay')"
              >
                Réserver 1 jour
              </button>
            </div>

            <div class="forfait">
              <p class="stock">Places restantes: {{ forfaits.twoDays.stock }}</p>
              <label class="select-label" for="twoDaySelect">Choisis tes jours</label>
              <select
                id="twoDaySelect"
                class="day-select"
                v-model="selections.twoDays"
                @change="clearDayError('twoDays')"
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
              <button
                class="cta"
                :disabled="!canReserve('twoDays')"
                @click="reserve('twoDays')"
              >
                Réserver 2 jours
              </button>
            </div>

            <div class="forfait">
              <p class="stock">Places restantes: {{ forfaits.threeDays.stock }}</p>
              <button class="cta" :disabled="!canReserve('threeDays')" @click="reserve('threeDays')">
                Réserver 3 jours
              </button>
            </div>
          </div>

          <div class="auth-check">
            <label class="checkbox-label">
              <input type="checkbox" v-model="requireLoginChecked" />
              <span>non connecté</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  </div>
  
  <div v-if="showAuthModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
    <div class="modal-card">
      <h2 id="auth-modal-title" class="modal-title">Connexion requise</h2>
      <p>
        Vous devez être connecté pour réserver un forfait. Veuillez vous connecter
        ou créer un compte pour poursuivre votre réservation.
      </p>
      <div class="modal-actions">
        <button class="btn-close" @click="closeAuthModal">J'ai compris</button>
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
      dayErrors: {
        oneDay: '',
        twoDays: ''
      },
      requireLoginChecked: false,
      showAuthModal: false
    }
  },
  methods: {
    requiresDaySelection(type) {
      return type === 'oneDay' || type === 'twoDays'
    },
    getDayOptions(type) {
      return this.forfaits[type]?.days ?? []
    },
    getSelectedOption(type) {
      return this.getDayOptions(type).find((option) => option.label === this.selections[type])
    },
    formatOptionLabel(option) {
      return `${option.label} (${option.stock} places)`
    },
    clearDayError(type) {
      if (this.dayErrors[type]) {
        this.dayErrors[type] = ''
      }
    },
    canReserve(type) {
      const forfait = this.forfaits[type]
      if (!forfait || forfait.stock === 0) {
        return false
      }
      if (!this.requiresDaySelection(type)) {
        return true
      }
      const selected = this.getSelectedOption(type)
      return Boolean(selected && selected.stock > 0)
    },
    reserve(type) {
      if (this.requireLoginChecked) {
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

      if (this.requiresDaySelection(type)) {
        const selected = this.getSelectedOption(type)
        if (!selected) {
          this.dayErrors[type] = 'Choisis un jour avant de réserver.'
          return
        }
        if (selected.stock === 0) {
          this.dayErrors[type] = 'Plus de places pour cette option.'
          return
        }
        selected.stock -= 1
        forfait.stock = Math.max(0, forfait.stock - 1)
        this.selections[type] = ''
        return
      }

      if (forfait.stock > 0) {
        forfait.stock -= 1
      }
    },
    closeAuthModal() {
      this.showAuthModal = false
    }
  }
}
</script>

<style scoped>
.reservation {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: stretch;
  justify-content: center;
  background:
    radial-gradient(700px 260px at 12% 12%, rgba(255, 190, 60, 0.14), transparent 18%),
    linear-gradient(180deg, rgba(2, 24, 80, 0.93) 0%, #010410 50%, #a68506 100%);
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

.auth-check {
  margin-top: 22px;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.98rem;
  color: #ffdca3;
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
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03));
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
}

.btn-close {
  background: transparent;
  color: #ffdca3;
  border: 1px solid rgba(255,255,255,0.12);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .forfaits {
    grid-template-columns: 1fr;
  }
}
</style>
