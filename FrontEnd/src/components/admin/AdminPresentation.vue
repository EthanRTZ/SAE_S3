<script setup>
import { ref, computed, watch } from 'vue'
import WysiwygEditor from '@/components/WysiwygEditor.vue'

const props = defineProps({
  festivalPresentation: {
    type: Object,
    default: () => ({
      fr: {},
      en: {}
    })
  },
  editingLang: { type: String, default: 'fr' }
})

const emit = defineEmits(['save', 'changeLang', 'reset'])

// Sous-section active
const presentationSubSection = ref('hero')

// Sections disponibles
const presentationSections = [
  { id: 'hero', label: 'Hero / Bannière', icon: '🎯' },
  { id: 'about', label: 'Le Festival (3 cartes)', icon: '📋' },
  { id: 'desc1', label: 'Description 1', icon: '📝' },
  { id: 'desc2', label: 'Description 2', icon: '📝' },
  { id: 'cta', label: 'Appel à l\'action', icon: '🎯' },
  { id: 'map', label: 'Carte', icon: '🗺️' }
]

// Copie locale pour l'édition
const localPresentation = ref({
  fr: { ...props.festivalPresentation.fr },
  en: { ...props.festivalPresentation.en }
})

// Watcher pour synchroniser avec les props
watch(() => props.festivalPresentation, (newVal) => {
  localPresentation.value = {
    fr: { ...newVal.fr },
    en: { ...newVal.en }
  }
}, { deep: true })

// Computed pour accéder/modifier la présentation de la langue en cours
const currentPresentation = computed({
  get: () => {
    const lang = props.editingLang
    if (!localPresentation.value[lang]) {
      localPresentation.value[lang] = {}
    }
    return localPresentation.value[lang]
  },
  set: (value) => {
    localPresentation.value[props.editingLang] = { ...value }
  }
})

const selectPresentationSection = (sectionId) => {
  presentationSubSection.value = sectionId
}

const onSave = () => {
  emit('save', { ...localPresentation.value })
}

const onReset = () => {
  emit('reset')
}
</script>

