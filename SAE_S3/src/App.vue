<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <div id="app">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo">
          <h2>Golden Coast</h2>
        </div>
        
        <!-- Desktop Menu -->
        <div class="nav-menu">
          <router-link to="/" class="nav-link">Accueil</router-link>
          <router-link to="/information" class="nav-link">Information</router-link>
          <router-link to="/prestataire" class="nav-link">Prestataire</router-link>
          <router-link to="/carte" class="nav-link">Carte</router-link>
          <router-link to="/reservation" class="nav-link">Réservation</router-link>
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
        <router-link to="/" class="nav-link-mobile" @click="toggleMenu">Accueil</router-link>
        <router-link to="/information" class="nav-link-mobile" @click="toggleMenu">Information</router-link>
        <router-link to="/prestataire" class="nav-link-mobile" @click="toggleMenu">Prestataire</router-link>
        <router-link to="/carte" class="nav-link-mobile" @click="toggleMenu">Carte</router-link>
        <router-link to="/reservation" class="nav-link-mobile" @click="toggleMenu">Réservation</router-link>
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
  box-shadow: 0 2px 16px rgba(32, 70, 179, 0.08);
  backdrop-filter: blur(8px);
}

.nav-container {
  width: 100%;
  margin: 0;
  display: flex;
  align-items: center;
  height: 64px;
}

.nav-logo {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: 24px;
}

  .nav-logo h2 {
  color: #FCDC1E;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-shadow: 0 2px 12px #2046b3;
  transition: transform 0.3s, text-shadow 0.3s;
  cursor: pointer;
}
.nav-logo h2:hover {
  transform: scale(1.07);
  text-shadow: 0 4px 24px #FCDC1E, 0 0 8px #2046b3;
}

.nav-menu {
  display: flex;
  gap: 24px;
  margin-left: 480px;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  padding: 9px 22px;
  border-radius: 24px;
  border: 2px solid transparent;
  background: none;
  transition:
    color 0.2s,
    background 0.2s,
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #2046b3;
  background: #FCDC1E;
  border-color: #FCDC1E;
  box-shadow: 0 4px 16px #FCDC1E44;
  transform: translateY(-2px) scale(1.06);
}

.nav-link.router-link-active {
  font-weight: 800;
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
  transition: background 0.2s, border-color 0.2s;
}
.nav-toggle:hover {
  background: #FCDC1E22;
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

/* Main Content */
main {
  margin-top: 64px;
  min-height: calc(100vh - 64px);
  background: transparent;
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
  }
  
  .nav-logo h2 {
    font-size: 1.4rem;
  }
}
</style>
