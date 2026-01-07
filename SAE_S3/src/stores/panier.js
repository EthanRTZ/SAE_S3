import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const usePanierStore = defineStore('panier', () => {
  const items = ref([])
  const currentUserEmail = ref('')

  // Charger le panier depuis localStorage au démarrage
  const loadPanier = () => {
    try {
      const raw = localStorage.getItem('panier')
      const userRaw = localStorage.getItem('authUser')

      if (userRaw) {
        const user = JSON.parse(userRaw)
        currentUserEmail.value = user.email || ''
      } else {
        currentUserEmail.value = ''
      }

      if (raw) {
        const parsed = JSON.parse(raw)
        const panierUserEmail = parsed.userEmail || ''

        // Si l'utilisateur du panier est différent de l'utilisateur actuel, vider le panier
        if (panierUserEmail && panierUserEmail !== currentUserEmail.value) {
          items.value = []
          savePanier()
          return
        }

        items.value = parsed.items || []
      }
    } catch (e) {
      items.value = []
    }
  }

  // Sauvegarder le panier dans localStorage
  const savePanier = () => {
    const data = {
      userEmail: currentUserEmail.value,
      items: items.value
    }
    localStorage.setItem('panier', JSON.stringify(data))
  }

  // Ajouter un article au panier
  const addItem = (item) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    items.value.push({
      id,
      ...item,
      addedAt: new Date().toISOString()
    })
    savePanier()
  }

  // Supprimer un article du panier
  const removeItem = (itemId) => {
    const removedItem = items.value.find(item => item.id === itemId)
    items.value = items.value.filter(item => item.id !== itemId)
    savePanier()

    // Émettre un événement personnalisé pour informer de la suppression
    if (typeof window !== 'undefined' && removedItem) {
      window.dispatchEvent(new CustomEvent('panier-item-removed', {
        detail: removedItem
      }))
    }
  }

  // Vider le panier
  const clearPanier = () => {
    // Émettre un événement pour chaque article avant de vider
    if (typeof window !== 'undefined') {
      items.value.forEach(item => {
        window.dispatchEvent(new CustomEvent('panier-item-removed', {
          detail: item
        }))
      })
    }

    items.value = []
    currentUserEmail.value = ''
    savePanier()
  }

  // Vider le panier après paiement (sans restaurer le stock)
  const clearPanierAfterPayment = () => {
    // Sauvegarder les réservations de basket avant de vider
    const basketItems = items.value.filter(item => item.type === 'basket')
    if (basketItems.length > 0) {
      try {
        const existingRaw = localStorage.getItem('basketReservations')
        const existing = existingRaw ? JSON.parse(existingRaw) : []
        const newReservations = basketItems.map(item => ({
          date: item.date,
          slot: item.slot,
          endTime: item.endTime,
          nbPlayers: item.nbPlayers,
          reservedAt: new Date().toISOString()
        }))
        localStorage.setItem('basketReservations', JSON.stringify([...existing, ...newReservations]))
      } catch (e) {
        console.error('Erreur sauvegarde réservations basket:', e)
      }
    }

    // Ne pas émettre d'événements - les places restent réservées
    items.value = []
    savePanier()
  }

  // Nombre total d'articles
  const itemCount = computed(() => items.value.length)

  // Quantité totale
  const totalQuantity = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.quantity || 1), 0)
  })

  // Vérifier si l'utilisateur a changé
  const checkUserChange = () => {
    try {
      const userRaw = localStorage.getItem('authUser')
      const newUserEmail = userRaw ? JSON.parse(userRaw).email || '' : ''

      // Si l'utilisateur a changé, vider le panier
      if (currentUserEmail.value !== newUserEmail) {
        // Émettre un événement pour chaque article avant de vider
        if (typeof window !== 'undefined') {
          items.value.forEach(item => {
            window.dispatchEvent(new CustomEvent('panier-item-removed', {
              detail: item
            }))
          })
        }

        items.value = []
        currentUserEmail.value = newUserEmail
        savePanier()
      }
    } catch (e) {
      // ignore
    }
  }

  // Initialiser le panier
  loadPanier()

  // Écouter les changements d'authentification
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-changed', checkUserChange)
    window.addEventListener('storage', loadPanier)
  }

  return {
    items,
    itemCount,
    totalQuantity,
    addItem,
    removeItem,
    clearPanier,
    clearPanierAfterPayment,
    loadPanier,
    checkUserChange
  }
})
