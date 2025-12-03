<template>
  <div class="home">
    <!-- Hero Section avec Vidéo -->
    <div class="hero-section">
      <video autoplay muted loop playsinline class="hero-video">
        <source :src="normalizePublicPath('/media/fond.mp4')" type="video/mp4">
      </video>
      <div class="hero-content">
        <h1 class="hero-title">GOLDEN COAST FESTIVAL V3</h1>
        <p class="hero-date"><strong>28 - 29 - 30 août 2026</strong></p>
        <p class="hero-location"><strong>CORCELLES-LES-MONTS • DIJON</strong></p>
        <div class="hero-buttons">
          <router-link to="/reservation" class="btn-hero btn-primary">BILLETTERIE</router-link>
          <router-link to="/programmation" class="btn-hero btn-secondary">Programmation</router-link>
        </div>
      </div>
    </div>

    <!-- Bandeau Marquee -->
    <div class="marquee-section">
      <div class="marquee-track">
        <span
            class="marquee-item"
            v-for="n in 10"
            :key="'marquee-a-' + n"
        >
          GOLDEN COAST •
        </span>
        <span
            class="marquee-item"
            v-for="n in 10"
            :key="'marquee-b-' + n"
        >
          GOLDEN COAST •
        </span>
      </div>
    </div>

    <!-- Section Présentation -->
    <section class="about-section">
      <div class="about-container">
        <div class="about-content">
          <h2 class="section-title">LE FESTIVAL</h2>
          <div class="about-grid">
            <div class="about-card">
              <div class="card-icon">🎤</div>
              <h3>100% RAP FR</h3>
              <p>Le plus grand festival entièrement dédié au <strong>rap français</strong> avec les plus grandes têtes d'affiche et les talents émergents.</p>
            </div>
            <div class="about-card">
              <div class="card-icon">🌳</div>
              <h3>SITE NATUREL</h3>
              <p>Un cadre exceptionnel à la <strong>Combe à la Serpent</strong>, offrant une expérience unique en pleine nature près de Dijon.</p>
            </div>
            <div class="about-card">
              <div class="card-icon">👥</div>
              <h3>52 000 FESTIVALIERS</h3>
              <p>Une première édition couronnée de succès qui revient encore plus fort pour <strong>trois jours de culture urbaine</strong>.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="description-section">
      <div class="description-container two-col">
        <div class="description-left">
          <h2 class="description-title"><strong>Le rendez-vous des fans de rap</strong></h2>

          <p class="description-text">
            Plonge au cœur de l’expérience Golden Coast Festival, l’événement rap français qui transforme la fin de l’été en un moment d’exception.<br/><br/>
            Dans un cadre soigneusement scénographié, tu découvres des performances exclusives, un son trap &amp; boom bap d’une qualité studio, et des scènes immersives pensées pour sublimer chaque artiste.
          </p>

          <div class="description-highlights">
            <span class="highlight-chip"><strong>Les plus grandes stars du rap français</strong></span>
            <span class="highlight-chip"><strong>Boissons & street-food</strong></span>
          </div>
        </div>

        <div class="description-right">
          <!-- CHANGED: bind src via helper -->
          <img :src="normalizePublicPath('/media/description.png')" alt="Golden Coast Festival" class="description-image" />
        </div>
      </div>

      <div class="description-container two-col">
        <div class="description-right">
          <!-- CHANGED: bind src via helper -->
          <img :src="normalizePublicPath('/media/accueil2.jpeg')" alt="Ambiance Golden Coast" class="description-image" />
        </div>

        <div class="description-left">
          <h2 class="description-title"><strong>Une immersion totale</strong></h2>

          <p class="description-text">
            Entre shows lumineux haute intensité, espaces lifestyle, sélections fripes pointues, et street-food signature, chaque détail est conçu pour offrir une expérience fluide, raffinée et mémorable.<br/><br/>
            Les afters confidentiels, réservés à ceux qui veulent prolonger l’instant, ajoutent une touche rare et privilégiée. Le Golden Coast Festival, c’est plus qu’un rendez-vous : c’est l’événement premium où la culture rap se vit intensément, dans une ambiance exclusive, créative et résolument inoubliable.
          </p>
        </div>
      </div>
    </section>


    <!-- Section Artistes -->
    <section class="artists-section">
      <div class="artists-container">
        <h2 class="section-title">LA PROGRAMMATION</h2>
        <div class="carousel-wrapper">
          <div class="carousel-track">
            <!-- Première série d'artistes -->
            <div
                class="artist-card"
                v-for="artist in artists"
                :key="'first-' + artist.name"
            >
              <div class="artist-image-wrapper">
                <!-- CHANGED: bind src via helper -->
                <img :src="artist.img" :alt="artist.name" class="artist-image" />
                <div class="artist-overlay">
                  <span class="artist-name">{{ artist.name }}</span>
                </div>
              </div>
            </div>
            <!-- Duplication pour boucle infinie -->
            <div
                class="artist-card"
                v-for="artist in artists"
                :key="'second-' + artist.name"
            >
              <div class="artist-image-wrapper">
                <!-- CHANGED: bind src via helper -->
                <img :src="artist.img" :alt="artist.name" class="artist-image" />
                <div class="artist-overlay">
                  <span class="artist-name">{{ artist.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section Carte -->
    <section class="map-section">
      <div class="map-container">
        <h2 class="section-title">LOCALISATION</h2>
        <p class="map-intro">Retrouvez tous les points d'intérêt du festival : scènes, parkings, campings et plus encore.</p>
        <!-- pleine largeur avec cadre léger -->
        <div class="map-frame">
          <div class="map-inner">
            <!-- wrapper étendu: la carte + filtre remplissent les côtés -->
            <div class="map-content-wrapper">
               <CarteView embedded />
             </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section CTA -->
    <section class="cta-section">
      <div class="cta-container">
        <h2 class="cta-title"><strong>PRÊT À VIVRE L'EXPÉRIENCE ?</strong></h2>
        <p class="cta-text"><strong>Réservez tes billets dès maintenant</strong> et rejoignez-nous pour trois jours inoubliables !</p>
        <router-link to="/reservation" class="btn-cta">RÉSERVER MA PLACE</router-link>
      </div>
    </section>

    <!-- Section Prestataires -->
    <section class="prestataires-section">
      <div class="prestataires-container">
        <h2 class="section-title">NOS PARTENAIRES</h2>

        <!-- Filtres -->
        <div class="filters-wrapper">
          <button
            class="filter-btn"
            :class="{ active: selectedFilters.length === 0 }"
            @click="clearFilters"
          >
            Tous
          </button>
          <button
            v-for="type in availableTypes"
            :key="type"
            class="filter-btn"
            :class="{ active: selectedFilters.includes(type) }"
            @click="toggleFilter(type)"
          >
            {{ type }}
          </button>
        </div>

        <!-- Grille des prestataires -->
        <div class="prestataires-grid">
          <div
            v-for="prestataire in filteredPrestataires"
            :key="prestataire.nom"
            class="prestataire-card"
            @click="goToPrestataire(prestataire.nom)"
          >
            <div class="prestataire-image-wrapper">
              <img
                :src="prestataire.image"
                :alt="prestataire.nom"
                class="prestataire-image"
                @error="handleImageError"
              />
              <div class="prestataire-overlay">
                <div class="prestataire-content">
                  <h3 class="prestataire-nom">{{ prestataire.nom }}</h3>
                  <span class="prestataire-type">{{ prestataire.type }}</span>
                  <div class="prestataire-prix">
                    <span v-if="prestataire.prixMoyen > 0" class="prix-value">
                      {{ prestataire.prixMoyen }}€
                    </span>
                    <span v-else class="prix-gratuit">Gratuit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p v-if="filteredPrestataires.length === 0" class="no-results">
          Aucun prestataire ne correspond à votre sélection.
        </p>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import CarteView from './CarteView.vue';

export default {
  name: 'HomeView',
  components: { CarteView },
  setup() {
    const router = useRouter();

    // CHANGED: helper pour normaliser les chemins d'assets publics
    const normalizePublicPath = (p) => {
      if (!p) return p;
      // Convertit "/public/..." en "/..." si jamais un chemin erroné est présent
      return p.replace(/^\/?public\//, '/');
    };

    const artists = [
      // CHANGED: utiliser normalizePublicPath pour garantir un chemin root correct
      { name: 'Booba', img: normalizePublicPath('/media/artistes/booba.jpg') },
      { name: 'SCH', img: normalizePublicPath('/media/artistes/SCH.jpg') },
      { name: 'SDM', img: normalizePublicPath('/media/artistes/SDM.jpg') },
      { name: 'Josman', img: normalizePublicPath('/media/artistes/Josman.jpg') },
      { name: 'Ninho', img: normalizePublicPath('/media/artistes/Ninho.jpg') },
      { name: 'Gims', img: normalizePublicPath('/media/artistes/Gims.jpg') },
    ];

    // Données prestataires
    const prestataires = ref([]);
    const selectedFilters = ref([]);

    // Charger les prestataires
    const loadPrestataires = async () => {
      try {
        // Charger les modifications locales
        const customRaw = localStorage.getItem('customPrestataires');
        let customPrestataires = null;
        if (customRaw) {
          try {
            customPrestataires = JSON.parse(customRaw);
          } catch (e) {
            // ignore
          }
        }

        // Charger depuis le fichier JSON
        const response = await fetch('/data/prestataires.json');
        const data = await response.json();
        let prestatairesData = data.prestataires || [];

        // Appliquer les modifications locales si elles existent
        if (customPrestataires) {
          prestatairesData = prestatairesData.map(p => {
            if (customPrestataires[p.nom]) {
              return { ...p, ...customPrestataires[p.nom] };
            }
            return p;
          });
        }

        prestataires.value = prestatairesData;
      } catch (error) {
        console.error('Erreur lors du chargement des prestataires:', error);
      }
    };

    // Types disponibles pour les filtres
    const availableTypes = computed(() => {
      const types = prestataires.value.map(p => p.type);
      return [...new Set(types)].sort();
    });

    // Prestataires filtrés
    const filteredPrestataires = computed(() => {
      if (selectedFilters.value.length === 0) {
        return prestataires.value;
      }
      return prestataires.value.filter(p =>
        selectedFilters.value.includes(p.type)
      );
    });

    // Gestion des filtres
    const toggleFilter = (type) => {
      const index = selectedFilters.value.indexOf(type);
      if (index > -1) {
        selectedFilters.value.splice(index, 1);
      } else {
        selectedFilters.value.push(type);
      }
    };

    const clearFilters = () => {
      selectedFilters.value = [];
    };

    // Gestion d'erreur image
    const handleImageError = (e) => {
      // CHANGED: utiliser le helper pour fallback
      e.target.src = normalizePublicPath('/media/placeholder-prestataire.jpg');
    };

    // Fonction de redirection vers la page prestataire
    const goToPrestataire = (nom) => {
      router.push({
        name: 'prestataire',
        params: { nom: nom }
      });
    };

    // Handlers pour les événements
    const prestataireUpdateHandler = () => {
      loadPrestataires();
    };
    const storageChangeHandler = (e) => {
      if (e.key === 'customPrestataires' || !e.key) {
        loadPrestataires();
      }
    };

    onMounted(() => {
      loadPrestataires();
      window.addEventListener('prestataire-updated', prestataireUpdateHandler);
      window.addEventListener('storage', storageChangeHandler);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('prestataire-updated', prestataireUpdateHandler);
      window.removeEventListener('storage', storageChangeHandler);
    });

    return {
      artists,
      prestataires,
      selectedFilters,
      availableTypes,
      filteredPrestataires,
      toggleFilter,
      clearFilters,
      handleImageError,
      normalizePublicPath,
      goToPrestataire
    };
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.home {
  width: 100%;
  overflow-x: hidden;
}

/* Bandeau Marquee */
.marquee-section {
  width: 100%;
  background: #0011E2;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.marquee-track {
  display: flex;
  gap: 25px;
  padding: 10px 0;
  animation: marquee-scroll 12s linear infinite;
  white-space: nowrap;
  width: fit-content;
}

.marquee-item {
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 2px;
  color: #FCDC1E;
}

@keyframes marquee-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.hero-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6));
}

.hero-title {
  font-size: 5rem;
  font-weight: 900;
  color: #FCDC1E;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
  letter-spacing: 4px;
  margin-bottom: 20px;
}

.hero-date {
  font-size: 2rem;
  color: #ffffff;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.hero-location {
  font-size: 1.3rem;
  color: #ffffff;
  font-weight: 400;
  margin-bottom: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.hero-buttons {
  display: flex;
  gap: 20px;
}

.btn-hero {
  padding: 18px 40px;
  font-size: 1.1rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: 50px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-primary {
  background: #FCDC1E;
  color: #000000;
  border: 3px solid #FCDC1E;
}

.btn-primary:hover {
  background: transparent;
  color: #FCDC1E;
}

.btn-secondary {
  background: transparent;
  color: #ffffff;
  border: 3px solid #ffffff;
}

.btn-secondary:hover {
  background: #ffffff;
  color: #000000;
}

/* Style minimal pour le bouton Connexion ajouté */
.btn-login {
  background: transparent;
  color: #FCDC1E;
  border: 3px solid rgba(252,220,30,0.9);
  padding: 18px 36px;
  border-radius: 50px;
  font-weight: 700;
  text-transform: uppercase;
  transition: all 0.25s ease;
}
.btn-login:hover {
  background: #FCDC1E;
  color: #000;
}

/* Section About */
.about-section {
  padding: 80px 20px;
  background: url('/media/photo_accueil.png') center/cover no-repeat;
  position: relative;
}

/* overlay moins couvrant et bon empilement */
.about-section::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2; /* au-dessus de l'overlay */
}

.section-title {
  font-size: 3rem;
  font-weight: 900;
  text-align: center;
  color: #ffd73e;
  margin-bottom: 60px;
  letter-spacing: 2px;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.about-card {
  text-align: center;
  padding: 40px 30px;
  background: #ffffff;
  border-radius: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.about-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgba(0, 17, 226, 0.2);
}

.card-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.about-card h3 {
  font-size: 1.5rem;
  color: #0011E2;
  margin-bottom: 15px;
  font-weight: 700;
}

.about-card p {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
}

/* Section Description */
.description-section {
  padding: 60px 20px;
  background: linear-gradient(to bottom, #6f47c1 0%, #1629bf 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.description-container {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

.description-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 999px;
  background: rgba(252, 220, 30, 0.15);
  color: #FCDC1E;
  font-size: 0.95rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.description-title {
  font-size: 2.4rem;
  color: #ffffff;
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.2;
}

/* <-- CHANGED: taille du texte description augmentée et line-height ajusté --> */
.description-text {
  font-size: 1.3rem; /* augmenté depuis 1.05rem */
  color: #ffffff;
  line-height: 1.75; /* un peu plus aéré */
  font-weight: 300;
  margin-bottom: 30px;
}

.description-highlights {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.highlight-chip {
  padding: 12px 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Section Artistes - Carrousel */
.artists-section {
  padding: 80px 0;
  background: linear-gradient(to bottom, #1629bf 0%, #11338A 100%);
  overflow: hidden;
}

.artists-container {
  max-width: 100%;
  margin: 0 auto;
}

.artists-section .section-title {
  color: #FCDC1E;
  padding: 0 20px;
  margin-bottom: 60px;
}

.carousel-wrapper {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.carousel-track {
  display: flex;
  gap: 30px;
  animation: scroll 40s linear infinite;
  width: fit-content;
  padding: 0 15px;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.carousel-wrapper:hover .carousel-track {
  animation-play-state: paused;
}

.artist-card {
  position: relative;
  overflow: hidden;
  border-radius: 15px;
  cursor: pointer;
  flex-shrink: 0;
  width: 400px;
  height: 400px;
}

.artist-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.artist-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.artist-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  padding: 30px 20px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.artist-card:hover .artist-image {
  transform: scale(1.1);
}

.artist-card:hover .artist-overlay {
  transform: translateY(0);
}

.artist-name {
  font-size: 1.8rem;
  font-weight: 700;
  color: #FCDC1E;
  text-transform: uppercase;
}

/* Section Carte */
.map-section {
  padding: 80px 0; /* retire le padding latéral pour vraie pleine largeur */
  background: linear-gradient(to bottom, #11338A 0%, #0b1e55 100%);
}

.map-container {
  max-width: none;       /* pleine largeur */
  margin: 0;             /* aligne avec bords */
  width: 100%;
}

/* titre et intro centrés avec marge fixe */
.map-section .section-title {
  color: #FCDC1E;
  text-align: center;
  margin-bottom: 20px;
}
.map-intro {
  text-align: center;
  color: #ffffff;
  font-size: 1.2rem;
  margin-bottom: 24px;
  font-weight: 300;
}

/* Cadre autour de la zone carte */
.map-frame {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(6,18,50,0.18);
  background: linear-gradient(180deg, #172c75 0%, #0f1d51 100%);
}

/* Conteneur interne: fixe la hauteur et masque dépassements */
.map-inner {
  border-radius: 10px;
  overflow: hidden;
  height: 520px; /* ajuste si besoin */
  background: linear-gradient(180deg, #172c75 0%, #0f1d51 100%);
  position: relative;
}

/* La carte doit remplir l'espace */
.map-inner > * { height: 100%; width: 100%; display: block; }

/* Force Leaflet à remplir l’espace */
.map-inner ::v-deep #map,
.map-inner ::v-deep .leaflet-container {
  height: 100% !important;
  width: 100% !important;
  display: block;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: inherit;
}

/* CHANGED: le wrapper ne contraint plus la largeur, la carte + filtre occupent toute la zone */
.map-content-wrapper {
  width: 100%;
  height: 100%;
  display: flex; /* CarteView gère filtre à gauche + carte à droite via son flex interne */
}

/* Contraint le root de CarteView à cette largeur et pleine hauteur */
.map-content-wrapper ::v-deep .carte {
  width: 100%;
  height: 100%;
}

/* (Optionnel) si besoin, on peut limiter UNIQUEMENT la carte interne, mais garder le filtre visible */
/* .map-content-wrapper ::v-deep #map { max-width: 100%; } */

/* Responsive: la hauteur de la carte */
@media screen and (max-width: 1024px) {
  .map-inner { height: 440px; }
}
@media screen and (max-width: 768px) {
  .map-inner { height: 380px; }
}
@media screen and (max-width: 480px) {
  .map-inner { height: 320px; }
}

/* CTA: PRÊT À VIVRE L'EXPÉRIENCE ? */
.cta-section {
  padding: 80px 20px;
  background: linear-gradient(180deg, #0b1e55 0%, #051237 100%);
  border-top: 1px solid rgba(255,255,255,0.08);
  text-align: center;
}
.cta-container {
  max-width: 1100px;
  margin: 0 auto;
}
.cta-title {
  font-size: 2.6rem;
  color: #FCDC1E;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
  text-shadow: 0 4px 24px rgba(0,0,0,0.35);
}
.cta-text {
  font-size: 1.2rem;
  color: #e9ecff;
  margin-bottom: 28px;
  font-weight: 400;
}
.btn-cta {
  display: inline-block;
  padding: 16px 28px;
  border-radius: 999px;
  font-weight: 800;
  letter-spacing: .5px;
  text-transform: uppercase;
  color: #0b1e55;
  background: #FCDC1E;
  border: 2px solid #FCDC1E;
  box-shadow: 0 10px 24px rgba(252,220,30,0.25);
  text-decoration: none;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease, color .15s ease;
}
.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(252,220,30,0.35);
  background: transparent;
  color: #FCDC1E;
}
@media screen and (max-width: 768px) {
  .cta-title { font-size: 2rem; }
  .cta-text { font-size: 1.05rem; }
}
@media screen and (max-width: 480px) {
  .cta-title { font-size: 1.8rem; }
  .cta-text { font-size: 1rem; }
}

/* Section Prestataires */
.prestataires-section {
  padding: 80px 20px;
  background: linear-gradient(to bottom, #0b1e55 0%, #05102b 100%);
}

.prestataires-container {
  max-width: 1400px;
  margin: 0 auto;
}

.prestataires-section .section-title {
  color: #FCDC1E;
  text-align: center;
  margin-bottom: 40px;
}

/* Filtres */
.filters-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 50px;
  padding: 0 20px;
}

.filter-btn {
  padding: 12px 24px;
  border: 2px solid rgba(252, 220, 30, 0.3);
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-btn:hover {
  background: rgba(252, 220, 30, 0.1);
  border-color: rgba(252, 220, 30, 0.6);
}

.filter-btn.active {
  background: #FCDC1E;
  color: #000000;
  border-color: #FCDC1E;
}

/* Grille des prestataires - Cards compactes */
.prestataires-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.prestataire-card {
  position: relative;
  overflow: hidden;
  border-radius: 15px;
  cursor: pointer;
  height: 320px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.prestataire-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 40px rgba(252, 220, 30, 0.3);
}

.prestataire-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.prestataire-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.prestataire-card:hover .prestataire-image {
  transform: scale(1.1);
}

.prestataire-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.7) 70%, transparent 100%);
  padding: 25px 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.prestataire-card:hover .prestataire-overlay {
  opacity: 1;
  transform: translateY(0);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.8) 70%, transparent 100%);
}

.prestataire-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prestataire-nom {
  font-size: 1.5rem;
  font-weight: 700;
  color: #FCDC1E;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prestataire-type {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(252, 220, 30, 0.2);
  color: #FCDC1E;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
  border: 1px solid rgba(252, 220, 30, 0.3);
}

.prestataire-prix {
  margin-top: 8px;
}

.prix-value {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(0, 200, 0, 0.2);
  color: #00ff00;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 700;
  border: 1px solid rgba(0, 255, 0, 0.3);
}

.prix-gratuit {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(252, 220, 30, 0.2);
  color: #FCDC1E;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 700;
  border: 1px solid rgba(252, 220, 30, 0.3);
}

.no-results {
  text-align: center;
  color: #ffffff;
  font-size: 1.2rem;
  padding: 40px;
  font-style: italic;
}

/* Responsive Design */
@media screen and (max-width: 1024px) {
  .hero-title {
    font-size: 3.5rem;
  }

  .about-grid,
  .artists-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .artist-card {
    width: 320px;
    height: 320px;
  }

  .carousel-track {
    gap: 25px;
  }
}

@media screen and (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-date {
    font-size: 1.5rem;
  }

  .hero-location {
    font-size: 1rem;
  }

  .hero-buttons {
    flex-direction: column;
    gap: 15px;
  }

  .about-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .section-title {
    font-size: 2.2rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .artist-card {
    width: 280px;
    height: 280px;
  }

  .carousel-track {
    gap: 20px;
    animation: scroll 30s linear infinite;
  }

  .artist-name {
    font-size: 1.5rem;
  }

  /* <-- CHANGED: ajuste la taille sur tablettes --> */
  .description-text {
    font-size: 1.15rem; /* augmenté depuis 1rem */
  }
}

@media screen and (max-width: 480px) {
  /* règles de secours pour très petits écrans */
  .hero-title {
    font-size: 1.8rem;
  }

  .artist-card {
    width: 240px;
    height: 240px;
  }

  .carousel-track {
    gap: 15px;
  }

  .artist-name {
    font-size: 1.3rem;
  }

  /* <-- CHANGED: ajuste la taille sur très petits écrans --> */
  .description-text {
    font-size: 1.05rem; /* augmenté depuis 0.95rem */
  }
}

.description-container.two-col {
  display: flex;
  align-items: center;
  gap: 40px;
}

.description-container.two-col + .description-container.two-col {
  margin-top: 60px;
}

.description-left {
  flex: 1;
  text-align: left;
}

.description-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.description-image {
  width: 100%;
  max-width: 480px;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  object-fit: cover;
}

/* garde .description-text existant mais s'assure alignement gauche */
.description-text {
  text-align: left;
  /* ...existing style kept... */
}

/* Responsive: empile les colonnes sur petits écrans */
@media screen and (max-width: 900px) {
  .description-container.two-col {
    flex-direction: column;
    gap: 20px;
    padding: 0 20px;
  }

  .description-right {
    width: 100%;
  }

  .description-image {
    max-width: 100%;
    height: auto;
  }
}

/* fin du style */
</style>
