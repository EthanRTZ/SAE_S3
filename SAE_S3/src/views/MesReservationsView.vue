<template>
  <div class="my-reservations-page">
    <div class="my-reservations-card">
      <h1>Mes réservations</h1>
      <p class="subtitle">
        Retrouvez toutes vos réservations effectuées avec ce compte et supprimez celles que vous ne souhaitez plus conserver.
      </p>

      <p v-if="!currentUserEmail" class="info">
        Vous devez être connecté pour voir vos réservations.
      </p>

      <template v-else>
        <p v-if="reservationsLoading" class="info">
          Chargement de vos réservations...
        </p>
        <p v-if="reservationsError" class="error">{{ reservationsError }}</p>

        <div
          v-if="!reservationsLoading && reservations.length === 0 && !reservationsError"
          class="empty-reservations"
        >
          <p>Vous n'avez pas encore de réservation enregistrée avec ce compte.</p>
        </div>

        <div v-else-if="!reservationsLoading && reservations.length > 0">
          <ul class="reservations-list">
            <li
              v-for="resa in reservations"
              :key="resa.id"
              class="reservation-item"
            >
              <label class="reservation-row">
                <input
                  type="checkbox"
                  :value="resa.id"
                  v-model="selectedReservationIds"
                />
                <div class="reservation-main">
                  <span class="reservation-title">
                    {{ formatReservationTitle(resa) }}
                  </span>
                  <span class="reservation-meta">
                    {{ formatReservationMeta(resa) }}
                  </span>
                </div>
              </label>
            </li>
          </ul>

          <button
            type="button"
            class="btn-primary btn-delete"
            :disabled="selectedReservationIds.length === 0 || deletingReservations"
            @click="onDeleteSelectedReservations"
          >
            {{ deletingReservations
              ? 'Suppression...'
              : 'Supprimer les réservations sélectionnées' }}
          </button>
        </div>
      </template>

      <div class="actions">
        <router-link to="/reservation" class="btn-secondary">
          Retour à la billetterie
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const RESERVATIONS_KEY = 'userReservations'

const currentUserEmail = ref('')
const reservations = ref([])
const reservationsLoading = ref(false)
const reservationsError = ref('')
const deletingReservations = ref(false)
const selectedReservationIds = ref([])

const loadCurrentUser = () => {
  try {
    const raw = localStorage.getItem('authUser')
    if (raw) {
      const auth = JSON.parse(raw)
      currentUserEmail.value = auth.email || ''
    }
  } catch (e) {
    currentUserEmail.value = ''
  }
}

const loadReservations = () => {
  reservationsError.value = ''
  reservationsLoading.value = true
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY)
    if (!raw) {
      reservations.value = []
      return
    }
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed) ? parsed : []
    const email = (currentUserEmail.value || '').toLowerCase()
    reservations.value = list.filter(
      (r) => (r.userEmail || '').toLowerCase() === email
    )
  } catch (e) {
    reservations.value = []
    reservationsError.value = 'Impossible de charger vos réservations.'
  } finally {
    reservationsLoading.value = false
  }
}

const formatReservationTitle = (resa) => {
  if (resa.displayLabel) return resa.displayLabel
  switch (resa.type) {
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
      return 'Réservation'
  }
}

const formatReservationMeta = (resa) => {
  const parts = []
  if (resa.optionLabel) {
    parts.push(resa.optionLabel)
  }
  if (resa.quantity) {
    parts.push(`${resa.quantity} place${resa.quantity > 1 ? 's' : ''}`)
  }
  if (resa.personalInfo) {
    const fullName = `${resa.personalInfo.firstName || ''} ${resa.personalInfo.lastName || ''}`.trim()
    if (fullName) {
      parts.push(fullName)
    }
  }
  if (resa.createdAt) {
    try {
      const date = new Date(resa.createdAt)
      parts.push(
        `Acheté le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString(
          'fr-FR',
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        )}`
      )
    } catch (e) {
      // ignore
    }
  }
  return parts.join(' • ')
}

const onDeleteSelectedReservations = () => {
  if (!selectedReservationIds.value.length || deletingReservations.value) {
    return
  }
  deletingReservations.value = true
  reservationsError.value = ''
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY)
    const all = raw ? JSON.parse(raw) : []
    const idsToDelete = new Set(selectedReservationIds.value)
    const email = (currentUserEmail.value || '').toLowerCase()
    const remaining = Array.isArray(all)
      ? all.filter(
          (r) =>
            !(
              (r.userEmail || '').toLowerCase() === email &&
              idsToDelete.has(r.id)
            )
        )
      : []
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(remaining))
    reservations.value = reservations.value.filter(
      (r) => !idsToDelete.has(r.id)
    )
    selectedReservationIds.value = []
  } catch (e) {
    reservationsError.value =
      'Impossible de supprimer les réservations sélectionnées.'
  } finally {
    deletingReservations.value = false
  }
}

onMounted(() => {
  loadCurrentUser()
  if (!currentUserEmail.value) {
    router.push('/login')
  } else {
    loadReservations()
  }
})
</script>

<style scoped>
.my-reservations-page {
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

.my-reservations-card {
  width: 100%;
  max-width: 700px;
  background: rgba(255, 255, 255, 0.05);
  padding: 30px 28px 24px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  box-shadow:
    0 12px 28px rgba(2, 6, 23, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
}

h1 {
  margin-bottom: 6px;
  color: #fcdc1e;
  font-size: 1.7rem;
  text-align: center;
  letter-spacing: 0.5px;
}

.subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
  margin-bottom: 24px;
}

.info {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
}

.reservations-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reservation-item {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 12px;
}

.reservation-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.reservation-row input[type='checkbox'] {
  margin-top: 4px;
}

.reservation-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reservation-title {
  font-weight: 600;
  color: #fcdc1e;
}

.reservation-meta {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.empty-reservations {
  margin-top: 8px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
}

.btn-primary {
  background: linear-gradient(135deg, #fcdc1e 0%, #ffe676 100%);
  color: #0a0a0a;
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 800;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(252, 220, 30, 0.28);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    filter 0.12s ease;
  width: 100%;
  margin-top: 8px;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: default;
}

.btn-delete {
  background: linear-gradient(135deg, #ff8a80 0%, #ff5252 100%);
  color: #fff;
  box-shadow: 0 8px 18px rgba(244, 67, 54, 0.35);
}

.btn-delete:disabled {
  opacity: 0.6;
  box-shadow: none;
}

.actions {
  margin-top: 18px;
  text-align: center;
}

.btn-secondary {
  color: #fff;
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-weight: 700;
  transition:
    background 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease;
  display: inline-block;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.24);
}

.error {
  margin-top: 12px;
  color: #3b0d0d;
  background: linear-gradient(
    180deg,
    rgba(255, 155, 155, 0.16),
    rgba(255, 155, 155, 0.1)
  );
  border: 1px solid rgba(255, 120, 120, 0.35);
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

@media (max-width: 420px) {
  .my-reservations-card {
    padding: 24px 18px 18px;
  }
}
</style>
