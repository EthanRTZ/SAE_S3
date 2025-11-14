<script setup>
import { ref } from 'vue'
import logoIcon from '../media/logo-icon.png'

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
        <router-link to="/programmation" class="nav-link-mobile" @click="toggleMenu">Programmation</router-link>
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
</style>
