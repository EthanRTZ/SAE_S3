<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePanierStore } from '@/stores/panier'

const logoIcon = '/media/logo-icon.png'

const isMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const isPrestataireDropdownOpen = ref(false)
const authUser = ref(null)
const panierStore = usePanierStore()

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
const userRole = computed(() => authUser.value?.role || 'user')
const isUserRole = computed(() => userRole.value === 'user')
const prestataireNom = computed(() => authUser.value?.prestataireNom || '')
const prestataireInfo = ref(null)

const prestataireLink = computed(() => {
  if (isAuthenticated.value && userRole.value === 'prestataire') {
    return { name: 'prestataire-espace' }
  }
  return { name: 'prestataire' }
})

const isPrestataire = computed(() => userRole.value === 'prestataire')

const togglePrestataireDropdown = () => {
  isPrestataireDropdownOpen.value = !isPrestataireDropdownOpen.value
  if (isPrestataireDropdownOpen.value) {
    isUserMenuOpen.value = false
  }
}

const closePrestataireDropdown = () => {
  isPrestataireDropdownOpen.value = false
}

// CHANGED: Admins peuvent voir tous les liens pour naviguer facilement
const showProgrammationLinkInNav = computed(() => {
  return userRole.value !== 'prestataire'
})

const showReservationLinkInNav = computed(() => {
  return userRole.value !== 'prestataire'
})

const showPrestataireLink = computed(() => {
  return true // Admins peuvent voir la liste des prestataires
})

const showAccueilLink = computed(() => {
  return true // Admins peuvent voir l'accueil
})

const showAdminLink = computed(() => {
  return userRole.value === 'admin'
})

