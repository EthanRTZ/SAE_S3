import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useAuthStore } from './stores/auth'

const app = createApp(App)


const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')

// Charger l'utilisateur connecté depuis le localStorage après le montage de l'app
const authStore = useAuthStore()
authStore.loadFromStorage()

