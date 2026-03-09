<template>
  <div class="my-reservations-page">
    <div class="my-reservations-card">
      <h1>{{ $t('mesReservations.title') }}</h1>
      <p class="subtitle">
        {{ $t('mesReservations.subtitle') }}
      </p>

      <p v-if="!currentUserEmail" class="info">
        {{ $t('mesReservations.mustLogin') }}
      </p>

      <template v-else>
        <p v-if="reservationsLoading" class="info">
          {{ $t('mesReservations.loading') }}
        </p>
        <p v-if="reservationsError" class="error">{{ reservationsError }}</p>

        <div
          v-if="!reservationsLoading && reservations.length === 0 && !reservationsError"
          class="empty-reservations"
        >
          <p>{{ $t('mesReservations.noReservations') }}</p>
        </div>

        <div v-else-if="!reservationsLoading && reservations.length > 0">
          <ul class="reservations-list">
            <li
              v-for="resa in reservations"
              :key="resa.id"
              class="reservation-item"
            >
              <div class="reservation-row">
                <input
                  type="checkbox"
                  :value="resa.id"
                  v-model="selectedReservationIds"
                />
                <div class="reservation-main">
                  <span class="reservation-icon">{{ getReservationIcon(resa) }}</span>
                  <div class="reservation-info">
                    <span class="reservation-title">
                      {{ formatReservationTitle(resa) }}
                    </span>
                    <span class="reservation-meta">
                      {{ formatReservationMeta(resa) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Modification jour (forfait 1 jour / 2 jours) -->
              <div v-if="canChangeReservationDay(resa)" class="change-day-panel">
                <label :for="`change-day-${resa.id}`" class="change-day-label">
                  {{ $t('mesReservations.changeDayLabel') }}
                </label>
                <div class="change-day-controls">
                  <select
                    :id="`change-day-${resa.id}`"
                    v-model="dayChangeSelections[resa.id]"
                    class="change-day-select"
                  >
                    <option
                      v-for="option in getEditableDayOptions(resa)"
                      :key="`${resa.id}-${option.label}`"
                      :value="option.label"
                    >
                      {{ option.label }} ({{ option.available }} {{ $t('mesReservations.availablePlaces') }})
                    </option>
                  </select>

                  <button
                    type="button"
                    class="btn-change-day"
                    :disabled="Boolean(dayChangeLoadingById[resa.id])"
                    @click="onChangeReservationDay(resa)"
                  >
                    {{ dayChangeLoadingById[resa.id]
                      ? $t('mesReservations.changingDay')
                      : $t('mesReservations.changeDay') }}
                  </button>
                </div>

                <p v-if="dayChangeErrorById[resa.id]" class="change-day-error">
                  {{ dayChangeErrorById[resa.id] }}
                </p>
                <p v-if="dayChangeSuccessById[resa.id]" class="change-day-success">
                  {{ dayChangeSuccessById[resa.id] }}
                </p>
              </div>

              <!-- Modification date + créneau (réservation basket) -->
              <div v-if="resa.type === 'basket'" class="change-day-panel">
                <label class="change-day-label">
                  {{ $t('mesReservations.changeBasketDateTime') }}
                </label>

                <div class="basket-change-grid">
                  <div class="basket-change-field">
                    <label :for="`basket-date-${resa.id}`" class="change-day-sublabel">
                      {{ $t('mesReservations.newDate') }}
                    </label>
                    <select
                      :id="`basket-date-${resa.id}`"
                      v-model="basketDateSelections[resa.id]"
                      class="change-day-select"
                      @change="onBasketDateChanged(resa)"
                    >
                      <option
                        v-for="d in festivalDateOptions"
                        :key="d.dateStr"
                        :value="d.dateStr"
                      >
                        {{ d.label }}
                      </option>
                    </select>
                  </div>

                  <div class="basket-change-field">
                    <label :for="`basket-slot-${resa.id}`" class="change-day-sublabel">
                      {{ $t('mesReservations.newSlot') }}
                    </label>
                    <select
                      :id="`basket-slot-${resa.id}`"
                      v-model="basketSlotSelections[resa.id]"
                      class="change-day-select"
                    >
                      <option
                        v-for="slot in getAvailableBasketSlots(resa)"
                        :key="slot.time"
                        :value="slot.time"
                        :disabled="!slot.available"
                      >
                        {{ slot.time }}{{ !slot.available ? ` (${$t('mesReservations.slotTaken')})` : '' }}
                      </option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn-change-day btn-change-basket"
                  :disabled="Boolean(basketChangeLoadingById[resa.id])"
                  @click="onChangeBasketDateTime(resa)"
                >
                  {{ basketChangeLoadingById[resa.id]
                    ? $t('mesReservations.changingDay')
                    : $t('mesReservations.changeDay') }}
                </button>

                <p v-if="basketChangeErrorById[resa.id]" class="change-day-error">
                  {{ basketChangeErrorById[resa.id] }}
                </p>
                <p v-if="basketChangeSuccessById[resa.id]" class="change-day-success">
                  {{ basketChangeSuccessById[resa.id] }}
                </p>
              </div>
            </li>
          </ul>

          <button
            type="button"
            class="btn-primary btn-delete"
            :disabled="selectedReservationIds.length === 0 || deletingReservations"
            @click="onDeleteSelectedReservations"
          >
            {{ deletingReservations
              ? $t('mesReservations.deleting')
              : $t('mesReservations.delete') }}
          </button>
        </div>
      </template>

      <div class="actions">
        <router-link to="/reservation" class="btn-secondary">
          {{ $t('mesReservations.backToBooking') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const RESERVATIONS_KEY = 'userReservations'
const BASKET_RESERVATIONS_KEY = 'basketReservations'

const currentUserEmail = ref('')
const reservations = ref([])
const reservationsLoading = ref(false)
const reservationsError = ref('')
const deletingReservations = ref(false)
const selectedReservationIds = ref([])
const oneDayStockByLabel = ref({})
const twoDaysStockByLabel = ref({})
const dayChangeSelections = ref({})
const dayChangeLoadingById = ref({})
const dayChangeErrorById = ref({})
const dayChangeSuccessById = ref({})

// ─── Basket date/slot change ──────────────────────────────────────────────────
const basketDateSelections = ref({})
const basketSlotSelections = ref({})
const basketChangeLoadingById = ref({})
const basketChangeErrorById = ref({})
const basketChangeSuccessById = ref({})

const ALL_BASKET_SLOTS = [
  '09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00'
]

// Festival dates (pour la sélection basket)
const festivalDateOptions = ref([
  { dateStr: '2026-08-28', label: 'Vendredi 28 Août' },
  { dateStr: '2026-08-29', label: 'Samedi 29 Août' },
  { dateStr: '2026-08-30', label: 'Dimanche 30 Août' }
])

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

const normalizeDayLabel = (value) => String(value || '').trim().toLowerCase()

const buildOneDayStockIndex = (forfaits) => {
  const days = forfaits?.oneDay?.days
  if (!Array.isArray(days)) return {}

  return days.reduce((acc, day) => {
    const key = normalizeDayLabel(day.label)
    if (!key) return acc
    acc[key] = {
      label: String(day.label || '').trim(),
      stock: Number(day.stock) || 0
    }
    return acc
  }, {})
}

// Helper pour normaliser les jours_associes (format chaîne ou objet)
const normalizeJoursAssocies = (jours, defaultStock = 40) => {
  if (!Array.isArray(jours)) return {}
  return jours.reduce((acc, day) => {
    // Gérer les deux formats : chaîne simple "Vendredi" ou objet {label: "Vendredi", stock: 40}
    const label = typeof day === 'string' ? day : (day?.label || '')
    const stock = typeof day === 'object' ? (Number(day?.stock) || defaultStock) : defaultStock
    const key = normalizeDayLabel(label)
    if (!key) return acc
    acc[key] = { label: String(label).trim(), stock }
    return acc
  }, {})
}

const loadOneDayStocks = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/billets', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    if (response.ok) {
      const billets = await response.json()

      // oneDay - chercher avec les deux formats possibles de type_billet
      const oneDayBillet = Array.isArray(billets)
        ? billets.find((item) => item?.type_billet === 'oneDay' || item?.type_billet === '1jour')
        : null
      if (oneDayBillet && Array.isArray(oneDayBillet.jours_associes)) {
        oneDayStockByLabel.value = normalizeJoursAssocies(oneDayBillet.jours_associes, 40)
      }

      // twoDays - chercher avec les deux formats possibles de type_billet
      const twoDaysBillet = Array.isArray(billets)
        ? billets.find((item) => item?.type_billet === 'twoDays' || item?.type_billet === '2jours')
        : null
      if (twoDaysBillet && Array.isArray(twoDaysBillet.jours_associes)) {
        twoDaysStockByLabel.value = normalizeJoursAssocies(twoDaysBillet.jours_associes, 40)
      }

      if (Object.keys(oneDayStockByLabel.value).length > 0 || Object.keys(twoDaysStockByLabel.value).length > 0) {
        return
      }
    }
  } catch (e) {
    // Fallback JSON si l'API n'est pas disponible
  }

  try {
    const fallback = await fetch('/data/forfaits.json')
    const forfaits = await fallback.json()
    oneDayStockByLabel.value = buildOneDayStockIndex(forfaits)
    // twoDays fallback
    const twoDays = forfaits?.twoDays?.days
    if (Array.isArray(twoDays)) {
      twoDaysStockByLabel.value = twoDays.reduce((acc, day) => {
        const key = normalizeDayLabel(day.label)
        if (!key) return acc
        acc[key] = { label: String(day.label || '').trim(), stock: Number(day.stock) || 0 }
        return acc
      }, {})
    }
  } catch (e) {
    oneDayStockByLabel.value = {}
    twoDaysStockByLabel.value = {}
  }
}

// Charger les dates du festival pour les sélections basket
const loadFestivalDates = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const resp = await fetch('/api/manifestations', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (resp.ok) {
      const list = await resp.json()
      const festival = Array.isArray(list) ? (list.find(f => f.actif) || list[0]) : null
      if (festival && festival.date_debut && festival.date_fin) {
        const debut = new Date(festival.date_debut)
        const fin = new Date(festival.date_fin)
        const dates = []
        const dayNames = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
        const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
        for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
          dates.push({
            dateStr: d.toISOString().split('T')[0],
            label: `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`
          })
        }
        if (dates.length) {
          festivalDateOptions.value = dates
          return
        }
      }
    }
  } catch (_) { /* fallback */ }

  try {
    const resp = await fetch('/data/festival.json', { cache: 'no-store' })
    const data = await resp.json()
    if (data?.info?.festivalDates && Array.isArray(data.info.festivalDates)) {
      festivalDateOptions.value = data.info.festivalDates.map(d => ({
        dateStr: d.dateStr,
        label: `${typeof d.dayName === 'object' ? d.dayName.fr : d.dayName} ${d.dayNumber} ${typeof d.monthName === 'object' ? d.monthName.fr : d.monthName}`
      }))
    }
  } catch (_) { /* garder les valeurs par défaut */ }
}

