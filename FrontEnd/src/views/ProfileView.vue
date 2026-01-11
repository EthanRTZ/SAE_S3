<template>
  <div class="profile-page">
    <div class="profile-card">
      <h2>{{ $t('profile.title') }}</h2>
      <p class="subtitle">{{ $t('profile.subtitle') }}</p>

      <!-- Section Modification Email -->
      <div class="profile-section">
        <h3>{{ $t('profile.modifyEmail') }}</h3>
        <form @submit.prevent="onUpdateEmail">
          <div class="input-group">
            <label for="currentEmail">{{ $t('profile.currentEmail') }}</label>
            <input
              id="currentEmail"
              type="email"
              :value="currentUserEmail"
              disabled
              class="input-disabled"
            />
          </div>
          <div class="input-group">
            <label for="emailPassword">{{ $t('profile.password') }}</label>
            <span class="input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="#FCDC1E" stroke-width="1.6"/>
                <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#FCDC1E" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </span>
            <input
              id="emailPassword"
              :type="showEmailPwd ? 'text' : 'password'"
              v-model="emailPassword"
              required
            />
            <button
              type="button"
              class="toggle-pwd"
              @click="showEmailPwd = !showEmailPwd"
              :title="showEmailPwd ? $t('profile.hide') : $t('profile.show')"
            >
              <svg v-if="!showEmailPwd" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="1.6"/>
                <circle cx="12" cy="12" r="3.2" fill="currentColor"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M2 12s3.5-7 10-7c2.2 0 4 .6 5.5 1.5M22 12s-3.5 7-10 7c-2.2 0-4-.6-5.5-1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M9.9 9.9A3.2 3.2 0 0 0 12 15.2 3.2 3.2 0 0 0 15.2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="input-group">
            <label for="newEmail">{{ $t('profile.newEmail') }}</label>
            <span class="input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" stroke="#FCDC1E" stroke-width="1.6" />
                <path d="M4 7l8 6 8-6" stroke="#FCDC1E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <input
              id="newEmail"
              type="email"
              v-model.trim="newEmail"
              required
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="loadingEmail">
            {{ loadingEmail ? $t('profile.modifying') : $t('profile.modify') }}
          </button>
          <p v-if="emailError" class="error">{{ emailError }}</p>
          <p v-if="emailSuccess" class="success">{{ emailSuccess }}</p>
        </form>
      </div>

      <div class="section-divider"></div>

      <!-- Section Modification Mot de passe -->
      <div class="profile-section">
        <h3>{{ $t('profile.modifyPassword') }}</h3>
        <form @submit.prevent="onUpdatePassword">
          <div class="input-group">
            <label for="currentPassword">{{ $t('profile.currentPassword') }}</label>
            <span class="input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="#FCDC1E" stroke-width="1.6"/>
                <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#FCDC1E" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </span>
            <input
              id="currentPassword"
              :type="showCurrentPwd ? 'text' : 'password'"
              v-model="currentPassword"
              required
            />
            <button
              type="button"
              class="toggle-pwd"
              @click="showCurrentPwd = !showCurrentPwd"
              :title="showCurrentPwd ? 'Masquer' : 'Afficher'"
            >
              <svg v-if="!showCurrentPwd" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="1.6"/>
                <circle cx="12" cy="12" r="3.2" fill="currentColor"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M2 12s3.5-7 10-7c2.2 0 4 .6 5.5 1.5M22 12s-3.5 7-10 7c-2.2 0-4-.6-5.5-1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M9.9 9.9A3.2 3.2 0 0 0 12 15.2 3.2 3.2 0 0 0 15.2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="input-group">
            <label for="newPassword">{{ $t('profile.newPassword') }}</label>
            <span class="input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="#FCDC1E" stroke-width="1.6"/>
                <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#FCDC1E" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </span>
            <input
              id="newPassword"
              :type="showNewPwd ? 'text' : 'password'"
              v-model="newPassword"
              required
              minlength="6"
            />
            <button
              type="button"
              class="toggle-pwd"
              @click="showNewPwd = !showNewPwd"
              :title="showNewPwd ? 'Masquer' : 'Afficher'"
            >
              <svg v-if="!showNewPwd" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="1.6"/>
                <circle cx="12" cy="12" r="3.2" fill="currentColor"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M2 12s3.5-7 10-7c2.2 0 4 .6 5.5 1.5M22 12s-3.5 7-10 7c-2.2 0-4-.6-5.5-1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M9.9 9.9A3.2 3.2 0 0 0 12 15.2 3.2 3.2 0 0 0 15.2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="input-group">
            <label for="confirmNewPassword">{{ $t('profile.confirmNewPassword') }}</label>
            <span class="input-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12a7 7 0 0 1 14 0v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6Z" stroke="#FCDC1E" stroke-width="1.6"/>
                <path d="M10 15h4" stroke="#FCDC1E" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </span>
            <input
              id="confirmNewPassword"
              :type="showConfirmPwd ? 'text' : 'password'"
              v-model="confirmNewPassword"
              required
              minlength="6"
            />
            <button
              type="button"
              class="toggle-pwd"
              @click="showConfirmPwd = !showConfirmPwd"
              :title="showConfirmPwd ? 'Masquer' : 'Afficher'"
            >
              <svg v-if="!showConfirmPwd" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="1.6"/>
                <circle cx="12" cy="12" r="3.2" fill="currentColor"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M2 12s3.5-7 10-7c2.2 0 4 .6 5.5 1.5M22 12s-3.5 7-10 7c-2.2 0-4-.6-5.5-1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M9.9 9.9A3.2 3.2 0 0 0 12 15.2 3.2 3.2 0 0 0 15.2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <ul class="password-hints">
            <li :class="{ ok: newPassword.length >= 6 }">{{ $t('profile.passwordHint1') }}</li>
            <li :class="{ ok: /[0-9]/.test(newPassword) }">{{ $t('profile.passwordHint2') }}</li>
          </ul>
          <button type="submit" class="btn-primary" :disabled="loadingPassword">
            {{ loadingPassword ? $t('profile.modifying') : $t('profile.modifyPwd') }}
          </button>
          <p v-if="passwordError" class="error">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="success">{{ passwordSuccess }}</p>
        </form>
      </div>

      <div class="section-divider"></div>

      <!-- Section Gestion des réservations (uniquement pour les comptes user) -->
      <div v-if="currentUserRole === 'user'" class="profile-section">
        <h3>{{ $t('profile.myReservations') }}</h3>
        <p class="reservations-help">
          {{ $t('profile.reservationsHelp') }}
        </p>

        <p v-if="reservationsLoading" class="info">{{ $t('profile.loading') }}</p>
        <p v-if="reservationsError" class="error">{{ reservationsError }}</p>

        <div v-if="!reservationsLoading && reservations.length === 0 && !reservationsError" class="empty-reservations">
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
            {{ deletingReservations ? $t('profile.deleting') : $t('profile.delete') }}
          </button>
        </div>
      </div>

      <div class="actions">
        <router-link to="/" class="btn-secondary">Retour à l'accueil</router-link>
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
const currentUserEmail = ref('')
const currentUserRole = ref('user')
const newEmail = ref('')
const emailPassword = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const loadingEmail = ref(false)
const loadingPassword = ref(false)
const emailError = ref('')
const emailSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const showEmailPwd = ref(false)
const showCurrentPwd = ref(false)
const showNewPwd = ref(false)
const showConfirmPwd = ref(false)

