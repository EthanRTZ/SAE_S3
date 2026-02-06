<template>
  <div class="avis-view">
    <!-- Hero Section -->
    <div class="avis-hero">
      <video autoplay muted loop playsinline class="hero-video">
        <source src="/media/fond.mp4" type="video/mp4">
      </video>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title">{{ $t('avis.title') }}</h1>
        <p class="hero-subtitle">{{ $t('avis.subtitle') }}</p>
      </div>
    </div>

    <!-- Section Formulaire -->
    <section class="form-section">
      <div class="form-container">
        <div class="form-header">
          <h2>{{ $t('avis.leaveReview') }}</h2>
          <p>{{ $t('avis.participated') }}</p>
        </div>

        <form @submit.prevent="submitAvis" class="avis-form">
          <!-- Sélection Prestataire -->
          <div class="form-group">
            <label for="prestataire">{{ $t('avis.provider') }}</label>
            <select
              id="prestataire"
              v-model="formData.prestataire"
              required
              class="form-select"
            >
              <option value="">{{ $t('avis.selectProvider') }}</option>
              <option value="Festival">{{ $t('avis.festival') }}</option>
              <option
                v-for="presta in prestataires"
                :key="presta.nom"
                :value="presta.nom"
              >
                {{ presta.nom }} - {{ presta.type }}
              </option>
            </select>
          </div>

          <!-- Notation -->
          <div class="form-group">
            <label>{{ $t('avis.yourNote') }}</label>
            <div class="rating-input">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="formData.note = star"
                class="star-btn"
                :class="{ active: star <= formData.note }"
              >
                ★
              </button>
            </div>
            <span v-if="formData.note" class="rating-text">
              {{ formData.note }}/5
            </span>
          </div>

          <!-- Nom (optionnel) -->
          <div class="form-group">
            <label for="nom">{{ $t('avis.yourName') }}</label>
            <input
              id="nom"
              v-model="formData.nom"
              type="text"
              :placeholder="$t('avis.anonymous')"
              class="form-input"
            />
          </div>

          <!-- Commentaire -->
          <div class="form-group">
            <label for="commentaire">{{ $t('avis.yourComment') }}</label>
            <textarea
              id="commentaire"
              v-model="formData.commentaire"
              required
              rows="5"
              :placeholder="$t('avis.shareExperience')"
              class="form-textarea"
            ></textarea>
          </div>

          <!-- Bouton Submit -->
          <button type="submit" class="btn-submit" :disabled="submitting">
            {{ submitting ? $t('avis.sending') : $t('avis.publish') }}
          </button>

          <!-- Message de succès -->
          <div v-if="successMessage" class="success-message">
            ✓ {{ successMessage }}
          </div>
        </form>
      </div>
    </section>

    <!-- Section Avis Récents -->
    <section class="avis-list-section">
      <div class="avis-list-container">
        <h2 class="section-title">Avis récents</h2>

        <!-- Filtres - seulement si des avis existent -->
        <div v-if="avisListe.length > 0" class="filters">
          <button
            @click="filtrePrestataire = ''"
            class="filter-btn"
            :class="{ active: filtrePrestataire === '' }"
          >
            Tous
          </button>
          <button
            v-for="presta in prestatairesAvecAvis"
            :key="presta"
            @click="filtrePrestataire = presta"
            class="filter-btn"
            :class="{ active: filtrePrestataire === presta }"
          >
            {{ presta }}
          </button>
        </div>

        <!-- Liste des avis -->
        <div class="avis-grid">
          <div
            v-for="avis in avisFiltres"
            :key="avis.id"
            class="avis-card"
          >
            <div class="avis-header">
              <div class="avis-info">
                <h3 class="avis-presta">{{ avis.prestataire }}</h3>
                <span class="avis-date">{{ formatDate(avis.date) }}</span>
              </div>
              <div class="avis-rating">
                <span v-for="star in 5" :key="star" class="star" :class="{ filled: star <= avis.note }">
                  ★
                </span>
              </div>
            </div>
            <p class="avis-commentaire">{{ avis.commentaire }}</p>
            <div class="avis-footer">
              <span class="avis-auteur">{{ avis.nom || 'Anonyme' }}</span>
            </div>
          </div>
        </div>

        <p v-if="avisFiltres.length === 0" class="no-avis">
          Aucun avis pour cette sélection.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Données du formulaire
const formData = ref({
  prestataire: '',
  note: 0,
  nom: '',
  commentaire: ''
});

