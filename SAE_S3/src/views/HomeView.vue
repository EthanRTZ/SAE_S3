<template>
  <div class="home">
    <!-- Hero Section avec Vidéo -->
    <div class="hero-section">
      <video autoplay muted loop playsinline class="hero-video">
        <source :src="normalizePublicPath('/media/fond.mp4')" type="video/mp4">
      </video>
      <div class="hero-content">
        <h1 class="hero-title">{{ translatedPresentation.titre }}</h1>
        <p class="hero-date"><strong>{{ translatedPresentation.date }}</strong></p>
        <p class="hero-location"><strong>{{ translatedPresentation.lieu }}</strong></p>
        <div class="hero-buttons">
          <router-link to="/reservation" class="btn-hero btn-primary">{{ $t('home.buyTickets') }}</router-link>
          <router-link to="/programmation" class="btn-hero btn-secondary">{{ $t('nav.programmation') }}</router-link>
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
          <h2 class="section-title">{{ $t('home.festival') }}</h2>
          <div class="about-grid">
            <div class="about-card">
              <div class="card-icon">🎤</div>
              <h3>{{ translatedPresentation.aboutCard1Titre }}</h3>
              <p v-html="translatedPresentation.aboutCard1Texte"></p>
            </div>
            <div class="about-card">
              <div class="card-icon">🌳</div>
              <h3>{{ translatedPresentation.aboutCard2Titre }}</h3>
              <p v-html="translatedPresentation.aboutCard2Texte"></p>
            </div>
            <div class="about-card">
              <div class="card-icon">👥</div>
              <h3>{{ translatedPresentation.aboutCard3Titre }}</h3>
              <p v-html="translatedPresentation.aboutCard3Texte"></p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="description-section">
      <div class="description-container two-col">
        <div class="description-left">
          <h2 class="description-title"><strong>{{ translatedPresentation.desc1Titre }}</strong></h2>
          <p class="description-text" v-html="translatedPresentation.desc1Texte"></p>
          <div class="description-highlights">
            <span class="highlight-chip"><strong>{{ translatedPresentation.desc1Chip1 }}</strong></span>
            <span class="highlight-chip"><strong>{{ translatedPresentation.desc1Chip2 }}</strong></span>
          </div>
        </div>
        <div class="description-right">
          <img :src="normalizePublicPath('/media/description.png')" alt="Golden Coast Festival" class="description-image" />
        </div>
      </div>

      <div class="description-container two-col">
        <div class="description-right">
          <img :src="normalizePublicPath('/media/accueil2.jpeg')" alt="Ambiance Golden Coast" class="description-image" />
        </div>
        <div class="description-left">
          <h2 class="description-title"><strong>{{ translatedPresentation.desc2Titre }}</strong></h2>
          <p class="description-text" v-html="translatedPresentation.desc2Texte"></p>
        </div>
      </div>
    </section>


    <!-- Section Artistes -->
    <section class="artists-section">
      <div class="artists-container">
        <h2 class="section-title">{{ $t('home.schedule') }}</h2>
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
        <h2 class="section-title">{{ translatedPresentation.mapTitre }}</h2>
        <p class="map-intro">{{ translatedPresentation.mapIntro }}</p>
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
        <h2 class="cta-title"><strong>{{ translatedPresentation.ctaTitre }}</strong></h2>
        <p class="cta-text"><strong>{{ translatedPresentation.ctaTexte }}</strong></p>
        <router-link to="/reservation" class="btn-cta">{{ translatedPresentation.ctaBouton }}</router-link>
      </div>
    </section>

    <!-- Section Prestataires -->
    <section class="prestataires-section">
      <div class="prestataires-container">
        <h2 class="section-title">{{ $t('home.partners') }}</h2>

        <!-- Filtres -->
        <div class="filters-wrapper">
          <button
            class="filter-btn"
            :class="{ active: selectedFilters.length === 0 }"
            @click="clearFilters"
          >
            {{ $t('home.all') }}
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
                    <span v-if="getPrestatairePriceRange(prestataire)" class="prix-value">
                      {{ getPrestatairePriceRange(prestataire) }}
                    </span>
                    <span v-else class="prix-gratuit">{{ $t('home.free') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p v-if="filteredPrestataires.length === 0" class="no-results">
          {{ $t('home.noProviderMatch') }}
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <!-- Section Logo & Description -->
        <div class="footer-section footer-about">
          <div class="footer-logo">
            <h3>Golden Coast</h3>
          </div>
          <p class="footer-description">
            {{ $t('home.footerDescription') }}
          </p>
          <div class="footer-social">
            <a href="https://www.facebook.com/goldencoast.festival" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Facebook">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/goldencoast_festival/" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@goldencoast.festival" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a href="https://x.com/goldencoastfest" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="X (Twitter)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://www.threads.com/@goldencoast_festival" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Threads">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.016-5.097.912-6.494 2.663-1.267 1.591-1.903 3.847-1.928 6.217.024 2.375.66 4.63 1.926 6.215 1.395 1.746 3.583 2.64 6.493 2.656 3.098-.017 5.26-1.084 6.425-3.172.65-1.165.854-2.524.606-4.042-.194-1.188-.89-2.157-2.068-2.88-.49-.3-1.03-.542-1.604-.721-.96 1.197-2.406 1.857-4.178 1.9-1.74-.043-3.13-.65-4.134-1.806-.86-1-1.31-2.304-1.336-3.874.026-1.566.475-2.868 1.335-3.868 1.004-1.156 2.394-1.763 4.133-1.806 1.777.044 3.226.706 4.186 1.91.515.64.872 1.397 1.067 2.26.386-.062.773-.094 1.16-.097 1.023.003 1.992.23 2.88.676 1.82 1.037 2.979 2.78 3.35 5.033.386 2.346-.09 4.485-1.412 6.356-1.636 2.314-4.323 3.49-7.986 3.512zm-.014-14.084c-1.235.042-2.194.49-2.85 1.333-.546.7-.824 1.59-.827 2.643.003 1.052.28 1.942.826 2.643.656.843 1.615 1.291 2.85 1.333 1.245-.042 2.207-.49 2.863-1.334.545-.7.823-1.59.827-2.642-.004-1.053-.282-1.943-.827-2.643-.656-.843-1.618-1.291-2.863-1.333z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Section Liens Rapides -->
        <div class="footer-section">
          <h4 class="footer-title">{{ $t('home.navigation') }}</h4>
          <ul class="footer-links">
            <li><router-link to="/">{{ $t('nav.home') }}</router-link></li>
            <li><router-link to="/programmation">{{ $t('nav.programmation') }}</router-link></li>
            <li><router-link to="/prestataire">{{ $t('nav.prestataireList') }}</router-link></li>
            <li><router-link to="/carte">{{ $t('nav.carte') }}</router-link></li>
            <li><router-link to="/reservation">{{ $t('nav.reservation') }}</router-link></li>
          </ul>
        </div>

        <!-- Section Informations -->
        <div class="footer-section">
          <h4 class="footer-title">{{ $t('home.information') }}</h4>
          <ul class="footer-links">
            <li><a href="#" @click.prevent>{{ $t('home.aboutFestival') }}</a></li>
            <li><a href="#" @click.prevent>{{ $t('home.termsConditions') }}</a></li>
            <li><a href="#" @click.prevent>{{ $t('home.privacyPolicy') }}</a></li>
            <li><a href="#" @click.prevent>{{ $t('home.faq') }}</a></li>
            <li><a href="#" @click.prevent>{{ $t('home.ourPartners') }}</a></li>
          </ul>
        </div>

        <!-- Section Avis & Contact -->
        <div class="footer-section">
          <h4 class="footer-title">{{ $t('home.reviewsContact') }}</h4>
          <div class="footer-avis-cta">
            <p class="avis-description">
              {{ $t('home.shareExperience') }}
            </p>
            <router-link to="/avis" class="btn-avis">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ $t('avis.leaveReview') }}
            </router-link>
          </div>
          <ul class="footer-contact">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Combe à la Serpent<br/>Corcelles-lès-Monts, France</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>+33 (0)3 80 XX XX XX</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>contact@goldencoast.fr</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <div class="footer-bottom-container">
          <p>&copy; {{ new Date().getFullYear() }} Golden Coast Festival. {{ $t('home.allRightsReserved') }}.</p>
          <p class="footer-credits">{{ $t('home.madeWithPassion') }} 🎤</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import CarteView from './CarteView.vue';