const loadPrestataireInfo = async () => {
  if (userRole.value !== 'prestataire' || !prestataireNom.value) {
    prestataireInfo.value = null
    return
  }
  try {
    // Charger les modifications locales
    const customRaw = localStorage.getItem('customPrestataires')
    let customPrestataires = null
    if (customRaw) {
      try {
        customPrestataires = JSON.parse(customRaw)
      } catch (e) {
        // ignore
      }
    }

    // Charger depuis le fichier JSON
    const resp = await fetch('/data/site.json', { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    const prestataires = data.prestataires || []
    let prestataire = prestataires.find(p => p.nom === prestataireNom.value) || null

    // Appliquer les modifications locales si elles existent
    if (prestataire && customPrestataires && customPrestataires[prestataireNom.value]) {
      prestataire = { ...prestataire, ...customPrestataires[prestataireNom.value] }
    }

    prestataireInfo.value = prestataire
  } catch (e) {
    prestataireInfo.value = null
  }
}

const handleAuthChanged = () => {
  loadAuthFromStorage()
  loadPrestataireInfo()
}

const handleClickOutside = (e) => {
  if (isUserMenuOpen.value && !e.target.closest('.auth-desktop') && !e.target.closest('.auth-mobile')) {
    closeUserMenu()
  }
  if (isPrestataireDropdownOpen.value && !e.target.closest('.prestataire-dropdown-wrapper')) {
    closePrestataireDropdown()
  }
}

onMounted(() => {
  loadAuthFromStorage()
  loadPrestataireInfo()
  window.addEventListener('storage', handleAuthChanged)
  window.addEventListener('auth-changed', handleAuthChanged)
  window.addEventListener('prestataire-updated', loadPrestataireInfo)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleAuthChanged)
  window.removeEventListener('auth-changed', handleAuthChanged)
  window.removeEventListener('prestataire-updated', loadPrestataireInfo)
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

  // Vider le panier lors de la déconnexion
  panierStore.clearPanier()

  window.dispatchEvent(new Event('auth-changed'))
}

// CHANGED: ajout d'un handler pour le clic "Laisser un avis"
const openFeedback = (e) => {
  // Empêche propagation si nécessaire
  if (e && e.preventDefault) e.preventDefault()
  // Déclenche un événement custom que tu pourras écouter ailleurs pour afficher un modal / route
  window.dispatchEvent(new Event('open-feedback'))
  // Log discret pour développement
  console.log('open-feedback event dispatched')
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
          <!-- CHANGED: liens conditionnels selon le rôle -->
          <router-link v-if="showAccueilLink" to="/" class="nav-link">Accueil</router-link>
          <router-link v-if="showProgrammationLinkInNav" to="/programmation" class="nav-link">Programmation</router-link>
          <!-- Menu déroulant Prestataire pour les prestataires connectés -->
          <div v-if="showPrestataireLink && isPrestataire" class="prestataire-dropdown-wrapper">
            <button 
              type="button"
              class="nav-link nav-link-dropdown"
              :class="{ 'dropdown-open': isPrestataireDropdownOpen }"
              @click="togglePrestataireDropdown"
            >
              Prestataire
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="dropdown-icon" :class="{ rotated: isPrestataireDropdownOpen }">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div v-if="isPrestataireDropdownOpen" class="prestataire-dropdown">
              <router-link to="/prestataire" class="dropdown-item" @click="closePrestataireDropdown">
                📋 Liste des prestataires
              </router-link>
              <router-link to="/prestataire-espace" class="dropdown-item" @click="closePrestataireDropdown">
                ⚙️ Mon espace prestataire
              </router-link>
            </div>
          </div>
          <!-- Lien simple pour les non-prestataires -->
          <router-link v-else-if="showPrestataireLink" :to="prestataireLink" class="nav-link">Prestataire</router-link>
          <!-- CHANGED: Carte toujours visible -->
          <router-link v-if="showAdminLink" to="/admin" class="nav-link">Admin</router-link>
          <router-link to="/carte" class="nav-link">Carte</router-link>
          <router-link v-if="showReservationLinkInNav" to="/reservation" class="nav-link">Réservation</router-link>

          <!-- Lien Panier avec badge -->
          <router-link to="/panier" class="nav-link nav-link-panier">
            Panier
            <span v-if="panierStore.itemCount > 0" class="panier-badge">{{ panierStore.itemCount }}</span>
          </router-link>

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
                  <div class="user-avatar">{{ prestataireInfo?.nom ? prestataireInfo.nom.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase() }}</div>
                  <div class="user-info">
                    <div class="user-email">{{ prestataireInfo?.nom || userEmail }}</div>
                    <div class="user-role">{{ userRole === 'user' ? 'Utilisateur' : userRole === 'prestataire' ? (prestataireInfo?.type || 'Prestataire') : userRole === 'admin' ? 'Administrateur' : 'Utilisateur' }}</div>
                  </div>
                </div>
              </router-link>
              <router-link v-if="isUserRole" to="/mes-reservations" class="dropdown-item" @click="closeUserMenu">
                Mes réservations
              </router-link>
              <div v-if="isUserRole" class="dropdown-divider"></div>
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
        <!-- CHANGED: liens conditionnels selon le rôle (mobile) -->
        <router-link v-if="showAccueilLink" to="/" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); closePrestataireDropdown(); }">Accueil</router-link>
        <router-link v-if="showProgrammationLinkInNav" to="/programmation" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); closePrestataireDropdown(); }">Programmation</router-link>
        <!-- Menu déroulant Prestataire pour les prestataires connectés (mobile) -->
        <div v-if="showPrestataireLink && isPrestataire" class="prestataire-dropdown-mobile">
          <button 
            type="button"
            class="nav-link-mobile nav-link-dropdown"
            :class="{ 'dropdown-open': isPrestataireDropdownOpen }"
            @click="togglePrestataireDropdown"
          >
            Prestataire
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="dropdown-icon" :class="{ rotated: isPrestataireDropdownOpen }">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-if="isPrestataireDropdownOpen" class="prestataire-dropdown-mobile-menu">
            <router-link to="/prestataire" class="dropdown-item" @click="() => { closePrestataireDropdown(); toggleMenu(); }">
              📋 Liste des prestataires
            </router-link>
            <router-link to="/prestataire-espace" class="dropdown-item" @click="() => { closePrestataireDropdown(); toggleMenu(); }">
              ⚙️ Mon espace prestataire
            </router-link>
          </div>
        </div>
        <!-- Lien simple pour les non-prestataires (mobile) -->
        <router-link v-else-if="showPrestataireLink" :to="prestataireLink" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); closePrestataireDropdown(); }">Prestataire</router-link>
        <!-- CHANGED: Carte toujours visible -->
        <router-link to="/carte" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); closePrestataireDropdown(); }">Carte</router-link>
        <router-link v-if="showReservationLinkInNav" to="/reservation" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); closePrestataireDropdown(); }">Réservation</router-link>

        <!-- Lien Panier mobile avec badge -->
        <router-link to="/panier" class="nav-link-mobile nav-link-panier-mobile" @click="() => { toggleMenu(); closeUserMenu(); closePrestataireDropdown(); }">
          🛒 Panier
          <span v-if="panierStore.itemCount > 0" class="panier-badge-mobile">{{ panierStore.itemCount }}</span>
        </router-link>

        <router-link v-if="showAdminLink" to="/admin" class="nav-link-mobile" @click="() => { toggleMenu(); closeUserMenu(); closePrestataireDropdown(); }">Admin</router-link>

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
                <div class="user-avatar">{{ prestataireInfo?.nom ? prestataireInfo.nom.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase() }}</div>
                <div class="user-info">
                  <div class="user-email">{{ prestataireInfo?.nom || userEmail }}</div>
                  <div class="user-role">{{ userRole === 'user' ? 'Utilisateur' : userRole === 'prestataire' ? (prestataireInfo?.type || 'Prestataire') : userRole === 'admin' ? 'Administrateur' : 'Utilisateur' }}</div>
                </div>
              </div>
            </router-link>
            <router-link
              v-if="isUserRole"
              to="/mes-reservations"
              class="dropdown-item"
              @click="() => { closeUserMenu(); toggleMenu(); }"
            >
              Mes réservations
            </router-link>
            <div v-if="isUserRole" class="dropdown-divider"></div>
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

    <!-- CHANGED: footer complet avec colonnes classiques -->
    <footer class="site-footer" role="contentinfo" aria-label="Pied de page">
      <div class="footer-top">
        <div class="footer-container">
          <div class="footer-column footer-brand">
            <router-link to="/" class="footer-logo" aria-label="Accueil">
              <img :src="logoIcon" alt="Golden Coast" class="logo-icon-footer" />
            </router-link>
            <p class="footer-desc">Golden Coast — Festival rap français • 28-30 août 2026 • Corcelles-les-Monts</p>
            <div class="footer-copy">© 2026 Golden Coast</div>
          </div>

          <nav class="footer-column footer-nav" aria-label="Liens principaux">
            <h4>Navigation</h4>
            <ul class="footer-links">
              <li><router-link to="/">Accueil</router-link></li>
              <li><router-link to="/programmation">Programmation</router-link></li>
              <li><router-link :to="prestataireLink">Prestataires</router-link></li>
              <li><router-link to="/carte">Carte</router-link></li>
              <li><router-link to="/reservation">Réservation</router-link></li>
            </ul>
          </nav>

          <div class="footer-column footer-support" aria-label="Support">
            <h4>Support</h4>
            <ul class="footer-links">
              <li><a href="mailto:contact@goldencoast.example" rel="noopener">Contact</a></li>
              <li><a href="#" rel="noopener">FAQ</a></li>
              <li><a href="#" rel="noopener">Aide billetterie</a></li>
            </ul>
            <button class="footer-feedback" @click.prevent="openFeedback" aria-label="Laisser un avis">Laisser un avis</button>
          </div>

          <div class="footer-column footer-legal" aria-label="Informations légales et réseaux">
            <h4>Légal & réseaux</h4>
            <ul class="footer-links">
              <li><a href="#" rel="noopener">Mentions légales</a></li>
              <li><a href="#" rel="noopener">Politique de confidentialité</a></li>
              <li><a href="#" rel="noopener">Conditions Générales</a></li>
            </ul>

            <div class="social-links" aria-label="Réseaux sociaux">
              <!-- Icônes simples textuelles ; remplace par tes URLs -->
              <a href="#" aria-label="Facebook" rel="noopener" class="social">Facebook</a>
              <a href="#" aria-label="Instagram" rel="noopener" class="social">Instagram</a>
              <a href="#" aria-label="Twitter" rel="noopener" class="social">X</a>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-container small">
          <div class="bottom-left">Site réalisé par Golden Coast</div>
          <div class="bottom-right">
            <a href="#" rel="noopener">Plan du site</a>
            <span class="sep">•</span>
            <a href="#" rel="noopener">Accessibilité</a>
          </div>
        </div>
      </div>
    </footer>
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

