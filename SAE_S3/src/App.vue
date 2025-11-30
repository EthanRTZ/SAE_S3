x<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import logoIcon from '../public/media/logo-icon.png'

const isMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const authUser = ref(null)

const loadAuthFromStorage = () => {
  try {
    const raw = localStorage.getItem('authUser')
    authUser.value = raw ? JSON.parse(raw) : null
  } catch (e) {
    authUser.value = null
  }
}

const isAuthenticated = computed(() => !!authUser.value)
const userEmail = computed(() => authUser.value?.email || '')

const handleAuthChanged = () => {
  loadAuthFromStorage()
}

const handleClickOutside = (e) => {
  if (isUserMenuOpen.value && !e.target.closest('.auth-desktop') && !e.target.closest('.auth-mobile')) {
    closeUserMenu()
  }
}

onMounted(() => {
  loadAuthFromStorage()
  window.addEventListener('storage', handleAuthChanged)
  window.addEventListener('auth-changed', handleAuthChanged)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleAuthChanged)
  window.removeEventListener('auth-changed', handleAuthChanged)
  document.removeEventListener('click', handleClickOutside)
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  if (isMenuOpen.value) {
    isUserMenuOpen.value = false
  }
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const logout = () => {
  try {
    localStorage.removeItem('authUser')
  } catch (e) {
    // ignore
  }
  authUser.value = null
  isUserMenuOpen.value = false
  window.dispatchEvent(new Event('auth-changed'))
}
</script>

<template>
  <div id="app">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo">
          <router-link to="/" class="nav-logo-link" aria-label="Accueil">
            <img :src="logoIcon" alt="Golden Coast" class="logo-icon" />
          </router-link>
        </div>
        
        <!-- Desktop Menu -->
        <div class="nav-menu">
          <router-link to="/" class="nav-link">Accueil</router-link>
          <router-link to="/programmation" class="nav-link">Programmation</router-link>
          <router-link to="/prestataire" class="nav-link">Prestataire</router-link>
          <router-link to="/carte" class="nav-link">Carte</router-link>
          <router-link to="/reservation" class="nav-link">Réservation</router-link>

          <!-- Zone connexion / utilisateur (desktop) -->
          <div v-if="!isAuthenticated" class="guest-actions">
            <router-link
              to="/login"
              class="login-btn"
            >
              Connexion
            </router-link>
            <router-link
              to="/register"
              class="signup-btn"
            >
              Créer un compte
            </router-link>
          </div>
          <div v-else class="auth-desktop">
            <button type="button" class="auth-email-btn" @click="toggleUserMenu">
              {{ userEmail }}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="dropdown-icon" :class="{ rotated: isUserMenuOpen }">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div v-if="isUserMenuOpen" class="user-dropdown">
              <router-link to="/profile" class="user-profile-link" @click="closeUserMenu">
                <div class="user-profile">
                  <div class="user-avatar">{{ userEmail.charAt(0).toUpperCase() }}</div>
                  <div class="user-info">
                    <div class="user-email">{{ userEmail }}</div>
                    <div class="user-role">Utilisateur</div>
                  </div>
                </div>
              </router-link>
              <div class="dropdown-divider"></div>
              <button type="button" class="dropdown-item logout-item" @click="logout">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
        
        <!-- Mobile Menu Button -->
        <div class="nav-toggle" @click="toggleMenu">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </div>
      </div>
      
        <!-- Mobile Menu -->
        <div class="nav-menu-mobile" :class="{ active: isMenuOpen }">
        <router-link to="/" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); }">Accueil</router-link>
        <router-link to="/programmation" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); }">Programmation</router-link>
        <router-link to="/prestataire" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); }">Prestataire</router-link>
        <router-link to="/carte" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); }">Carte</router-link>
        <router-link to="/reservation" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); }">Réservation</router-link>

        <!-- Zone connexion / utilisateur (mobile) -->
        <div v-if="!isAuthenticated" class="guest-actions-mobile">
          <router-link
            to="/login"
            class="login-btn-mobile"
            @click="() => { toggleMenu(); closeUserMenu(); }"
          >
            Connexion
          </router-link>
          <router-link
            to="/register"
            class="signup-btn-mobile"
            @click="() => { toggleMenu(); closeUserMenu(); }"
          >
            Créer un compte
          </router-link>
        </div>
        <div v-else class="auth-mobile">
          <button type="button" class="auth-email-btn-mobile" @click="toggleUserMenu">
            {{ userEmail }}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="dropdown-icon" :class="{ rotated: isUserMenuOpen }">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-if="isUserMenuOpen" class="user-dropdown-mobile">
            <router-link to="/profile" class="user-profile-link" @click="() => { closeUserMenu(); toggleMenu(); }">
              <div class="user-profile">
                <div class="user-avatar">{{ userEmail.charAt(0).toUpperCase() }}</div>
                <div class="user-info">
                  <div class="user-email">{{ userEmail }}</div>
                  <div class="user-role">Utilisateur</div>
                </div>
              </div>
            </router-link>
            <div class="dropdown-divider"></div>
            <button
              type="button"
              class="dropdown-item logout-item"
              @click="() => { logout(); toggleMenu(); }"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Main Content -->
    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}