const submitting = ref(false);
const successMessage = ref('');

// Données
const prestataires = ref([]);
const avisListe = ref([]);
const filtrePrestataire = ref('');

// Charger les prestataires
const loadPrestataires = async () => {
  try {
    const response = await fetch('/data/prestataires.json');
    const data = await response.json();
    prestataires.value = data.prestataires || [];
  } catch (error) {
    console.error('Erreur chargement prestataires:', error);
  }
};

// Charger les avis depuis le fichier JSON et localStorage
const loadAvis = async () => {
  const allAvis = [];

  // 1. Charger les avis depuis le fichier JSON
  try {
    const response = await fetch('/data/avis.json');
    const data = await response.json();

    // Convertir les avis du JSON en format compatible
    Object.keys(data).forEach(prestataireName => {
      const prestataireAvis = data[prestataireName].avis || [];
      prestataireAvis.forEach(avis => {
        allAvis.push({
          id: `${prestataireName}-${avis.id}`,
          prestataire: prestataireName,
          note: avis.note,
          nom: 'Anonyme', // Les avis JSON n'ont pas de nom
          commentaire: avis.commentaire,
          date: avis.date
        });
      });
    });
  } catch (error) {
    console.error('Erreur chargement avis JSON:', error);
  }

  // 2. Charger les avis depuis localStorage
  const stored = localStorage.getItem('festivalAvis');
  if (stored) {
    try {
      const localAvis = JSON.parse(stored);
      allAvis.push(...localAvis);
    } catch (e) {
      console.error('Erreur chargement localStorage:', e);
    }
  }

  // 3. Trier par date décroissante (plus récent en premier)
  allAvis.sort((a, b) => new Date(b.date) - new Date(a.date));

  avisListe.value = allAvis;
};

// Soumettre un avis
const submitAvis = () => {
  if (!formData.value.prestataire || !formData.value.note || !formData.value.commentaire.trim()) {
    return;
  }

  submitting.value = true;

  const newAvis = {
    id: Date.now(),
    prestataire: formData.value.prestataire,
    note: formData.value.note,
    nom: formData.value.nom || 'Anonyme',
    commentaire: formData.value.commentaire.trim(),
    date: new Date().toISOString()
  };

  // MODIFICATION: Différencier festival et prestataires
  if (formData.value.prestataire === 'Festival') {
    // Avis sur le festival
    const storedFestival = localStorage.getItem('avisFestival');
    let avisFestival = [];
    if (storedFestival) {
      try {
        avisFestival = JSON.parse(storedFestival);
      } catch (e) {
        avisFestival = [];
      }
    }
    avisFestival.unshift(newAvis);
    localStorage.setItem('avisFestival', JSON.stringify(avisFestival));
  } else {
    // Avis sur un prestataire
    const stored = localStorage.getItem('festivalAvis');
    let localAvis = [];
    if (stored) {
      try {
        localAvis = JSON.parse(stored);
      } catch (e) {
        localAvis = [];
      }
    }
    localAvis.unshift(newAvis);
    localStorage.setItem('festivalAvis', JSON.stringify(localAvis));
  }

  // Émettre un événement global pour notifier les autres composants
  window.dispatchEvent(new CustomEvent('avis-updated', {
    detail: {
      type: formData.value.prestataire === 'Festival' ? 'festival' : 'prestataire',
      prestataire: newAvis.prestataire,
      avis: newAvis
    }
  }));

  // Recharger tous les avis
  loadAvis();

  successMessage.value = t('avis.published');

  // Reset form
  formData.value = {
    prestataire: '',
    note: 0,
    nom: '',
    commentaire: ''
  };

  setTimeout(() => {
    successMessage.value = '';
    submitting.value = false;
  }, 3000);
};

// Prestataires ayant des avis
const prestatairesAvecAvis = computed(() => {
  const prestasSet = new Set(
    avisListe.value
      .map(a => a.prestataire)
      .filter(p => p && p.trim() !== '') // Filtrer les valeurs vides ou avec espaces
  );
  return Array.from(prestasSet).sort();
});

// Avis filtrés
const avisFiltres = computed(() => {
  if (!filtrePrestataire.value) {
    return avisListe.value;
  }
  return avisListe.value.filter(a => a.prestataire === filtrePrestataire.value);
});

// Formater la date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

