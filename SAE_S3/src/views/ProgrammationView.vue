<template>
  <div class="programmation">
    <div class="container">
      <h1 class="title">Programmation</h1>

      <!-- Bandeau titres de scènes -->
      <div class="stages-header">
        <div class="stage-title" v-for="s in stages" :key="s.name">
          <div class="stage-name">{{ s.name }}</div>
          <div v-if="s.by" class="stage-by">by {{ s.by }}</div>
        </div>
      </div>

      <!-- Grille: colonne heures + colonnes par scène -->
      <div class="grid">
        <div class="time-col">
          <div v-for="t in times" :key="t" class="time-cell">{{ t }}</div>
        </div>
        <div v-for="s in stages" :key="s.name" class="stage-col">
          <div class="stage-slot-container">
            <div 
              v-for="(slot, idx) in schedule[s.name]" 
              :key="idx" 
              class="slot"
              :style="getSlotStyle(slot)"
            >
              <div class="slot-time">{{ slot.start }}–{{ slot.end }}</div>
              <div class="slot-artist">{{ slot.artist }}</div>
              <div v-if="slot.style" class="slot-style">{{ slot.style }}</div>
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
      // Heures affichées en colonne de gauche
      times: ['15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','00:00','01:00','02:00','03:00'],
      // Noms de scènes comme sur l'affiche
      stages: [
        { name: 'MOTHERSHIP', by: 'SNIPES' },
        { name: 'ZERO GRAVITY', by: 'DEEZER' },
        { name: 'CARGO', by: 'JBL' },
        { name: 'ANTDT CLUB', by: 'ANTDT' },
      ],
      // Programmation simplifiée (basée sur artistes de bdd.sql)
      schedule: {
        'MOTHERSHIP': [
          { start: '19:00', end: '19:45', artist: 'Ninho', style: 'Rap français' },
          { start: '22:00', end: '23:00', artist: 'Booba', style: 'Rap français' },
        ],
        'ZERO GRAVITY': [
          { start: '18:00', end: '18:45', artist: 'SDM', style: 'Rap français' },
          { start: '20:00', end: '20:45', artist: 'SCH', style: 'Rap français' },
          { start: '21:00', end: '21:45', artist: 'Vald', style: 'Rap' },
        ],
        'CARGO': [
          { start: '19:00', end: '19:45', artist: 'Josman', style: 'Rap français' },
          { start: '21:00', end: '21:45', artist: 'Gims', style: 'Pop / Rap' },
        ],
        'ANTDT CLUB': [
          { start: '18:00', end: '18:45', artist: 'DJ Set', style: 'Club' },
          { start: '22:00', end: '23:00', artist: 'After Party', style: 'Club' },
        ],
      },
    }
  },
  methods: {
    // Convertit une heure (HH:MM) en minutes depuis minuit
    timeToMinutes(time) {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
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
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0011E2 0%, #000428 100%);
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

.grid {
  display: grid;
  grid-template-columns: 90px repeat(4, 1fr);
  gap: 12px;
}

.time-col {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 720px;
  justify-content: space-between;
}
.time-cell {
  color: #FCDC1E;
  font-weight: 800;
  text-align: right;
  padding-right: 6px;
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
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
  padding: 8px 10px;
  border: 2px solid #FCDC1E;
  box-shadow: 0 6px 12px rgba(252, 220, 30, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  box-sizing: border-box;
  gap: 2px;
}
.slot-time { 
  font-weight: 700; 
  font-size: 0.7rem; 
  line-height: 1;
  margin-bottom: 2px;
  opacity: 0.85;
}
.slot-artist { 
  font-weight: 900; 
  font-size: 1.1rem; 
  line-height: 1.2;
  flex: 1;
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

@media screen and (max-width: 900px) {
  .stages-header { grid-template-columns: repeat(2, 1fr); }
  .grid { grid-template-columns: 70px repeat(2, 1fr); }
}
@media screen and (max-width: 560px) {
  .stages-header { grid-template-columns: 1fr; }
  .grid { grid-template-columns: 60px 1fr; }
}
</style>