/* CHANGED: styles pour le footer étendu */
.site-footer {
  width: 100%;
  background: linear-gradient(90deg, rgba(32,70,179,0.95), rgba(6,18,50,0.95));
  color: #fff;
  border-top: 2px solid #FCDC1E;
  box-shadow: 0 -6px 24px rgba(0,0,0,0.12);
  padding: 24px 12px 8px;
  position: relative;
  z-index: 900;
  font-size: 0.95rem;
}

/* wrapper commun */
.footer-top {
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 28px;
  align-items: flex-start;
  justify-content: space-between;
}

/* variant small pour le bottom */
.footer-container.small {
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 0.9rem;
}

/* colonnes */
.footer-column {
  flex: 1;
  min-width: 180px;
}

/* marque */
.footer-brand .footer-logo {
  display: inline-block;
  margin-bottom: 10px;
}
.logo-icon-footer {
  height: 40px;
  width: auto;
  display: block;
}
.footer-desc {
  color: rgba(255,255,255,0.85);
  margin: 8px 0 12px;
  font-size: 0.92rem;
  line-height: 1.35;
}
.footer-copy {
  color: rgba(252,220,30,0.9);
  font-weight: 700;
}

/* titres colonnes */
.footer-column h4 {
  font-size: 1rem;
  color: #FCDC1E;
  margin-bottom: 10px;
  font-weight: 800;
}

