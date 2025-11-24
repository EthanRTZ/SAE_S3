<template>
  <div class="programmation">
    <div class="container">
      <h1 class="title">Programmation</h1>

      <!-- Sélecteur de jours -->
      <div class="days-selector">
        <button 
          v-for="(day, index) in days" 
          :key="index"
          :class="['day-button', { active: selectedDay === index }]"
          @click="selectedDay = index"
        >
          {{ day.label }}
        </button>
      </div>

      <!-- Grille: colonne heures + colonnes par scène -->
      <div v-if="loading" class="loading-message">
        Chargement de la programmation...
      </div>
      <div v-else class="schedule-container">
        <!-- Colonne des heures à gauche -->
        <div class="time-col">
          <div class="time-header"></div>
          <div class="time-container">
            <div 
              v-for="t in times" 
              :key="t" 
              class="time-cell"
              :style="getTimeStyle(t)"
            >
              {{ t }}
            </div>
          </div>
        </div>
        
        <!-- Partie droite avec header et grille -->
        <div class="stages-section">
          <!-- Bandeau titres de scènes -->
          <div class="stages-header">
            <div class="stage-title" v-for="s in stages" :key="s.name">
              <div class="stage-name">{{ s.name }}</div>
              <div v-if="s.by" class="stage-by">by {{ s.by }}</div>
            </div>
          </div>

          <!-- Grille des scènes -->
          <div class="grid-wrapper">
            <!-- Lignes horizontales pour chaque heure -->
            <div class="time-lines">
              <div 
                v-for="t in times" 
                :key="t" 
                class="time-line"
                :style="getTimeLineStyle(t)"
              ></div>
            </div>
            
            <div class="grid">
              <div v-for="s in stages" :key="s.name" class="stage-col">
                <div class="stage-slot-container">
                  <div 
                    v-for="(slot, idx) in (currentSchedule[s.name] || [])" 
                    :key="idx" 
                    class="slot"
                    :style="getSlotStyle(slot)"
                  >
                    <div class="slot-time">{{ slot.start }}–{{ slot.end }}</div>
                    <div class="slot-artist">{{ slot.artist }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="notes">
        OUVERTURE DES PORTES — 15:00 • FERMETURE — 3:00
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProgrammationView',
  data() {
    return {
      selectedDay: 0,
      days: [
        { label: 'Vendredi 15', date: '15/06' },
        { label: 'Samedi 16', date: '16/06' },
        { label: 'Dimanche 17', date: '17/06' },
      ],
      // Heures affichées en colonne de gauche
      times: ['15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','00:00','01:00','02:00','03:00'],
      // Données chargées depuis le JSON
      stages: [],
      schedules: [],
      loading: true,
    }
  },
  async mounted() {
    try {
      const response = await fetch('/data/programmation.json');
      const data = await response.json();
      this.stages = data.stages || [];
      this.schedules = data.schedules || [];
      this.loading = false;
    } catch (error) {
      console.error('Erreur lors du chargement des données de programmation:', error);
      this.loading = false;
    }
  },
  computed: {
    currentSchedule() {
      return this.schedules[this.selectedDay] || {};
    },
  },
  methods: {
    // Convertit une heure (HH:MM) en minutes depuis minuit
    timeToMinutes(time) {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    },
    // Calcule le style de positionnement pour une heure
    getTimeStyle(time) {
      const timeMinutes = this.timeToMinutes(time);
      const gridStartMinutes = this.timeToMinutes('15:00');
      
      // Position relative au début de la grille
      let topMinutes = timeMinutes - gridStartMinutes;
      
      // Si l'heure est après minuit, ajuster
      if (topMinutes < 0) {
        topMinutes = timeMinutes + 24 * 60 - gridStartMinutes;
      }
      
      // Hauteur totale de la grille (de 15:00 à 03:00 = 12 heures = 720 minutes)
      const gridHeightMinutes = 12 * 60;
      
      // Calcul en pourcentage
      const topPercent = Math.max(0, (topMinutes / gridHeightMinutes) * 100);
      
      return {
        position: 'absolute',
        top: `${topPercent}%`,
        marginTop: '0',
        lineHeight: '1',
      };
    },
    // Calcule le style de positionnement pour une ligne d'heure
    getTimeLineStyle(time) {
      const timeMinutes = this.timeToMinutes(time);
      const gridStartMinutes = this.timeToMinutes('15:00');
      
      // Position relative au début de la grille
      let topMinutes = timeMinutes - gridStartMinutes;
      
      // Si l'heure est après minuit, ajuster
      if (topMinutes < 0) {
        topMinutes = timeMinutes + 24 * 60 - gridStartMinutes;
      }
      
      // Hauteur totale de la grille (de 15:00 à 03:00 = 12 heures = 720 minutes)
      const gridHeightMinutes = 12 * 60;
      
      // Calcul en pourcentage
      const topPercent = Math.max(0, (topMinutes / gridHeightMinutes) * 100);
      
      return {
        position: 'absolute',
        top: `${topPercent}%`,
        left: '0',
        right: '0',
      };
    },
    // Calcule le style de positionnement pour un créneau
    getSlotStyle(slot) {
      const startMinutes = this.timeToMinutes(slot.start);
      let endMinutes = this.timeToMinutes(slot.end);
      
      // Si l'heure de fin est après minuit (ex: 00:00, 01:00, 02:00), ajouter 24h
      if (endMinutes < startMinutes || (startMinutes >= 23 * 60 && endMinutes <= 2 * 60)) {
        endMinutes = endMinutes + 24 * 60;
      }
      
      // Heure de début de la grille (15:00 = 15*60 = 900 minutes)
      const gridStartMinutes = this.timeToMinutes('15:00');
      
      // Position relative au début de la grille
      let topMinutes = startMinutes - gridStartMinutes;
      
      // Si l'heure de début est après minuit, ajuster
      if (topMinutes < 0) {
        topMinutes = startMinutes + 24 * 60 - gridStartMinutes;
      }
      
      // Durée du créneau
      const duration = endMinutes - startMinutes;
      
      // Hauteur totale de la grille (de 15:00 à 03:00 = 12 heures = 720 minutes)
      const gridHeightMinutes = 12 * 60; // 12 heures
      
      // Calcul en pourcentage
      const topPercent = Math.max(0, (topMinutes / gridHeightMinutes) * 100);
      const heightPercent = Math.min(100, (duration / gridHeightMinutes) * 100);
      
      return {
        position: 'absolute',
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        width: 'calc(100% - 20px)',
        left: '10px',
        right: '10px',
      };
    },
  },
}
</script>

