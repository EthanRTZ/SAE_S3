<template>
  <div class="register-page">
    <div class="register-card">
      <h2>Créer un compte</h2>
      <p class="subtitle">Accédez à la billetterie en quelques secondes</p>
      <form @submit.prevent="onSubmit">
        <div class="input-group">
          <label for="email">Email</label>
          <span class="input-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" stroke="#FCDC1E" stroke-width="1.6" />
              <path d="M4 7l8 6 8-6" stroke="#FCDC1E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <input id="email" type="email" v-model.trim="email" required />
        </div>

        <div class="input-group">
          <label for="password">Mot de passe</label>
          <span class="input-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="#FCDC1E" stroke-width="1.6"/>
              <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#FCDC1E" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </span>
          <input
            id="password"
            :type="showPwd ? 'text' : 'password'"
            v-model="password"
            required
            minlength="6"
          />
          <button
            type="button"
            class="toggle-pwd"
            @click="showPwd = !showPwd"
            :aria-pressed="showPwd"
            :title="showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
          >
            <svg v-if="!showPwd" width="18" height="18" viewBox="0 0 24 24" fill="none">
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
          <label for="confirmPassword">Confirmation du mot de passe</label>
          <span class="input-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12a7 7 0 0 1 14 0v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6Z" stroke="#FCDC1E" stroke-width="1.6"/>
              <path d="M10 15h4" stroke="#FCDC1E" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </span>
          <input
            id="confirmPassword"
            :type="showConfirmPwd ? 'text' : 'password'"
            v-model="confirmPassword"
            required
            minlength="6"
          />
          <button
            type="button"
            class="toggle-pwd"
            @click="showConfirmPwd = !showConfirmPwd"
            :aria-pressed="showConfirmPwd"
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
          <li :class="{ ok: password.length >= 6 }">6 caractères minimum</li>
          <li :class="{ ok: /[0-9]/.test(password) }">Au moins un chiffre</li>
        </ul>

        <div class="actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Création...' : "S'inscrire" }}
          </button>
          <router-link to="/login" class="btn-secondary">Déjà un compte ?</router-link>
        </div>

        <p class="helper">
          Besoin d'aide ? <a href="mailto:contact@goldencoast.fr" class="link-inline">Contactez-nous</a>
        </p>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const showPwd = ref(false)
const showConfirmPwd = ref(false)
const router = useRouter()

const USERS_JSON_URL = '/data/users.json'
const LOCAL_USERS_KEY = 'customUsers'

const fetchUsers = async () => {
  try {
    const resp = await fetch(USERS_JSON_URL, { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    return Array.isArray(data) ? data : []
  } catch (e) {
    return [{ email: 'test@example.com', password: 'secret123', role: 'user' }]
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
    ts: Date.now()
  }
  localStorage.setItem('authUser', JSON.stringify(payload))
  window.dispatchEvent(new Event('auth-changed'))
}

const validateEmail = (value) => /\S+@\S+\.\S+/.test(value)

const onSubmit = async () => {
  error.value = ''
  success.value = ''

  if (!email.value || !password.value || !confirmPassword.value) {
    error.value = 'Veuillez remplir tous les champs.'
    return
  }

  if (!validateEmail(email.value)) {
    error.value = 'Adresse email invalide.'
    return
  }

  if (password.value.length < 6 || !/[0-9]/.test(password.value)) {
    error.value = 'Le mot de passe doit contenir 6 caractères et un chiffre.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  loading.value = true
  try {
    const [baseUsers, customUsers] = await Promise.all([
      fetchUsers(),
      Promise.resolve(readCustomUsers())
    ])
    const lowerEmail = email.value.toLowerCase()
    const exists = [...customUsers, ...baseUsers].some(
      (u) => (u.email || '').toLowerCase() === lowerEmail
    )
    if (exists) {
      error.value = 'Un compte existe déjà avec cet email.'
      return
    }

    const newUser = {
      email: email.value,
      password: password.value,
      role: 'user'
    }
    const updatedCustom = [...customUsers, newUser]
    saveCustomUsers(updatedCustom)

    persistAuthUser(newUser)
    success.value = 'Compte créé avec succès ! Redirection...'
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (e) {
    error.value = "Impossible de créer le compte pour le moment."
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
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

.register-card {
  width: 100%;
  max-width: 480px;
  background: rgba(255,255,255,0.05);
  padding: 30px 28px 24px;
  border-radius: 16px;
  border: 1px solid rgba(252,220,30,0.15);
  box-shadow:
    0 12px 28px rgba(2,6,23,0.55),
    inset 0 1px 0 rgba(255,255,255,0.06);
  backdrop-filter: blur(8px);
}

.register-card h2 {
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
  margin-bottom: 12px;
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

.input-group input {
  width: 100%;
  padding: 12px 44px 12px 42px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.04);
  color: #fff;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}

.input-group input:focus {
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
  margin-top: 16px;
  padding-left: 0;
  color: rgba(255,255,255,0.75);
  font-size: 0.9rem;
  display: grid;
  gap: 6px;
}

.password-hints li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.password-hints li::before {
  content: '•';
  color: rgba(252,220,30,0.6);
}

.password-hints li.ok {
  color: #B1FF7A;
}

.password-hints li.ok::before {
  content: '✔';
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  align-items: center;
  justify-content: space-between;
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

.btn-secondary {
  color: #fff;
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.14);
  font-weight: 700;
  transition: background .12s ease, color .12s ease, border-color .12s ease;
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.10);
  border-color: rgba(255,255,255,0.24);
}

.helper {
  margin-top: 16px;
  text-align: center;
  font-size: 0.95rem;
  color: rgba(255,255,255,0.85);
}

.link-inline {
  color: #FCDC1E;
  font-weight: 700;
  text-decoration: underline;
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
  color: #093d09;
  background: linear-gradient(180deg, rgba(177,255,122,0.18), rgba(177,255,122,0.08));
  border: 1px solid rgba(177,255,122,0.35);
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
}

@media (max-width: 420px) {
  .register-card {
    padding: 24px 18px 18px;
  }
  .actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .btn-secondary {
    text-align: center;
  }
}
</style>