/* liens */
.footer-links {
  list-style: none;
  padding: 0;
  margin: 0 0 10px;
}
.footer-links li { margin: 6px 0; }
.footer-links a,
.footer-links router-link {
  color: #ffffff;
  text-decoration: none;
  opacity: 0.95;
  transition: color 0.12s ease, opacity 0.12s ease;
}
.footer-links a:hover,
.footer-links router-link:hover {
  color: #FCDC1E;
  opacity: 1;
  text-decoration: underline;
}

/* bouton avis (réutilise style existant mais adapté) */
.footer-feedback {
  margin-top: 8px;
  display: inline-block;
  background: transparent;
  color: #FCDC1E;
  border: 2px solid rgba(252,220,30,0.25);
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, transform 0.12s ease;
}
.footer-feedback:hover {
  background: #FCDC1E;
  color: #0b1e55;
  transform: translateY(-2px);
}

/* réseaux sociaux */
.social-links {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.social {
  color: #fff;
  background: rgba(255,255,255,0.06);
  padding: 6px 10px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
}
.social:hover { background: rgba(252,220,30,0.12); color: #FCDC1E; }

/* footer bottom */
.footer-bottom { margin-top: 12px; }
.bottom-left { color: rgba(255,255,255,0.8); }
.bottom-right a { color: rgba(255,255,255,0.85); text-decoration: none; margin-left: 8px; }
.bottom-right a:hover { color: #FCDC1E; text-decoration: underline; }
.sep { margin: 0 8px; color: rgba(255,255,255,0.25); }

/* Responsive */
@media screen and (max-width: 900px) {
  .footer-container {
    flex-direction: column;
    gap: 18px;
    align-items: stretch;
  }
  .footer-column { min-width: auto; }
  .footer-container.small { flex-direction: column; gap: 6px; text-align: center; }
  .bottom-right { display: flex; gap: 8px; justify-content: center; }
}
</style>