<style scoped>
.programmation {
  background: linear-gradient(to bottom, #6f47c1 0%, #1629bf 50%, #11338A 100%);
  min-height: calc(100vh - 70px);
  padding: 88px 16px 24px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
}

.title {
  color: #FCDC1E;
  font-size: 2.4rem;
  margin-bottom: 12px;
}

.days-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

.day-button {
  background: transparent;
  border: 2px solid #FCDC1E;
  color: #FCDC1E;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-button:hover {
  background: rgba(252, 220, 30, 0.1);
  transform: translateY(-2px);
}

.day-button.active {
  background: #FCDC1E;
  color: #0b0b0b;
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
}

.schedule-container {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.time-col {
  position: relative;
  width: 90px;
  flex-shrink: 0;
}

.time-header {
  height: 72px;
  margin-bottom: 6px;
}

.time-container {
  position: relative;
  width: 100%;
  height: 720px;
}

.time-cell {
  color: #FCDC1E;
  font-weight: 800;
  text-align: right;
  padding-right: 6px;
  white-space: nowrap;
  z-index: 2;
}

.stages-section {
  flex: 1;
}

.stages-header {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.stage-title {
  border: 2px solid #FCDC1E;
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  color: #FCDC1E;
}
.stage-name { font-weight: 900; letter-spacing: 0.5px; }
.stage-by { font-size: 0.8rem; opacity: 0.8; margin-top: 2px; }

.grid-wrapper {
  position: relative;
  min-height: 720px;
}

.time-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 720px;
  pointer-events: none;
  z-index: 0;
}

.time-line {
  position: absolute;
  height: 1px;
  background: rgba(252, 220, 30, 0.25);
  width: 100%;
  left: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  position: relative;
  z-index: 1;
}

.stage-col {
  position: relative;
  min-height: 720px; /* Hauteur correspondant à 12 heures (15:00 à 03:00) */
}

.stage-slot-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 720px;
}

.slot {
  background: #FCDC1E;
  color: #0b0b0b;
  border-radius: 10px;
  padding: 2px 10px;
  border: 2px solid #FCDC1E;
  box-shadow: 0 6px 12px rgba(252, 220, 30, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box;
  gap: 2px;
  text-align: center;
  position: relative;
  z-index: 3;
}
.slot-time { 
  font-weight: 700; 
  font-size: 0.7rem; 
  line-height: 1;
  opacity: 0.85;
  text-align: center;
}
.slot-artist { 
  font-weight: 900; 
  font-size: 1.1rem; 
  line-height: 1.2;
  text-align: center;
}
.slot-style { 
  font-size: 0.75rem; 
  opacity: 0.8; 
  margin-top: auto;
}

.notes {
  color: #FCDC1E;
  text-align: center;
  margin-top: 16px;
  font-weight: 800;
}

.loading-message {
  color: #FCDC1E;
  text-align: center;
  padding: 40px 20px;
  font-weight: 800;
  font-size: 1.2rem;
}

@media screen and (max-width: 900px) {
  .stages-header { grid-template-columns: repeat(2, 1fr); }
  .grid { grid-template-columns: repeat(2, 1fr); }
  .time-col { width: 70px; }
}
@media screen and (max-width: 560px) {
  .stages-header { grid-template-columns: 1fr; }
  .grid { grid-template-columns: 1fr; }
  .time-col { width: 60px; }
}
</style>