/* Navigation Styles */
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  background: #2046b3ee;
  z-index: 1000;
  border-bottom: 2px solid #FCDC1E;
  box-shadow: 0 2px 16px rgba(32, 70, 179, 0.06); /* plus subtil */
  backdrop-filter: blur(6px);
}

.nav-container {
  width: 100%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between; /* logo à gauche, menu à droite */
  height: 64px;
  padding: 0 12px; /* colle le contenu aux bords */
}

.nav-logo {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: 8px; /* logo plus à gauche */
}

/* Nouvel affichage du logo en image */
.logo-icon {
  height: 44px; /* ajuster si besoin */
  width: auto;
  display: block;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease;
  -webkit-user-drag: none;
  margin-right: 6px;
}
.logo-icon:hover {
  transform: translateY(-1px); /* très discret */
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.06));
}

.nav-menu {
  display: flex;
  gap: 18px;
  margin-left: auto; /* pousse les boutons complètement à droite */
  align-items: center;
  padding-right: 8px; /* laisse un peu d'espace du bord */
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.05rem;
  padding: 8px 16px;
  border-radius: 14px;
  border: 2px solid transparent;
  background: transparent;
  transition:
    color 0.12s ease,
    background-color 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;
}

/* style épuré : suppression du scale/fondu prononcé */
.nav-link:hover,
.nav-link.router-link-active {
  color: #2046b3;
  background: #FCDC1E;
  border-color: #FCDC1E;
  box-shadow: 0 6px 12px rgba(252,220,30,0.10); /* subtil */
  transform: none; /* pas de scale */
}

.nav-link.router-link-active {
  font-weight: 700;
}

/* Mobile Menu */
.nav-toggle {
  display: none;
  flex-direction: column;
  cursor: pointer;
  padding: 7px;
  border-radius: 8px;
  background: none;
  border: 2px solid #FCDC1E;
  transition: background 0.12s, border-color 0.12s;
}
.nav-toggle:hover {
  background: rgba(252,220,30,0.12);
  border-color: #FCDC1E;
}

.bar {
  width: 25px;
  height: 3px;
  background: #FCDC1E;
  margin: 3px 0;
  border-radius: 2px;
  transition: 0.2s;
}

.nav-menu-mobile {
  display: none;
  flex-direction: column;
  background: #2046b3ee;
  padding: 20px;
  position: absolute;
  top: 64px;
  left: 0;
  width: 100%;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  border-top: 2px solid #FCDC1E;
  transform: translateY(-100%);
  opacity: 0;
  transition: all 0.3s;
}

.nav-menu-mobile.active {
  transform: translateY(0);
  opacity: 1;
}

.nav-link-mobile {
  color: #fff;
  text-decoration: none;
  padding: 15px 0;
  font-size: 1.15rem;
  border-bottom: 1px solid rgba(252, 220, 30, 0.18);
  border-radius: 12px;
  background: none;
  border: 2px solid transparent;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
  font-weight: 600;
}
.nav-link-mobile:hover,
.nav-link-mobile.router-link-active {
  color: #2046b3;
  background: #FCDC1E;
  border-color: #FCDC1E;
  font-weight: 800;
}

/* Reset / style du lien autour du logo */
.nav-logo .nav-logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  padding: 0;
}
.nav-logo .nav-logo-link:focus {
  outline: 2px solid rgba(252,220,30,0.95);
  outline-offset: 4px;
  border-radius: 6px;
}

/* Main Content */
main {
  padding-top: 64px; /* Ajoute un espace sous la navbar pour éviter que le contenu soit masqué */
  min-height: 100vh;
  background: transparent;
  /* Si tu préfères que le contenu commence sous la navbar (sans "décaler" le layout),
     remplace margin-top par : padding-top: 64px; */
}

/* Responsive Design */
@media screen and (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .nav-toggle {
    display: flex;
  }
  
  .nav-menu-mobile {
    display: flex;
  }
  
  .nav-container {
    padding: 0 12px;
    justify-content: space-between;
  }
  
  .nav-logo h2 {
    font-size: 1.4rem;
  }
}