const USERS_JSON_URL = '/data/users.json'
const PRESTATAIRES_JSON_URL = '/data/prestataires.json'
const LOCAL_USERS_KEY = 'customUsers'
const LOCAL_PRESTATAIRES_KEY = 'customPrestataires'
const RESERVATIONS_KEY = 'userReservations'

const reservations = ref([])
const reservationsLoading = ref(false)
const reservationsError = ref('')
const deletingReservations = ref(false)
const selectedReservationIds = ref([])

const prestataireNom = ref('')
const prestataireInfo = ref(null)
const prestataireForm = ref({
  description: '',
  email: '',
  tel: '',
  site: ''
})
const loadingPrestataire = ref(false)
const prestataireError = ref('')
const prestataireSuccess = ref('')

const loadCurrentUser = () => {
  try {
    const raw = localStorage.getItem('authUser')
    if (raw) {
      const auth = JSON.parse(raw)
      currentUserEmail.value = auth.email || ''
      currentUserRole.value = auth.role || 'user'
      prestataireNom.value = auth.prestataireNom || ''
    }
  } catch (e) {
    currentUserEmail.value = ''
  }
}

const loadPrestataireInfo = async () => {
  if (currentUserRole.value !== 'prestataire' || !prestataireNom.value) {
    prestataireInfo.value = null
    return
  }
  try {
    // Charger depuis localStorage d'abord (modifications locales)
    const customRaw = localStorage.getItem(LOCAL_PRESTATAIRES_KEY)
    let customPrestataires = null
    if (customRaw) {
      try {
        customPrestataires = JSON.parse(customRaw)
      } catch (e) {
        // ignore
      }
    }

    // Charger depuis le fichier JSON
    const resp = await fetch(PRESTATAIRES_JSON_URL, { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    const prestataires = data.prestataires || []
    
    // Trouver le prestataire
    let prestataire = prestataires.find(p => p.nom === prestataireNom.value)
    
    // Si des modifications locales existent, les appliquer
    if (customPrestataires && customPrestataires[prestataireNom.value]) {
      prestataire = { ...prestataire, ...customPrestataires[prestataireNom.value] }
    }

    if (prestataire) {
      prestataireInfo.value = prestataire
      prestataireForm.value = {
        description: prestataire.description || '',
        email: prestataire.email || '',
        tel: prestataire.tel || '',
        site: prestataire.site || ''
      }
    }
  } catch (e) {
    prestataireInfo.value = null
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
    reservationsError.value = t('profile.loadError') || t('mesReservations.loadError')
  } finally {
    reservationsLoading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const resp = await fetch(USERS_JSON_URL, { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    return Array.isArray(data) ? data : []
  } catch (e) {
    return []
  }
}

const readCustomUsers = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

const saveCustomUsers = (users) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

const persistAuthUser = (user) => {
  const payload = {
    email: user.email,
    role: user.role || 'user',
    prestataireNom: user.prestataireNom || prestataireNom.value || null,
    ts: Date.now()
  }
  localStorage.setItem('authUser', JSON.stringify(payload))
  window.dispatchEvent(new Event('auth-changed'))
}

const validateEmail = (value) => /\S+@\S+\.\S+/.test(value)

onMounted(async () => {
  loadCurrentUser()
  if (!currentUserEmail.value) {
    router.push('/login')
  } else {
    if (currentUserRole.value === 'user') {
      loadReservations()
    } else if (currentUserRole.value === 'prestataire') {
      await loadPrestataireInfo()
    }
  }
})

const onUpdatePrestataire = async () => {
  prestataireError.value = ''
  prestataireSuccess.value = ''

  if (!prestataireInfo.value || !prestataireNom.value) {
    prestataireError.value = 'Informations prestataire introuvables.'
    return
  }

  if (!validateEmail(prestataireForm.value.email)) {
    prestataireError.value = 'Adresse email invalide.'
    return
  }

  loadingPrestataire.value = true
  try {
    // Charger les modifications existantes
    const customRaw = localStorage.getItem(LOCAL_PRESTATAIRES_KEY)
    let customPrestataires = {}
    if (customRaw) {
      try {
        customPrestataires = JSON.parse(customRaw)
      } catch (e) {
        // ignore
      }
    }

    // Mettre à jour les informations du prestataire
    customPrestataires[prestataireNom.value] = {
      description: prestataireForm.value.description,
      email: prestataireForm.value.email,
      tel: prestataireForm.value.tel,
      site: prestataireForm.value.site
    }

    // Sauvegarder dans localStorage
    localStorage.setItem(LOCAL_PRESTATAIRES_KEY, JSON.stringify(customPrestataires))

    // Mettre à jour l'objet prestataireInfo pour l'affichage
    prestataireInfo.value = {
      ...prestataireInfo.value,
      ...customPrestataires[prestataireNom.value]
    }

    prestataireSuccess.value = 'Informations modifiées avec succès !'
    
    // Notifier App.vue pour mettre à jour l'affichage
    window.dispatchEvent(new Event('prestataire-updated'))
  } catch (e) {
    prestataireError.value = 'Impossible de modifier les informations pour le moment.'
  } finally {
    loadingPrestataire.value = false
  }
}

const onUpdateEmail = async () => {
  emailError.value = ''
  emailSuccess.value = ''

  if (!emailPassword.value) {
    emailError.value = 'Veuillez saisir votre mot de passe.'
    return
  }

  if (!newEmail.value) {
    emailError.value = 'Veuillez saisir un nouvel email.'
    return
  }

  if (!validateEmail(newEmail.value)) {
    emailError.value = 'Adresse email invalide.'
    return
  }

  if (newEmail.value.toLowerCase() === currentUserEmail.value.toLowerCase()) {
    emailError.value = 'Le nouvel email doit être différent de l\'email actuel.'
    return
  }

  loadingEmail.value = true
  try {
    const previousEmail = currentUserEmail.value
    const [baseUsers, customUsers] = await Promise.all([
      fetchUsers(),
      Promise.resolve(readCustomUsers())
    ])
    const allUsers = [...customUsers, ...baseUsers]
    const lowerNewEmail = newEmail.value.toLowerCase()
    
    // Vérifier si le nouvel email existe déjà
    const emailExists = allUsers.some(
      (u) => (u.email || '').toLowerCase() === lowerNewEmail
    )
    if (emailExists) {
      emailError.value = 'Un compte existe déjà avec cet email.'
      return
    }

    // Trouver l'utilisateur actuel et vérifier le mot de passe
    const currentUser = allUsers.find(
      (u) =>
        (u.email || '').toLowerCase() === currentUserEmail.value.toLowerCase() &&
        u.password === emailPassword.value
    )

    if (!currentUser) {
      emailError.value = 'Mot de passe incorrect.'
      return
    }

    // Mettre à jour l'email dans customUsers si c'est un utilisateur personnalisé
    const customUserIndex = customUsers.findIndex(
      (u) => (u.email || '').toLowerCase() === currentUserEmail.value.toLowerCase()
    )

    if (customUserIndex !== -1) {
      customUsers[customUserIndex].email = newEmail.value
      saveCustomUsers(customUsers)
    } else {
      // Si c'est un utilisateur de base, créer une entrée dans customUsers
      const updatedUser = {
        ...currentUser,
        email: newEmail.value
      }
      customUsers.push(updatedUser)
      saveCustomUsers(customUsers)
    }

    // Mettre à jour l'auth
    persistAuthUser({ ...currentUser, email: newEmail.value })

    // Mettre à jour l'email actuel et les réservations associées
    try {
      const raw = localStorage.getItem(RESERVATIONS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const prevLower = (previousEmail || '').toLowerCase()
          const updatedReservations = parsed.map((r) => {
            if ((r.userEmail || '').toLowerCase() === prevLower) {
              return { ...r, userEmail: newEmail.value }
            }
            return r
          })
          localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updatedReservations))
        }
      }
    } catch (e) {
      // Ignorer les erreurs de migration des réservations
    }

    currentUserEmail.value = newEmail.value
    newEmail.value = ''
    emailPassword.value = ''
    emailSuccess.value = 'Email modifié avec succès !'
    loadReservations()
  } catch (e) {
    emailError.value = 'Impossible de modifier l\'email pour le moment.'
  } finally {
    loadingEmail.value = false
  }
}

const onUpdatePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (!currentPassword.value || !newPassword.value || !confirmNewPassword.value) {
    passwordError.value = 'Veuillez remplir tous les champs.'
    return
  }

  if (newPassword.value.length < 6 || !/[0-9]/.test(newPassword.value)) {
    passwordError.value = 'Le mot de passe doit contenir 6 caractères et un chiffre.'
    return
  }

  if (newPassword.value !== confirmNewPassword.value) {
    passwordError.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  loadingPassword.value = true
  try {
    const [baseUsers, customUsers] = await Promise.all([
      fetchUsers(),
      Promise.resolve(readCustomUsers())
    ])
    const allUsers = [...customUsers, ...baseUsers]
    
    // Trouver l'utilisateur actuel et vérifier le mot de passe actuel
    const currentUser = allUsers.find(
      (u) =>
        (u.email || '').toLowerCase() === currentUserEmail.value.toLowerCase() &&
        u.password === currentPassword.value
    )

    if (!currentUser) {
      passwordError.value = 'Mot de passe actuel incorrect.'
      return
    }

    // Mettre à jour le mot de passe dans customUsers si c'est un utilisateur personnalisé
    const customUserIndex = customUsers.findIndex(
      (u) => (u.email || '').toLowerCase() === currentUserEmail.value.toLowerCase()
    )

    if (customUserIndex !== -1) {
      customUsers[customUserIndex].password = newPassword.value
      saveCustomUsers(customUsers)
    } else {
      // Si c'est un utilisateur de base, créer une entrée dans customUsers
      const updatedUser = {
        ...currentUser,
        password: newPassword.value
      }
      customUsers.push(updatedUser)
      saveCustomUsers(customUsers)
    }

    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    passwordSuccess.value = 'Mot de passe modifié avec succès !'
  } catch (e) {
    passwordError.value = 'Impossible de modifier le mot de passe pour le moment.'
  } finally {
    loadingPassword.value = false
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
  if (resa.createdAt) {
    try {
      const date = new Date(resa.createdAt)
      parts.push(
        `le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })}`
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
    reservations.value = reservations.value.filter((r) => !idsToDelete.has(r.id))
    selectedReservationIds.value = []
  } catch (e) {
    reservationsError.value = t('profile.deleteError')
  } finally {
    deletingReservations.value = false
  }
}
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(252,220,30,0.08), transparent 60%),
    radial-gradient(900px 500px at 110% 110%, rgba(32,70,179,0.18), transparent 60%),
    linear-gradient(180deg, #0b122a 0%, #07103a 100%);
  color: #fff;
}

.profile-card {
  width: 100%;
  max-width: 600px;
  background: rgba(255,255,255,0.05);
  padding: 30px 28px 24px;
  border-radius: 16px;
  border: 1px solid rgba(252,220,30,0.15);
  box-shadow:
    0 12px 28px rgba(2,6,23,0.55),
    inset 0 1px 0 rgba(255,255,255,0.06);
  backdrop-filter: blur(8px);
}

.profile-card h2 {
  margin-bottom: 6px;
  color: #FCDC1E;
  font-size: 1.7rem;
  text-align: center;
  letter-spacing: 0.5px;
}

.subtitle {
  text-align: center;
  color: rgba(255,255,255,0.85);
  font-size: 0.95rem;
  margin-bottom: 24px;
}

.profile-section {
  margin-bottom: 32px;
}

.profile-section h3 {
  color: #FCDC1E;
  font-size: 1.2rem;
  margin-bottom: 16px;
  font-weight: 600;
}

.section-divider {
  height: 1px;
  background: rgba(252,220,30,0.2);
  margin: 32px 0;
}

.input-group {
  position: relative;
  margin-top: 14px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
  color: rgba(255,255,255,0.9);
}

.input-icon {
  position: absolute;
  top: 40px;
  left: 12px;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #FCDC1E;
  pointer-events: none;
}

input[type="email"],
input[type="password"],
input[type="text"],
input[type="number"],
input[type="tel"],
input[type="url"],
textarea,
.input-group input {
  width: 100%;
  padding: 12px 44px 12px 42px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.04);
  color: #fff;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
  font-family: inherit;
}

textarea {
  padding: 12px;
  resize: vertical;
  min-height: 100px;
}

.input-disabled {
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.5);
  cursor: not-allowed;
}

.input-group input:focus:not(.input-disabled) {
  border-color: rgba(252,220,30,0.7);
  box-shadow: 0 0 0 3px rgba(252,220,30,0.25);
  background: rgba(255,255,255,0.06);
}

.toggle-pwd {
  position: absolute;
  top: 36px;
  right: 10px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  color: #d9d9d9;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background .12s ease, color .12s ease, transform .12s ease;
}

.toggle-pwd:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
  transform: translateY(-1px);
}