<template>
  <div class="section-content">
    <div class="section-header">
      <h1 class="section-title">Présentation du festival</h1>
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
        <label style="font-weight: 600; color: rgba(255, 255, 255, 0.9);">Langue d'édition :</label>
        <div style="display: flex; gap: 0.5rem;">
          <button
            @click="$emit('changeLang', 'fr')"
            :class="['pres-lang-btn', { 'pres-lang-btn-active': editingLang === 'fr' }]"
          >
            🇫🇷 Français
          </button>
          <button
            @click="$emit('changeLang', 'en')"
            :class="['pres-lang-btn', { 'pres-lang-btn-active': editingLang === 'en' }]"
          >
            🇬🇧 English
          </button>
        </div>
      </div>
      <button @click="onReset" class="pres-btn-reset-header">
        <span class="pres-btn-icon">🔄</span>
        <span class="pres-btn-text">Réinitialiser</span>
      </button>
    </div>

    <div class="pres-config-wrapper">
      <div class="pres-intro-card">
        <div class="pres-intro-icon">📝</div>
        <div class="pres-intro-content">
          <h3>Personnalisez la présentation</h3>
          <p>Modifiez tous les textes affichés sur la page d'accueil du festival. Utilisez l'éditeur WYSIWYG pour formater vos textes avec du gras, de l'italique, des listes et plus encore.</p>
        </div>
      </div>

      <!-- Menu de navigation des sous-sections -->
      <div class="pres-tabs-container">
        <div class="pres-tabs-scroll">
          <button
            v-for="section in presentationSections"
            :key="section.id"
            @click="selectPresentationSection(section.id)"
            :class="['pres-tab-btn', { 'pres-tab-active': presentationSubSection === section.id }]"
          >
            <span class="pres-tab-icon">{{ section.icon }}</span>
            <span class="pres-tab-label">{{ section.label }}</span>
          </button>
        </div>
      </div>

      <div class="pres-editor-container">
        <!-- Section Hero -->
        <div v-if="presentationSubSection === 'hero'" class="pres-section-card">
          <div class="pres-section-header">
            <div class="pres-section-icon">🎯</div>
            <div class="pres-section-title-wrapper">
              <h3 class="pres-section-title">Section Hero</h3>
              <p class="pres-section-subtitle">Bannière principale de la page d'accueil</p>
            </div>
          </div>

          <div class="pres-section-body">
            <div class="pres-form-group">
              <label class="pres-form-label">Titre principal</label>
              <WysiwygEditor
                v-model="currentPresentation.titre"
                :height="300"
                :placeholder="editingLang === 'fr' ? 'GOLDEN COAST FESTIVAL V3' : 'GOLDEN COAST FESTIVAL V3'"
              />
            </div>

            <div class="pres-form-row">
              <div class="pres-form-group">
                <label class="pres-form-label">Date</label>
                <WysiwygEditor
                  v-model="currentPresentation.date"
                  :height="400"
                  :placeholder="editingLang === 'fr' ? '28 - 29 - 30 août 2026' : 'August 28 - 29 - 30, 2026'"
                />
              </div>

              <div class="pres-form-group">
                <label class="pres-form-label">Lieu</label>
                <WysiwygEditor
                  v-model="currentPresentation.lieu"
                  :height="400"
                  placeholder="CORCELLES-LES-MONTS • DIJON"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Section About (3 cards) -->
        <div v-if="presentationSubSection === 'about'" class="pres-section-card">
          <div class="pres-section-header">
            <div class="pres-section-icon">📋</div>
            <div class="pres-section-title-wrapper">
              <h3 class="pres-section-title">Section "Le Festival"</h3>
              <p class="pres-section-subtitle">Les 3 cartes de présentation principales</p>
            </div>
          </div>

          <div class="pres-section-body">
            <!-- Card 1 -->
            <div class="pres-card-editor">
              <div class="pres-card-header">
                <span class="pres-card-badge">Card 1</span>
                <h4 class="pres-card-title">Première carte</h4>
              </div>
              <div class="pres-form-group">
                <label class="pres-form-label">Titre</label>
                <WysiwygEditor
                  v-model="currentPresentation.aboutCard1Titre"
                  :height="300"
                  :placeholder="editingLang === 'fr' ? '100% RAP FR' : '100% FRENCH RAP'"
                />
              </div>
              <div class="pres-form-group">
                <label class="pres-form-label">Texte</label>
                <WysiwygEditor
                  v-model="currentPresentation.aboutCard1Texte"
                  :height="300"
                  :placeholder="editingLang === 'fr' ? 'Description de la première carte...' : 'First card description...'"
                />
              </div>
            </div>

            <!-- Card 2 -->
            <div class="pres-card-editor">
              <div class="pres-card-header">
                <span class="pres-card-badge">Card 2</span>
                <h4 class="pres-card-title">Deuxième carte</h4>
              </div>
              <div class="pres-form-group">
                <label class="pres-form-label">Titre</label>
                <WysiwygEditor
                  v-model="currentPresentation.aboutCard2Titre"
                  :height="300"
                  :placeholder="editingLang === 'fr' ? 'SITE NATUREL' : 'NATURAL SITE'"
                />
              </div>
              <div class="pres-form-group">
                <label class="pres-form-label">Texte</label>
                <WysiwygEditor
                  v-model="currentPresentation.aboutCard2Texte"
                  :height="300"
                  :placeholder="editingLang === 'fr' ? 'Description de la deuxième carte...' : 'Second card description...'"
                />
              </div>
            </div>

            <!-- Card 3 -->
            <div class="pres-card-editor">
              <div class="pres-card-header">
                <span class="pres-card-badge">Card 3</span>
                <h4 class="pres-card-title">Troisième carte</h4>
              </div>
              <div class="pres-form-group">
                <label class="pres-form-label">Titre</label>
                <WysiwygEditor
                  v-model="currentPresentation.aboutCard3Titre"
                  :height="300"
                  :placeholder="editingLang === 'fr' ? '52 000 FESTIVALIERS' : '52,000 FESTIVAL-GOERS'"
                />
              </div>
              <div class="pres-form-group">
                <label class="pres-form-label">Texte</label>
                <WysiwygEditor
                  v-model="currentPresentation.aboutCard3Texte"
                  :height="300"
                  :placeholder="editingLang === 'fr' ? 'Description de la troisième carte...' : 'Third card description...'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Section Description 1 -->
        <div v-if="presentationSubSection === 'desc1'" class="pres-section-card">
          <div class="pres-section-header">
            <div class="pres-section-icon">📝</div>
            <div class="pres-section-title-wrapper">
              <h3 class="pres-section-title">Description 1</h3>
              <p class="pres-section-subtitle">Première section descriptive avec points forts</p>
            </div>
          </div>

          <div class="pres-section-body">
            <div class="pres-form-group">
              <label class="pres-form-label">Titre</label>
              <WysiwygEditor
                v-model="currentPresentation.desc1Titre"
                :height="300"
                :placeholder="editingLang === 'fr' ? 'Le rendez-vous des fans de rap' : 'The meeting place for rap fans'"
              />
            </div>

            <div class="pres-form-group">
              <label class="pres-form-label">Texte principal</label>
              <WysiwygEditor
                v-model="currentPresentation.desc1Texte"
                :height="450"
                :placeholder="editingLang === 'fr' ? 'Décrivez l\'expérience du festival...' : 'Describe the festival experience...'"
              />
            </div>

            <div class="pres-form-row">
              <div class="pres-form-group">
                <label class="pres-form-label">Point fort 1</label>
                <WysiwygEditor
                  v-model="currentPresentation.desc1Chip1"
                  :height="300"
                  :placeholder="editingLang === 'fr' ? 'Premier point fort' : 'First highlight'"
                />
              </div>

              <div class="pres-form-group">
                <label class="pres-form-label">Point fort 2</label>
                <WysiwygEditor
                  v-model="currentPresentation.desc1Chip2"
                  :height="300"
                  :placeholder="editingLang === 'fr' ? 'Deuxième point fort' : 'Second highlight'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Section Description 2 -->
        <div v-if="presentationSubSection === 'desc2'" class="pres-section-card">
          <div class="pres-section-header">
            <div class="pres-section-icon">📝</div>
            <div class="pres-section-title-wrapper">
              <h3 class="pres-section-title">Description 2</h3>
              <p class="pres-section-subtitle">Deuxième section descriptive détaillée</p>
            </div>
          </div>

          <div class="pres-section-body">
            <div class="pres-form-group">
              <label class="pres-form-label">Titre</label>
              <WysiwygEditor
                v-model="currentPresentation.desc2Titre"
                :height="300"
                :placeholder="editingLang === 'fr' ? 'Une immersion totale' : 'Total immersion'"
              />
            </div>

            <div class="pres-form-group">
              <label class="pres-form-label">Texte principal</label>
              <WysiwygEditor
                v-model="currentPresentation.desc2Texte"
                :height="500"
                :placeholder="editingLang === 'fr' ? 'Détaillez l\'ambiance et l\'expérience...' : 'Detail the atmosphere and experience...'"
              />
            </div>
          </div>
        </div>

        <!-- Section CTA -->
        <div v-if="presentationSubSection === 'cta'" class="pres-section-card">
          <div class="pres-section-header">
            <div class="pres-section-icon">🎯</div>
            <div class="pres-section-title-wrapper">
              <h3 class="pres-section-title">Appel à l'action</h3>
              <p class="pres-section-subtitle">Incitation à réserver des billets</p>
            </div>
          </div>

          <div class="pres-section-body">
            <div class="pres-form-group">
              <label class="pres-form-label">Titre</label>
              <WysiwygEditor
                v-model="currentPresentation.ctaTitre"
                :height="300"
                :placeholder="editingLang === 'fr' ? 'PRÊT À VIVRE L\'EXPÉRIENCE ?' : 'READY TO LIVE THE EXPERIENCE?'"
              />
            </div>

            <div class="pres-form-group">
              <label class="pres-form-label">Texte</label>
              <WysiwygEditor
                v-model="currentPresentation.ctaTexte"
                :height="250"
                :placeholder="editingLang === 'fr' ? 'Message d\'invitation...' : 'Invitation message...'"
              />
            </div>

            <div class="pres-form-group">
              <label class="pres-form-label">Texte du bouton</label>
              <WysiwygEditor
                v-model="currentPresentation.ctaBouton"
                :height="250"
                :placeholder="editingLang === 'fr' ? 'RÉSERVER MA PLACE' : 'BOOK MY SPOT'"
              />
            </div>
          </div>
        </div>

        <!-- Section Map -->
        <div v-if="presentationSubSection === 'map'" class="pres-section-card">
          <div class="pres-section-header">
            <div class="pres-section-icon">🗺️</div>
            <div class="pres-section-title-wrapper">
              <h3 class="pres-section-title">Section Carte</h3>
              <p class="pres-section-subtitle">Introduction de la carte interactive</p>
            </div>
          </div>

          <div class="pres-section-body">
            <div class="pres-form-group">
              <label class="pres-form-label">Titre</label>
              <WysiwygEditor
                v-model="currentPresentation.mapTitre"
                :height="300"
                :placeholder="editingLang === 'fr' ? 'LOCALISATION' : 'LOCATION'"
              />
            </div>

            <div class="pres-form-group">
              <label class="pres-form-label">Texte d'introduction</label>
              <WysiwygEditor
                v-model="currentPresentation.mapIntro"
                :height="250"
                :placeholder="editingLang === 'fr' ? 'Retrouvez tous les points d\'intérêt...' : 'Find all the points of interest...'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions globales en bas de page -->
    <div class="pres-editor-actions">
      <button @click="onSave" class="pres-btn-save-main">
        <span class="pres-btn-icon">💾</span>
        <span class="pres-btn-text">Sauvegarder toutes les modifications</span>
        <span class="pres-btn-shine"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Variables CSS */
