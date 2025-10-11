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
  background: rgba(13, 71, 161, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.nav-logo h2 {
  color: #ffd700;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.nav-menu {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #ffffff;
  text-decoration: none;
  font-weight: 500;
  font-size: 1.1rem;
  padding: 10px 15px;
  border-radius: 5px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  transform: translateY(-2px);
}

.nav-link.router-link-active {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.2);
}

/* Mobile Menu */
.nav-toggle {
  display: none;
  flex-direction: column;
  cursor: pointer;
  padding: 5px;
}

.bar {
  width: 25px;
  height: 3px;
  background: #ffd700;
  margin: 3px 0;
  transition: 0.3s;
  border-radius: 2px;
}

.nav-menu-mobile {
  display: none;
  flex-direction: column;
  background: rgba(13, 71, 161, 0.98);
  padding: 20px;
  position: absolute;
  top: 70px;
  left: 0;
  width: 100%;
  transform: translateY(-100%);
  opacity: 0;
  transition: all 0.3s ease;
}

.nav-menu-mobile.active {
  transform: translateY(0);
  opacity: 1;
}

.nav-link-mobile {
  color: #ffffff;
  text-decoration: none;
  padding: 15px 0;
  font-size: 1.2rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  transition: color 0.3s ease;
}

.nav-link-mobile:hover {
  color: #ffd700;
}

.nav-link-mobile.router-link-active {
  color: #ffd700;
}

/* Main Content */
main {
  margin-top: 70px;
  min-height: calc(100vh - 70px);
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
    padding: 0 15px;
  }
  
  .nav-logo h2 {
    font-size: 1.5rem;
  }
}
</style>