onMounted(() => {
  loadPrestataires();
  loadAvis();
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.avis-view {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(to bottom, #05102b 0%, #0b1e55 50%, #05102b 100%);
}

/* Hero Section - même style que HomeView */
.avis-hero {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 500px;
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

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7));
  z-index: 1;
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
}

.hero-title {
  font-size: 4rem;
  font-weight: 900;
  color: #FCDC1E;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
  letter-spacing: 4px;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: #ffffff;
  font-weight: 400;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  max-width: 700px;
}

/* Section Formulaire */
.form-section {
  padding: 80px 20px;
  background: linear-gradient(to bottom, #0b1e55 0%, #05102b 100%);
}

.form-container {
  max-width: 700px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 50px 40px;
  border: 1px solid rgba(252, 220, 30, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 2.5rem;
  color: #FCDC1E;
  margin-bottom: 15px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.form-header p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  line-height: 1.6;
  font-weight: 300;
}

.avis-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group label {
  color: #ffffff;
  font-weight: 600;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-select,
.form-input,
.form-textarea {
  padding: 14px 18px;
  border-radius: 10px;
  border: 2px solid rgba(252, 220, 30, 0.3);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #FCDC1E;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 20px rgba(252, 220, 30, 0.2);
}

.form-select option {
  background: #05102b;
  color: #ffffff;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

/* Rating Input */
.rating-input {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 2.5rem;
  color: rgba(252, 220, 30, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.star-btn:hover,
.star-btn.active {
  color: #FCDC1E;
  transform: scale(1.15);
  text-shadow: 0 0 20px rgba(252, 220, 30, 0.6);
}

.rating-text {
  color: #FCDC1E;
  font-weight: 700;
  font-size: 1.2rem;
  margin-left: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Bouton Submit */
.btn-submit {
  padding: 16px 32px;
  background: #FCDC1E;
  color: #05102b;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  box-shadow: 0 4px 15px rgba(252, 220, 30, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(252, 220, 30, 0.5);
  background: #fff;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  padding: 16px;
  background: rgba(0, 255, 0, 0.15);
  border: 2px solid rgba(0, 255, 0, 0.4);
  border-radius: 10px;
  color: #00ff00;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Section Liste Avis */
.avis-list-section {
  padding: 80px 20px;
  background: linear-gradient(to bottom, #05102b 0%, #0b1e55 100%);
}

.avis-list-container {
  max-width: 1400px;
  margin: 0 auto;
}

.section-title {
  font-size: 3rem;
  color: #FCDC1E;
  text-align: center;
  margin-bottom: 50px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* Filtres - même style que HomeView */
.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 50px;
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
  transform: translateY(-2px);
}

.filter-btn.active {
  background: #FCDC1E;
  color: #05102b;
  border-color: #FCDC1E;
  box-shadow: 0 4px 15px rgba(252, 220, 30, 0.4);
}

/* Grille des avis */
.avis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.avis-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(252, 220, 30, 0.2);
  border-radius: 15px;
  padding: 25px;
  transition: all 0.3s ease;
}

.avis-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 40px rgba(252, 220, 30, 0.3);
  border-color: rgba(252, 220, 30, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.avis-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  gap: 15px;
}

.avis-info {
  flex: 1;
}

.avis-presta {
  color: #FCDC1E;
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.avis-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-weight: 300;
}

.avis-rating {
  display: flex;
  gap: 3px;
}

.star {
  color: rgba(252, 220, 30, 0.3);
  font-size: 1.3rem;
}

.star.filled {
  color: #FCDC1E;
  text-shadow: 0 0 10px rgba(252, 220, 30, 0.5);
}

.avis-commentaire {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  margin-bottom: 15px;
  font-size: 1rem;
  font-weight: 300;
}

.avis-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.avis-auteur {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-style: italic;
  font-weight: 300;
}

.no-avis {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.2rem;
  padding: 60px 20px;
  font-style: italic;
  font-weight: 300;
}

/* Responsive */
@media screen and (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
    letter-spacing: 2px;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .avis-hero {
    height: 50vh;
    min-height: 400px;
  }

  .form-container {
    padding: 40px 25px;
  }

  .form-header h2 {
    font-size: 2rem;
  }

  .avis-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 2.2rem;
  }
}

@media screen and (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .form-container {
    padding: 30px 20px;
  }

  .form-header h2 {
    font-size: 1.8rem;
  }

  .rating-input {
    gap: 5px;
  }

  .star-btn {
    font-size: 2rem;
  }

  .section-title {
    font-size: 1.8rem;
  }
}
</style>

