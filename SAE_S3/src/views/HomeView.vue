<template>
  <div class="home">
    <!-- Hero Section avec Vidéo -->
    <div class="hero-section">
      <video autoplay muted loop playsinline class="hero-video">
        <source src="/media/fond.mp4" type="video/mp4">
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
        <span class="marquee-item" v-for="n in 8" :key="'marquee-' + n">GOLDEN COAST •</span>
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
      <div class="description-container">
        <p class="description-tag"><strong>Vibes urbaines • 28-29-30 août</strong></p>
        <h2 class="description-title"><strong>Le rendez-vous des fans de rap</strong></h2>

        <p class="description-text">
          Le <strong>Golden Coast Festival</strong>, c’est le spot idéal pour finir l’été et vivre pleinement la culture <strong>rap français</strong>.
          Tu profites de <strong>beats lourds</strong>, d’un son <strong>trap & boom bap</strong> non-stop, de <strong>scènes immersives</strong>
          et d’une <strong>ambiance chill</strong> pensée pour vibrer, partager et créer tes meilleurs souvenirs avec ton crew.
          Entre <strong>shows laser</strong>, <strong>corners fripes</strong>, <strong>street-food</strong> et <strong>afters cachés</strong>,
          tout est conçu pour offrir une expérience simple à vivre, claire à comprendre et impossible à oublier.
        </p>

        <div class="description-highlights">
          <span class="highlight-chip"><strong>Scènes 360°</strong></span>
          <span class="highlight-chip"><strong>Les plus grandes stars du rap français</strong></span>
          <span class="highlight-chip"><strong>Zone chill</strong></span>
          <span class="highlight-chip"><strong>Boissons & street-food</strong></span>
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

    <!-- Section CTA -->
    <section class="cta-section">
      <div class="cta-container">
        <h2 class="cta-title"><strong>PRÊT À VIVRE L'EXPÉRIENCE ?</strong></h2>
        <p class="cta-text"><strong>Réservez vos billets dès maintenant</strong> et rejoignez-nous pour trois jours inoubliables !</p>
        <router-link to="/reservation" class="btn-cta">RÉSERVER MA PLACE</router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'HomeView',
  setup() {
    const artists = [
      { name: 'Booba', img: '/media/artistes/booba.jpg' },
      { name: 'SCH', img: '/media/artistes/SCH.jpg' },
      { name: 'SDM', img: '/media/artistes/SDM.jpg' },
      { name: 'Josman', img: '/media/artistes/Josman.jpg' },
      { name: 'Ninho', img: '/media/artistes/Ninho.jpg' },
      { name: 'Gims', img: '/media/artistes/Gims.jpg' },
    ];

    return { artists };
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
  background: #FCDC1E;
  border-top: 2px solid #000000;
  border-bottom: 2px solid #000000;
  overflow: hidden;
}

.marquee-track {
  display: flex;
  gap: 25px;
  padding: 18px 0;
  animation: marquee-scroll 12s linear infinite;
  white-space: nowrap;
}

.marquee-section:hover .marquee-track {
  animation-play-state: paused;
}

.marquee-item {
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 3px;
  color: #000000;
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
  color: #0011E2;
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
  background: #f8f9fa;
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
  background: radial-gradient(circle at top, rgba(252, 220, 30, 0.25), transparent 55%), #000428;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.description-container {
  max-width: 900px;
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

.description-text {
  font-size: 1.4rem;
  color: #ffffff;
  line-height: 1.8;
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
  background: #1a1a1a;
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

/* Section CTA */
.cta-section {
  padding: 100px 20px;
  background: linear-gradient(135deg, #0011E2 0%, #000428 100%);
  text-align: center;
}

.cta-container {
  max-width: 800px;
  margin: 0 auto;
}

.cta-title {
  font-size: 3rem;
  font-weight: 900;
  color: #FCDC1E;
  margin-bottom: 20px;
}

.cta-text {
  font-size: 1.3rem;
  color: #ffffff;
  margin-bottom: 40px;
}

.btn-cta {
  display: inline-block;
  padding: 20px 50px;
  font-size: 1.2rem;
  font-weight: 700;
  background: #FCDC1E;
  color: #000000;
  text-decoration: none;
  border-radius: 50px;
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.btn-cta:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(252, 220, 30, 0.4);
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
}

/* fin du style */
</style>