/* Styles pour le bouton Connexion (desktop) */
.guest-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.login-btn,
.signup-btn {
  display: inline-block;
  padding: 8px 12px;
  background: #FCDC1E;
  color: #2046b3;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;
  border: 2px solid transparent;
  margin-left: 8px; /* espace entre les liens et le bouton */
  transition: background 0.12s, transform 0.12s;
}
.login-btn:hover,
.signup-btn:hover {
  background: #fff176;
  transform: translateY(-1px);
}

.signup-btn {
  background: transparent;
  color: #ffffff;
  border: 2px solid rgba(255,255,255,0.45);
}

.signup-btn:hover {
  background: rgba(255,255,255,0.15);
  color: #2046b3;
}

/* Styles pour le bouton Connexion (mobile) */
.login-btn-mobile,
.signup-btn-mobile {
  display: block;
  width: 100%;
  text-align: center;
  padding: 12px 0;
  background: #FCDC1E;
  color: #2046b3;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  margin-top: 12px;
  border: 2px solid transparent;
}
.login-btn-mobile:hover,
.signup-btn-mobile:hover {
  background: #fff176;
}

.signup-btn-mobile {
  background: transparent;
  color: #ffffff;
  border: 2px solid rgba(255,255,255,0.45);
  margin-top: 10px;
}

.signup-btn-mobile:hover {
  background: rgba(255,255,255,0.15);
}

/* Assure que le bouton desktop reste visible dans la nav-menu */
.nav-menu .login-btn {
  align-self: center;
}

.guest-actions-mobile {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

/* Zone auth desktop */
.auth-desktop {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
}

.auth-email-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.05);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.auth-email-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.3);
}

.dropdown-icon {
  transition: transform 0.2s ease;
  color: #FCDC1E;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 240px;
  background: rgba(255,255,255,0.98);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  border: 1px solid rgba(252,220,30,0.3);
  overflow: hidden;
  z-index: 1001;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-profile-link {
  text-decoration: none;
  display: block;
  transition: background 0.12s ease;
}

.user-profile-link:hover {
  background: rgba(32,70,179,0.05);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(32,70,179,0.1) 0%, rgba(252,220,30,0.1) 100%);
  transition: background 0.12s ease;
}

.user-profile-link:hover .user-profile {
  background: linear-gradient(135deg, rgba(32,70,179,0.15) 0%, rgba(252,220,30,0.15) 100%);
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2046b3 0%, #FCDC1E 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-email {
  color: #2046b3;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 2px;
  word-break: break-word;
}

.user-role {
  color: rgba(32,70,179,0.7);
  font-size: 0.85rem;
}

.dropdown-divider {
  height: 1px;
  background: rgba(32,70,179,0.1);
  margin: 8px 0;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #2046b3;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease;
}

.dropdown-item:hover {
  background: rgba(32,70,179,0.08);
}

.logout-item {
  color: #d32f2f;
}

.logout-item:hover {
  background: rgba(211,47,47,0.1);
}

/* Zone auth mobile */
.auth-mobile {
  position: relative;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-email-btn-mobile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.05);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.auth-email-btn-mobile:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.3);
}

.user-dropdown-mobile {
  width: 100%;
  background: rgba(255,255,255,0.98);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  border: 1px solid rgba(252,220,30,0.3);
  overflow: hidden;
  margin-top: 8px;
  animation: slideDown 0.2s ease;
}

.user-dropdown-mobile .user-profile-link {
  text-decoration: none;
  display: block;
  transition: background 0.12s ease;
}

.user-dropdown-mobile .user-profile-link:hover {
  background: rgba(32,70,179,0.05);
}

.user-dropdown-mobile .user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(32,70,179,0.1) 0%, rgba(252,220,30,0.1) 100%);
  transition: background 0.12s ease;
}

.user-dropdown-mobile .user-profile-link:hover .user-profile {
  background: linear-gradient(135deg, rgba(32,70,179,0.15) 0%, rgba(252,220,30,0.15) 100%);
}

.user-dropdown-mobile .user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2046b3 0%, #FCDC1E 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.user-dropdown-mobile .user-info {
  flex: 1;
  min-width: 0;
}

.user-dropdown-mobile .user-email {
  color: #2046b3;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 2px;
  word-break: break-word;
}

.user-dropdown-mobile .user-role {
  color: rgba(32,70,179,0.7);
  font-size: 0.85rem;
}

.user-dropdown-mobile .dropdown-divider {
  height: 1px;
  background: rgba(32,70,179,0.1);
  margin: 8px 0;
}

.user-dropdown-mobile .dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #2046b3;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease;
}

.user-dropdown-mobile .dropdown-item:hover {
  background: rgba(32,70,179,0.08);
}

.user-dropdown-mobile .logout-item {
  color: #d32f2f;
}

.user-dropdown-mobile .logout-item:hover {
  background: rgba(211,47,47,0.1);
}
</style>
