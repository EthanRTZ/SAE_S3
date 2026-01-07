import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

// Récupérer la langue sauvegardée ou utiliser 'fr' par défaut
const savedLocale = localStorage.getItem('app-locale') || 'fr'

const i18n = createI18n({
  locale: savedLocale,
  fallbackLocale: 'fr',
  messages: {
    fr,
    en
  },
  legacy: false, // Utiliser la Composition API
  globalInjection: true, // Permet d'utiliser $t dans les templates
  allowComposition: true // Nécessaire pour v11
})

export default i18n