:root {
  --yellow: #fcdc1e;
  --purple: #a855f7;
  --blue: #3b82f6;
  --green: #22c55e;
  --orange: #f97316;
  --text: rgba(226, 232, 240, 0.95);
  --text-muted: rgba(226, 232, 240, 0.7);
  --border: rgba(255, 255, 255, 0.15);
  --border-light: rgba(255, 255, 255, 0.1);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.section-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-title {
  color: var(--yellow);
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0 0 32px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.section-header {
  margin-bottom: 32px;
}

.pres-config-wrapper {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.pres-intro-card {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.2);
}

.pres-intro-icon {
  font-size: 3.5rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.2));
  border-radius: 20px;
  border: 2px solid rgba(168, 85, 247, 0.4);
  flex-shrink: 0;
  filter: drop-shadow(0 4px 12px rgba(168, 85, 247, 0.5));
}

.pres-intro-content {
  flex: 1;
}

.pres-intro-content h3 {
  color: var(--purple);
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pres-intro-content p {
  color: var(--text);
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
}

.pres-tabs-container {
  margin-bottom: 28px;
  overflow: hidden;
  border-radius: 16px;
  border: 2px solid var(--border-light);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: var(--shadow-sm);
}

.pres-tabs-scroll {
  display: flex;
  overflow-x: auto;
  gap: 4px;
  padding: 10px;
  scrollbar-width: thin;
  scrollbar-color: var(--purple) transparent;
}

.pres-tabs-scroll::-webkit-scrollbar {
  height: 6px;
}

.pres-tabs-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.pres-tabs-scroll::-webkit-scrollbar-thumb {
  background: var(--purple);
  border-radius: 3px;
}

.pres-tab-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border: none;
  background: transparent;
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  white-space: nowrap;
}

