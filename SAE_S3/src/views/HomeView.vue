<template>
  <div class="home">
    <!-- Video Background -->
    <div class="video-background">
      <video autoplay muted loop playsinline>
        <source src="/media/fond.mp4" type="video/mp4">
        <!-- Fallback image if video doesn't load -->
        <div class="fallback-image"></div>
      </video>
      <div class="video-overlay"></div>
    </div>
    
    <!-- Content -->
    <div class="home-content">
      <div class="text-container">
        <h1 class="main-title">Golden Coast</h1>
        <p class="subtitle">Découvrez la beauté de la côte dorée</p>
        <div class="cta-buttons">
          <router-link to="/information" class="btn btn-primary">En savoir plus</router-link>
          <router-link to="/reservation" class="btn btn-secondary">Réserver</router-link>
        </div>
      </div>
    </div>

    <!-- Carrousel des artistes -->
    <div class="carousel">
      <div
        class="carousel-container"
        :style="{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }"
      >
        <div
          class="carousel-slide"
          v-for="(artist, index) in artists"
          :key="index"
        >
          <img :src="artist.img" :alt="artist.name" class="carousel-image" />
          <p class="carousel-name">{{ artist.name }}</p>
        </div>
      </div>
      <button class="carousel-button prev" @click="prevSlide">❮</button>
      <button class="carousel-button next" @click="nextSlide">❯</button>
    </div>
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

    const visibleCards = 3; // Nombre de cartes visibles en même temps
    const currentIndex = ref(0);

    const nextSlide = () => {
      currentIndex.value = (currentIndex.value + 1) % artists.length;
    };

    const prevSlide = () => {
      currentIndex.value =
        (currentIndex.value - 1 + artists.length) % artists.length;
    };

    return { artists, currentIndex, nextSlide, prevSlide, visibleCards };
  },
};
</script>

<style scoped>
.home {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Video Background */
.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
}

.video-background video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%);
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(42, 81, 226, 0.4);
  z-index: -1;
}

/* Content */
.home-content {
  z-index: 1;
  text-align: center;
  padding: 20px;
}

.text-container {
  text-align: left;
}

.main-title {
  color: #FCDC1E;
  font-size: 4.5rem;
  font-weight: 700;
  margin: 0 0 20px 0;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
  line-height: 1.1;
}

.subtitle {
  color: #ffffff;
  font-size: 1.4rem;
  font-weight: 300;
  margin: 0 0 40px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
}

.cta-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.btn {
  padding: 15px 30px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(45deg, #FCDC1E, #FFE55C);
  color: #2A51E2;
}

.btn-secondary {
  background: transparent;
  color: #FCDC1E;
  border: 2px solid #FCDC1E;
}

/* Carrousel Styles */
.carousel {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 30vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.carousel-container {
  display: flex;
  transition: transform 0.5s ease-in-out;
  width: calc(100% * (6 / 3)); /* Ajuste la largeur en fonction du nombre total d'éléments et des cartes visibles */
  height: 100%;
}

.carousel-slide {
  flex: 0 0 calc(100% / 3); /* Ajuste la largeur de chaque carte */
  text-align: center;
  padding: 10px;
}

.carousel-image {
  width: 100%;
  height: auto;
  max-height: 70%;
  border-radius: 12px;
}

.carousel-name {
  margin-top: 10px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #fcdc1e;
}

.carousel-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.carousel-button.prev {
  left: 10px;
}

.carousel-button.next {
  right: 10px;
}

.carousel-button:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Responsive Design */
@media screen and (max-width: 1024px) {
  .home-content {
    width: 60%;
    padding: 0 40px;
  }
  
  .main-title {
    font-size: 3.5rem;
  }
  
  .subtitle {
    font-size: 1.2rem;
  }
}

@media screen and (max-width: 768px) {
  .home {
    justify-content: center;
  }
  
  .home-content {
    width: 90%;
    padding: 0 20px;
    text-align: center;
  }
  
  .text-container {
    text-align: center;
  }
  
  .main-title {
    font-size: 2.8rem;
    letter-spacing: 1px;
  }
  
  .subtitle {
    font-size: 1.1rem;
  }
  
  .cta-buttons {
    justify-content: center;
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 200px;
  }
}

@media screen and (max-width: 480px) {
  .main-title {
    font-size: 2.2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .btn {
    padding: 12px 25px;
    font-size: 1rem;
    min-width: 140px;
  }
}

</style>