export default {
  name: 'HomeView',
  components: { CarteView },
  setup() {
    const router = useRouter();
    const { locale } = useI18n();

    const normalizePublicPath = (p) => {
      if (!p) return p;
      return p.replace(/^\/?public\//, '/');
    };

    const artists = [
      { name: 'Booba', img: normalizePublicPath('/media/artistes/booba.jpg') },
      { name: 'SCH', img: normalizePublicPath('/media/artistes/SCH.jpg') },
      { name: 'SDM', img: normalizePublicPath('/media/artistes/SDM.jpg') },
      { name: 'Josman', img: normalizePublicPath('/media/artistes/Josman.jpg') },
      { name: 'Ninho', img: normalizePublicPath('/media/artistes/Ninho.jpg') },
      { name: 'Gims', img: normalizePublicPath('/media/artistes/Gims.jpg') },
    ];

    // Ref pour forcer la réactivité lors des changements de locale
    const presentationRefreshKey = ref(0);
    
    // Computed pour obtenir la version traduite du contenu selon la langue
    // Les données viennent uniquement de localStorage (gérées par l'admin)
    const translatedPresentation = computed(() => {
      // Forcer la réévaluation quand locale ou presentationRefreshKey change
      locale.value; // Lecture pour la réactivité
      presentationRefreshKey.value; // Lecture pour la réactivité
      
      const savedPresentation = localStorage.getItem('festivalPresentation');
      if (savedPresentation) {
        try {
          const parsed = JSON.parse(savedPresentation);
          
          // Format bilingue { fr: {...}, en: {...} }
          if (parsed.fr && parsed.en) {
            const currentLang = locale.value || 'fr';
            return parsed[currentLang] || parsed.fr;
          }
          
          // Ancien format (rétrocompatibilité) - utiliser pour les deux langues
          return parsed;
        } catch (e) {
          console.error('Erreur lors du chargement de la présentation:', e);
        }
      }
      
      // Retourner un objet vide si aucune donnée n'est sauvegardée
      // L'admin doit initialiser les données depuis l'interface admin
      return {
        titre: '',
        date: '',
        lieu: '',
        aboutCard1Titre: '',
        aboutCard1Texte: '',
        aboutCard2Titre: '',
        aboutCard2Texte: '',
        aboutCard3Titre: '',
        aboutCard3Texte: '',
        desc1Titre: '',
        desc1Texte: '',
        desc1Chip1: '',
        desc1Chip2: '',
        desc2Titre: '',
        desc2Texte: '',
        ctaTitre: '',
        ctaTexte: '',
        ctaBouton: '',
        mapTitre: '',
        mapIntro: ''
      };
    });

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
        const response = await fetch('/data/site.json');
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
      e.target.src = normalizePublicPath('/media/placeholder-prestataire.png');
    };

    // Fonction de redirection vers la page de détail du prestataire
    const goToPrestataire = (nom) => {
      router.push({
        name: 'prestataire-detail',
        params: { nom: encodeURIComponent(nom) }
      });
    };

    // Fonction pour obtenir la plage de prix d'un prestataire
    const getPrestatairePriceRange = (prestataire) => {
      if (!prestataire.services || prestataire.services.length === 0) {
        return null;
      }
      
      // Filtrer les services publics avec prix
      const servicesWithPrice = prestataire.services
        .filter(s => s.public !== false && (s.prix !== undefined && s.prix !== null))
        .map(s => s.prix || 0);
      
      if (servicesWithPrice.length === 0) {
        return null;
      }
      
      const minPrice = Math.min(...servicesWithPrice);
      const maxPrice = Math.max(...servicesWithPrice);
      
      if (minPrice === 0 && maxPrice === 0) {
        return null; // Tous gratuits
      }
      
      if (minPrice === maxPrice) {
        return `${minPrice}€`;
      }
      
      return `${minPrice}€ - ${maxPrice}€`;
    };


    // Handlers pour les événements
    const prestataireUpdateHandler = () => {
      loadPrestataires();
    };
    
    const presentationUpdateHandler = () => {
      presentationRefreshKey.value++;
    };
    
    const storageChangeHandler = (e) => {
      if (e.key === 'customPrestataires' || !e.key) {
        loadPrestataires();
      }
      if (e.key === 'festivalPresentation' || !e.key) {
        presentationRefreshKey.value++;
      }
    };

    onMounted(() => {
      loadPrestataires();
      window.addEventListener('prestataire-updated', prestataireUpdateHandler);
      window.addEventListener('festival-presentation-updated', presentationUpdateHandler);
      window.addEventListener('storage', storageChangeHandler);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('prestataire-updated', prestataireUpdateHandler);
      window.removeEventListener('festival-presentation-updated', presentationUpdateHandler);
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
      goToPrestataire,
      getPrestatairePriceRange,
      translatedPresentation
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
  margin: 0;
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

/* Mise en page deux colonnes */
.description-container.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  margin-bottom: 80px;
  text-align: left;
}

.description-container.two-col:last-child {
  margin-bottom: 0;
}

.description-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.description-right {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.description-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 20px;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.description-right:hover .description-image {
  transform: scale(1.05);
}

/* Responsive pour la section description */
@media screen and (max-width: 968px) {
  .description-container.two-col {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }

  .description-container.two-col:nth-child(even) .description-right {
    order: -1;
  }

  .description-left {
    text-align: center;
  }

  .description-highlights {
    justify-content: center;
  }
}

@media screen and (max-width: 768px) {
  .description-section {
    padding: 50px 20px;
  }

  .description-container.two-col {
    gap: 30px;
    margin-bottom: 60px;
  }

  .description-title {
    font-size: 2rem;
  }

  .description-text {
    font-size: 1.1rem;
  }
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
  box-shadow: 0 10px 24px rgba(252, 220, 30, 0.25);
  text-decoration: none;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease, color .15s ease;
}
.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(252, 220, 30, 0.35);
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

/* Footer Styles */
.footer {
  background: linear-gradient(135deg, #05102b 0%, #0b1e55 100%);
  color: #ffffff;
  padding: 70px 0 0;
  margin-top: 0;
  border-top: 4px solid #FCDC1E;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 50px;
  margin-bottom: 50px;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.footer-about {
  max-width: 380px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.footer-logo h3 {
  font-size: 1.8rem;
  font-weight: 900;
  color: #FCDC1E;
  margin: 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.footer-description {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.8;
  font-size: 1rem;
  font-weight: 300;
}

.footer-social {
  display: flex;
  gap: 14px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(252, 220, 30, 0.1);
  color: #FCDC1E;
  transition: all 0.3s ease;
  border: 2px solid rgba(252, 220, 30, 0.3);
}

.social-link:hover {
  background: #FCDC1E;
  color: #05102b;
  transform: translateY(-4px) scale(1.05);
  border-color: #FCDC1E;
  box-shadow: 0 8px 20px rgba(252, 220, 30, 0.4);
}

.footer-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #FCDC1E;
  margin-bottom: 4px;
  position: relative;
  padding-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.footer-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #FCDC1E 0%, transparent 100%);
  border-radius: 2px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.footer-links li a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 400;
  transition: all 0.2s ease;
  display: inline-block;
  position: relative;
  padding-left: 0;
}

.footer-links li a::before {
  content: '→';
  position: absolute;
  left: -22px;
  opacity: 0;
  transition: all 0.2s ease;
  color: #FCDC1E;
  font-weight: bold;
}

.footer-links li a:hover {
  color: #FCDC1E;
  padding-left: 22px;
  transform: translateX(2px);
}

.footer-links li a:hover::before {
  opacity: 1;
  left: 0;
}

.footer-contact {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.footer-contact li {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.7;
  font-weight: 300;
}

.footer-contact li svg {
  flex-shrink: 0;
  margin-top: 3px;
  color: #FCDC1E;
  filter: drop-shadow(0 2px 4px rgba(252, 220, 30, 0.3));
}

.footer-bottom {
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(252, 220, 30, 0.15);
  padding: 28px 0;
  margin-top: 30px;
}

.footer-bottom-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-bottom-container p {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.95rem;
  margin: 0;
  font-weight: 300;
}

.footer-credits {
  font-size: 0.9rem !important;
  color: rgba(252, 220, 30, 0.7) !important;
  font-weight: 400 !important;
}

/* Section Avis dans le Footer */
.footer-avis-cta {
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(252, 220, 30, 0.08);
  border-radius: 12px;
  border: 1px solid rgba(252, 220, 30, 0.2);
}

.avis-description {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 16px;
  font-weight: 300;
}

.btn-avis {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: #FCDC1E;
  color: #05102b;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  border: 2px solid #FCDC1E;
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
}

.btn-avis svg {
  flex-shrink: 0;
}

.btn-avis:hover {
  background: transparent;
  color: #FCDC1E;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(252, 220, 30, 0.4);
}

/* Responsive Footer */
@media screen and (max-width: 1200px) {
  .footer-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
    padding: 0 30px;
  }

  .footer-about {
    max-width: 100%;
    grid-column: 1 / -1;
  }
}

@media screen and (max-width: 768px) {
  .footer {
    padding: 50px 0 0;
  }

  .footer-container {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 0 20px;
  }

  .footer-about {
    max-width: 100%;
  }

  .footer-logo h3 {
    font-size: 1.5rem;
  }

  .footer-title {
    font-size: 1.15rem;
  }

  .footer-bottom-container {
    padding: 0 20px;
  }

  .footer-social {
    justify-content: flex-start;
  }

  .footer-avis-cta {
    padding: 16px;
  }

  .avis-description {
    font-size: 0.9rem;
    margin-bottom: 14px;
  }

  .btn-avis {
    font-size: 0.9rem;
    padding: 10px 20px;
  }
}

@media screen and (max-width: 480px) {
  .footer {
    padding: 40px 0 0;
  }

  .footer-logo h3 {
    font-size: 1.3rem;
  }

  .social-link {
    width: 42px;
    height: 42px;
  }

  .social-link svg {
    width: 20px;
    height: 20px;
  }

  .footer-description {
    font-size: 0.95rem;
  }

  .footer-links li a,
  .footer-contact li {
    font-size: 0.9rem;
  }
}

/* fin du style */
</style>