.pres-tab-btn:hover {
  background: rgba(168, 85, 247, 0.15);
  color: var(--purple);
  transform: translateY(-2px);
}

.pres-tab-active {
  background: linear-gradient(135deg, var(--purple) 0%, #a78bfa 100%) !important;
  color: #fff !important;
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);
  font-weight: 700;
}

.pres-tab-icon {
  font-size: 1.2rem;
}

.pres-tab-label {
  font-weight: inherit;
}

.pres-editor-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.pres-section-card {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 2px solid var(--border);
  border-radius: 20px;
  padding: 36px;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.pres-section-card:hover {
  border-color: var(--purple);
  box-shadow: 0 12px 48px rgba(168, 85, 247, 0.2);
}

.pres-section-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid var(--border-light);
}

.pres-section-icon {
  font-size: 2.5rem;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(168, 85, 247, 0.15));
  border-radius: 16px;
  border: 2px solid rgba(168, 85, 247, 0.4);
}

.pres-section-title-wrapper {
  flex: 1;
}

.pres-section-title {
  color: var(--purple);
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.pres-section-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.pres-section-body {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.pres-card-editor {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid var(--border-light);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.pres-card-editor:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--purple);
}

.pres-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.pres-card-badge {
  background: linear-gradient(135deg, var(--purple) 0%, #a78bfa 100%);
  color: #fff;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
}

.pres-card-title {
  color: var(--text);
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0;
}

.pres-form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pres-form-label {
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pres-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.pres-lang-btn {
  padding: 0.5rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pres-lang-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.pres-lang-btn-active {
  background: linear-gradient(135deg, #a855f7 0%, #818cf8 100%);
  border-color: #a855f7;
  color: #fff;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.pres-lang-btn-active:hover {
  background: linear-gradient(135deg, #a855f7 0%, #818cf8 100%);
  border-color: #a855f7;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
}

.pres-btn-reset-header {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.pres-btn-reset-header::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  transform: translate(-50%, -50%);
  transition: width 0.5s ease, height 0.5s ease;
}

.pres-btn-reset-header:hover::before {
  width: 400px;
  height: 400px;
}

.pres-btn-reset-header:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15);
}

.pres-btn-reset-header:active {
  transform: translateY(0);
}

.pres-btn-icon {
  position: relative;
  z-index: 2;
}

.pres-btn-text {
  position: relative;
  z-index: 2;
}

.pres-editor-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 48px;
  padding: 40px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(168, 85, 247, 0.08) 100%);
  border: 2px solid var(--border-light);
  border-radius: 24px;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.pres-editor-actions::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
  animation: pulse-background 3s ease-in-out infinite;
}

@keyframes pulse-background {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.pres-btn-save-main {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 20px 48px;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 40px rgba(252, 220, 30, 0.5), 0 0 0 0 rgba(252, 220, 30, 0.4);
  overflow: hidden;
  z-index: 1;
  animation: pulse-shadow 2.5s ease-in-out infinite;
}

@keyframes pulse-shadow {
  0%, 100% {
    box-shadow: 0 10px 40px rgba(252, 220, 30, 0.5), 0 0 0 0 rgba(252, 220, 30, 0.4);
  }
  50% {
    box-shadow: 0 15px 60px rgba(252, 220, 30, 0.7), 0 0 0 8px rgba(252, 220, 30, 0.2);
  }
}

.pres-btn-save-main:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 20px 60px rgba(252, 220, 30, 0.7), 0 0 0 4px rgba(252, 220, 30, 0.3);
  animation: none;
}

.pres-btn-save-main:active {
  transform: translateY(-2px) scale(0.98);
  box-shadow: 0 8px 30px rgba(252, 220, 30, 0.6), 0 0 0 2px rgba(252, 220, 30, 0.4);
}

.pres-btn-save-main::after {
  content: '✨';
  position: absolute;
  top: 50%;
  right: -30px;
  transform: translateY(-50%);
  font-size: 1.2rem;
  opacity: 0;
  transition: all 0.4s ease;
}

.pres-btn-save-main:hover::after {
  right: -10px;
  opacity: 1;
  animation: sparkle 0.8s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { transform: translateY(-50%) scale(1); opacity: 1; }
  50% { transform: translateY(-50%) scale(1.3); opacity: 0.7; }
}

.pres-btn-save-main .pres-btn-icon {
  font-size: 1.3rem;
  position: relative;
  z-index: 2;
  transition: transform 0.3s ease;
}

.pres-btn-save-main:hover .pres-btn-icon {
  transform: scale(1.2) rotate(360deg);
}

.pres-btn-save-main .pres-btn-text {
  position: relative;
  z-index: 2;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pres-btn-save-main:focus {
  outline: none;
  box-shadow: 0 15px 50px rgba(252, 220, 30, 0.8), 0 0 0 6px rgba(252, 220, 30, 0.4);
}

.pres-btn-save-main.loading {
  pointer-events: none;
  opacity: 0.7;
}

.pres-btn-save-main.loading .pres-btn-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pres-btn-shine {
  position: absolute;
  top: -50%;
  left: -100%;
  width: 60%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transform: skewX(-25deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  20%, 100% { left: 200%; }
}

/* Responsive */
@media (max-width: 1024px) {
  .pres-form-row {
    grid-template-columns: 1fr;
  }

  .pres-tabs-scroll {
    justify-content: flex-start;
  }

  .pres-editor-actions {
    padding: 32px 24px;
  }

  .pres-btn-save-main {
    padding: 18px 40px;
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .section-title {
    font-size: 2rem;
  }

  .pres-intro-card {
    flex-direction: column;
    text-align: center;
  }

  .pres-intro-icon {
    width: 64px;
    height: 64px;
    font-size: 2.5rem;
  }

  .pres-section-card {
    padding: 24px;
  }

  .pres-editor-actions {
    flex-direction: column;
    padding: 28px 20px;
  }

  .pres-btn-save-main,
  .pres-btn-reset-header {
    width: 100%;
    justify-content: center;
  }

  .pres-btn-save-main {
    padding: 16px 32px;
  }
}
</style>