.password-hints {
  list-style: none;
  margin: 12px 0;
  padding: 0;
  font-size: 0.85rem;
}

.password-hints li {
  color: rgba(255,255,255,0.6);
  margin: 4px 0;
  transition: color 0.2s;
}

.password-hints li.ok {
  color: #4caf50;
}

.btn-primary {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 800;
  border: 1px solid rgba(0,0,0,0.05);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(252,220,30,0.28);
  transition: transform .12s ease, box-shadow .12s ease, filter .12s ease;
  width: 100%;
  margin-top: 16px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(252,220,30,0.35);
  filter: saturate(1.05);
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: default;
}

.actions {
  margin-top: 24px;
  text-align: center;
}

.btn-secondary {
  color: #fff;
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.14);
  font-weight: 700;
  transition: background .12s ease, color .12s ease, border-color .12s ease;
  display: inline-block;
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.10);
  border-color: rgba(255,255,255,0.24);
}

.error {
  margin-top: 16px;
  color: #3b0d0d;
  background: linear-gradient(180deg, rgba(255,155,155,0.16), rgba(255,155,155,0.10));
  border: 1px solid rgba(255,120,120,0.35);
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
}

.success {
  margin-top: 16px;
  color: #1b5e20;
  background: linear-gradient(180deg, rgba(155,255,155,0.16), rgba(155,255,155,0.10));
  border: 1px solid rgba(120,255,120,0.35);
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
}

@media (max-width: 420px) {
  .profile-card {
    padding: 24px 18px 18px;
  }
}
</style>