const getAllReservations = () => {
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

const getUsedPlacesByDay = (type, excludedReservationId = null) => {
  const used = {}
  const allReservations = getAllReservations()

  allReservations.forEach((reservation) => {
    if (reservation.type !== type) return
    if (excludedReservationId && reservation.id === excludedReservationId) return

    const dayKey = normalizeDayLabel(reservation.optionLabel)
    if (!dayKey) return

    used[dayKey] = (used[dayKey] || 0) + (Number(reservation.quantity) || 0)
  })

  return used
}

const canChangeReservationDay = (reservation) => {
  if (reservation.type === 'oneDay' && Object.keys(oneDayStockByLabel.value).length > 0) return true
  if (reservation.type === 'twoDays' && Object.keys(twoDaysStockByLabel.value).length > 0) return true
  return false
}

const getEditableDayOptions = (reservation) => {
  const type = reservation.type
  const stockIndex = type === 'twoDays' ? twoDaysStockByLabel.value : oneDayStockByLabel.value
  const usedByDay = getUsedPlacesByDay(type, reservation.id)

  return Object.values(stockIndex)
    .map((day) => {
      const dayKey = normalizeDayLabel(day.label)
      const available = Math.max(0, (day.stock || 0) - (usedByDay[dayKey] || 0))
      return {
        label: day.label,
        available
      }
    })
    .filter((option) => option.available > 0 || option.label === reservation.optionLabel)
}

const initDaySelections = () => {
  const nextSelections = { ...dayChangeSelections.value }
  reservations.value.forEach((reservation) => {
    if (canChangeReservationDay(reservation) && !nextSelections[reservation.id]) {
      nextSelections[reservation.id] = reservation.optionLabel || ''
    }
  })
  dayChangeSelections.value = nextSelections
}

const loadReservations = () => {
  reservationsError.value = ''
  reservationsLoading.value = true
  try {
    const list = getAllReservations()
    const email = (currentUserEmail.value || '').toLowerCase()
    reservations.value = list.filter(
      (r) => (r.userEmail || '').toLowerCase() === email
    )
    initDaySelections()
  } catch (e) {
    reservations.value = []
    reservationsError.value = t('mesReservations.loadError')
  } finally {
    reservationsLoading.value = false
  }
}

const getReservationIcon = (resa) => {
  switch (resa.type) {
    case 'basket':
      return '🏀'
    case 'parking':
      return '🚗'
    case 'camping':
      return '⛺'
    case 'oneDay':
    case 'twoDays':
    case 'threeDays':
      return '🎫'
    default:
      return '📋'
  }
}

const formatReservationTitle = (resa) => {
  if (resa.displayLabel) return resa.displayLabel
  switch (resa.type) {
    case 'oneDay':
      return t('mesReservations.package1Day')
    case 'twoDays':
      return t('mesReservations.package2Days')
    case 'threeDays':
      return t('mesReservations.package3Days')
    case 'parking':
      return t('mesReservations.parking')
    case 'camping':
      return t('mesReservations.camping')
    case 'basket':
      return t('mesReservations.basket')
    default:
      return t('mesReservations.reservation')
  }
}

const formatReservationMeta = (resa) => {
  const parts = []

  // Pour les réservations de basket
  if (resa.type === 'basket') {
    if (resa.date) {
      try {
        const date = new Date(resa.date)
        parts.push(date.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        }))
      } catch (e) {
        parts.push(resa.date)
      }
    }
    if (resa.slot && resa.endTime) {
      parts.push(`${resa.slot} - ${resa.endTime}`)
    } else if (resa.slot) {
      parts.push(resa.slot)
    }
    if (resa.nbPlayers) {
      parts.push(`${resa.nbPlayers} ${t('mesReservations.players')}`)
    }
  } else {
    // Pour les autres types de réservation
    if (resa.optionLabel) {
      parts.push(resa.optionLabel)
    }
    if (resa.quantity) {
      parts.push(`${resa.quantity} ${t('mesReservations.places')}`)
    }
    if (resa.personalInfo) {
      const fullName = `${resa.personalInfo.firstName || ''} ${resa.personalInfo.lastName || ''}`.trim()
      if (fullName) {
        parts.push(fullName)
      }
    }
  }

  if (resa.createdAt) {
    try {
      const date = new Date(resa.createdAt)
      parts.push(
        `${t('mesReservations.reservedOn')} ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString(
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
    reservationsError.value = t('mesReservations.deleteError')
  } finally {
    deletingReservations.value = false
  }
}

const onChangeReservationDay = (reservation) => {
  const reservationId = reservation.id
  const selectedDay = dayChangeSelections.value[reservationId]

  dayChangeErrorById.value = {
    ...dayChangeErrorById.value,
    [reservationId]: ''
  }
  dayChangeSuccessById.value = {
    ...dayChangeSuccessById.value,
    [reservationId]: ''
  }

  if (!selectedDay) {
    dayChangeErrorById.value = {
      ...dayChangeErrorById.value,
      [reservationId]: t('mesReservations.selectDayToChange')
    }
    return
  }

  if (selectedDay === reservation.optionLabel) {
    dayChangeErrorById.value = {
      ...dayChangeErrorById.value,
      [reservationId]: t('mesReservations.dayUnchanged')
    }
    return
  }

  const selectedOption = getEditableDayOptions(reservation).find((option) => option.label === selectedDay)
  if (!selectedOption || selectedOption.available < (Number(reservation.quantity) || 0)) {
    dayChangeErrorById.value = {
      ...dayChangeErrorById.value,
      [reservationId]: t('mesReservations.notEnoughPlacesForDay')
    }
    return
  }

  dayChangeLoadingById.value = {
    ...dayChangeLoadingById.value,
    [reservationId]: true
  }

  try {
    const allReservations = getAllReservations()
    const currentEmail = (currentUserEmail.value || '').toLowerCase()
    const typeLabel = reservation.type === 'twoDays' ? 'Forfait 2 jours' : 'Forfait 1 jour'

    const updatedReservations = allReservations.map((item) => {
      if (item.id !== reservationId) return item
      if ((item.userEmail || '').toLowerCase() !== currentEmail) return item

      return {
        ...item,
        optionLabel: selectedDay,
        displayLabel: `${typeLabel} - ${selectedDay}`
      }
    })

    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updatedReservations))

    reservations.value = reservations.value.map((item) => {
      if (item.id !== reservationId) return item
      return {
        ...item,
        optionLabel: selectedDay,
        displayLabel: `${typeLabel} - ${selectedDay}`
      }
    })

    dayChangeSuccessById.value = {
      ...dayChangeSuccessById.value,
      [reservationId]: t('mesReservations.dayUpdated')
    }
  } catch (e) {
    dayChangeErrorById.value = {
      ...dayChangeErrorById.value,
      [reservationId]: t('mesReservations.dayUpdateError')
    }
  } finally {
    dayChangeLoadingById.value = {
      ...dayChangeLoadingById.value,
      [reservationId]: false
    }
  }
}

onMounted(async () => {
  loadCurrentUser()
  if (!currentUserEmail.value) {
    router.push('/login')
  } else {
    await Promise.all([loadOneDayStocks(), loadFestivalDates()])
    loadReservations()
    initBasketSelections()
  }
})

// ─── Basket : fonctions de modification de date + créneau ─────────────────

const getOtherBasketReservations = (excludedId = null) => {
  try {
    const fromMain = getAllReservations()
      .filter(r => r.type === 'basket' && r.id !== excludedId)
    const raw = localStorage.getItem(BASKET_RESERVATIONS_KEY)
    const fromBasket = raw ? JSON.parse(raw) : []
    // Éviter les doublons : ne garder de fromBasket que ceux absents de fromMain
    const mainDates = new Set(fromMain.map(r => `${r.date}|${r.slot}`))
    const uniqueBasket = Array.isArray(fromBasket)
      ? fromBasket.filter(r => !mainDates.has(`${r.date}|${r.slot}`))
      : []
    return [...fromMain, ...uniqueBasket]
  } catch (_) {
    return []
  }
}

const getAvailableBasketSlots = (resa) => {
  const selectedDateForResa = basketDateSelections.value[resa.id] || resa.date
  const others = getOtherBasketReservations(resa.id)
  return ALL_BASKET_SLOTS.map(time => {
    const taken = others.some(r =>
      String(r.date || '').trim() === String(selectedDateForResa).trim() &&
      String(r.slot || '').trim() === String(time).trim()
    )
    return { time, available: !taken }
  })
}

const onBasketDateChanged = (resa) => {
  // Réinitialiser le créneau quand la date change
  basketSlotSelections.value = { ...basketSlotSelections.value, [resa.id]: '' }
}

const initBasketSelections = () => {
  const nextDate = { ...basketDateSelections.value }
  const nextSlot = { ...basketSlotSelections.value }
  reservations.value.forEach(r => {
    if (r.type === 'basket') {
      if (!nextDate[r.id]) nextDate[r.id] = r.date || ''
      if (!nextSlot[r.id]) nextSlot[r.id] = r.slot || ''
    }
  })
  basketDateSelections.value = nextDate
  basketSlotSelections.value = nextSlot
}

const onChangeBasketDateTime = (reservation) => {
  const id = reservation.id
  const newDate = basketDateSelections.value[id]
  const newSlot = basketSlotSelections.value[id]

  basketChangeErrorById.value = { ...basketChangeErrorById.value, [id]: '' }
  basketChangeSuccessById.value = { ...basketChangeSuccessById.value, [id]: '' }

  if (!newDate || !newSlot) {
    basketChangeErrorById.value = {
      ...basketChangeErrorById.value,
      [id]: t('mesReservations.selectDateSlot')
    }
    return
  }

  if (newDate === reservation.date && newSlot === reservation.slot) {
    basketChangeErrorById.value = {
      ...basketChangeErrorById.value,
      [id]: t('mesReservations.dateSlotUnchanged')
    }
    return
  }

  // Vérifier que le créneau est disponible
  const slots = getAvailableBasketSlots(reservation)
  const chosenSlot = slots.find(s => s.time === newSlot)
  if (!chosenSlot || !chosenSlot.available) {
    basketChangeErrorById.value = {
      ...basketChangeErrorById.value,
      [id]: t('mesReservations.slotTaken')
    }
    return
  }

  basketChangeLoadingById.value = { ...basketChangeLoadingById.value, [id]: true }

  try {
    const endHour = parseInt(newSlot.split(':')[0]) + 1
    const newEndTime = `${endHour.toString().padStart(2, '0')}:${newSlot.split(':')[1]}`

    // 1) Mettre à jour dans userReservations (localStorage)
    const allResas = getAllReservations()
    const email = (currentUserEmail.value || '').toLowerCase()
    const updatedAll = allResas.map(item => {
      if (item.id !== id || (item.userEmail || '').toLowerCase() !== email) return item
      return { ...item, date: newDate, slot: newSlot, endTime: newEndTime }
    })
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updatedAll))

    // 2) Mettre à jour aussi dans basketReservations (localStorage) si présent
    try {
      const rawBasket = localStorage.getItem(BASKET_RESERVATIONS_KEY)
      const basketResas = rawBasket ? JSON.parse(rawBasket) : []
      const updatedBasket = basketResas.map(item => {
        if (String(item.date).trim() === String(reservation.date).trim() &&
            String(item.slot || '').trim() === String(reservation.slot || '').trim()) {
          return { ...item, date: newDate, slot: newSlot }
        }
        return item
      })
      localStorage.setItem(BASKET_RESERVATIONS_KEY, JSON.stringify(updatedBasket))
    } catch (_) { /* pas bloquant */ }

    // 3) Mettre à jour le state local
    reservations.value = reservations.value.map(item => {
      if (item.id !== id) return item
      return { ...item, date: newDate, slot: newSlot, endTime: newEndTime }
    })

    // Émettre un événement pour que BasketReservationView se rafraîchisse
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('basket-reservations-updated'))
    }

    basketChangeSuccessById.value = {
      ...basketChangeSuccessById.value,
      [id]: t('mesReservations.dateSlotUpdated')
    }
  } catch (e) {
    basketChangeErrorById.value = {
      ...basketChangeErrorById.value,
      [id]: t('mesReservations.dateSlotUpdateError')
    }
  } finally {
    basketChangeLoadingById.value = { ...basketChangeLoadingById.value, [id]: false }
  }
}
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

.reservation-icon {
  font-size: 1.5rem;
  margin-right: 12px;
  flex-shrink: 0;
}

.reservation-main {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.reservation-info {
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

.change-day-panel {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.change-day-label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 6px;
}

.change-day-controls {
  display: flex;
  gap: 8px;
}

.change-day-select {
  flex: 1;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(30, 30, 30, 0.95);
  color: #fff;
  padding: 8px;
}

.change-day-select option {
  background-color: #1a1a1a;
  color: #fff;
  padding: 8px;
}

.change-day-select option:disabled {
  color: #888;
}

.btn-change-day {
  border: 0;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, #fcdc1e 0%, #ffe676 100%);
  color: #0a0a0a;
}

.btn-change-day:disabled {
  opacity: 0.6;
  cursor: default;
}

.change-day-error {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #ff9b9b;
}

.change-day-success {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #8fffba;
}

.change-day-sublabel {
  display: block;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 4px;
}

.basket-change-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 4px;
}

.basket-change-field {
  display: flex;
  flex-direction: column;
}

.btn-change-basket {
  width: 100%;
  margin-top: 8px;
}

@media (max-width: 420px) {
  .basket-change-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .my-reservations-card {
    padding: 24px 18px 18px;
  }
}
</style>
