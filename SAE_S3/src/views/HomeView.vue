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
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  mounted() {
    // Ensure video plays on mobile devices
    const video = this.$el.querySelector('video');
    if (video) {
      video.play().catch(e => {
        console.log('Video autoplay failed:', e);
      });
    }
  }
};
</script>

<style scoped>
.home {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-start;
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
  width: 50%;
  padding: 0 60px;
  z-index: 1;
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
  justify-content: flex-start;
  flex-wrap: wrap;
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
  display: inline-block;
  text-align: center;
  min-width: 150px;
}

.btn-primary {
  background: linear-gradient(45deg, #FCDC1E, #FFE55C);
  color: #2A51E2;
  box-shadow: 0 4px 15px rgba(252, 220, 30, 0.3);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(252, 220, 30, 0.4);
  background: linear-gradient(45deg, #FFE55C, #FCDC1E);
}

.btn-secondary {
  background: transparent;
  color: #FCDC1E;
  border: 2px solid #FCDC1E;
  box-shadow: 0 4px 15px rgba(252, 220, 30, 0.2);
}

.btn-secondary:hover {
  background: #FCDC1E;
  color: #2A51E2;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(252, 220, 30, 0.4);
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