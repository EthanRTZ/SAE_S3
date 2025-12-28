<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WysiwygEditor from '@/components/WysiwygEditor.vue'

const router = useRouter()
const authUser = ref(null)
const loading = ref(true)
const currentSection = ref('dashboard')
const prestataires = ref([])
const prestatairesOriginaux = ref([]) // Données originales pour comparaison
const customPrestataires = ref({}) // Modifications locales
const selectedPrestataire = ref(null)
const users = ref([])
const selectedUser = ref(null)
const isCreatingUser = ref(false)
const newUser = ref({
  email: '',
  password: '',
  role: 'user',
  prestataireNom: ''
})

// Statistiques
const stats = ref({
  totalUsers: 0,
  totalPrestataires: 0,
  totalReservations: 0,
  totalServices: 0,
  totalTickets: 0,
  totalRevenue: 0,
  ticketsParType: {
    oneDay: 0,
    twoDays: 0,
    threeDays: 0,
    parking: 0,
    camping: 0
  },
  notesMoyenne: 0,
  totalAvis: 0,
  repartitionNotes: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  }
})

// Données de programmation
const programmation = ref({ stages: [], schedules: [] })
const programmationOriginaux = ref({ stages: [], schedules: [] })
const selectedDayIndex = ref(0)
const selectedStage = ref('')
const editingSlot = ref(null)

// Données de présentation du festival (éditeur WYSIWYG)
const festivalPresentation = ref({
  // Hero
  titre: 'GOLDEN COAST FESTIVAL V3',
  date: '28 - 29 - 30 août 2026',
  lieu: 'CORCELLES-LES-MONTS • DIJON',

  // Section About (les 3 cards)
  aboutCard1Titre: '100% RAP FR',
  aboutCard1Texte: 'Le plus grand festival entièrement dédié au <strong>rap français</strong> avec les plus grandes têtes d\'affiche et les talents émergents.',
  aboutCard2Titre: 'SITE NATUREL',
  aboutCard2Texte: 'Un cadre exceptionnel à la <strong>Combe à la Serpent</strong>, offrant une expérience unique en pleine nature près de Dijon.',
  aboutCard3Titre: '52 000 FESTIVALIERS',
  aboutCard3Texte: 'Une première édition couronnée de succès qui revient encore plus fort pour <strong>trois jours de culture urbaine</strong>.',

  // Section Description 1
  desc1Titre: 'Le rendez-vous des fans de rap',
  desc1Texte: 'Plonge au cœur de l\'expérience Golden Coast Festival, l\'événement rap français qui transforme la fin de l\'été en un moment d\'exception.<br/><br/>Dans un cadre soigneusement scénographié, tu découvres des performances exclusives, un son trap & boom bap d\'une qualité studio, et des scènes immersives pensées pour sublimer chaque artiste.',
  desc1Chip1: 'Les plus grandes stars du rap français',
  desc1Chip2: 'Boissons & street-food',

  // Section Description 2
  desc2Titre: 'Une immersion totale',
  desc2Texte: 'Entre shows lumineux haute intensité, espaces lifestyle, sélections fripes pointues, et street-food signature, chaque détail est conçu pour offrir une expérience fluide, raffinée et mémorable.<br/><br/>Les afters confidentiels, réservés à ceux qui veulent prolonger l\'instant, ajoutent une touche rare et privilégiée. Le Golden Coast Festival, c\'est plus qu\'un rendez-vous : c\'est l\'événement premium où la culture rap se vit intensément, dans une ambiance exclusive, créative et résolument inoubliable.',

  // Section CTA
  ctaTitre: 'PRÊT À VIVRE L\'EXPÉRIENCE ?',
  ctaTexte: 'Réservez tes billets dès maintenant et rejoignez-nous pour trois jours inoubliables !',
  ctaBouton: 'RÉSERVER MA PLACE',

  // Section Map
  mapTitre: 'LOCALISATION',
  mapIntro: 'Retrouvez tous les points d\'intérêt du festival : scènes, parkings, campings et plus encore.'
})

// Sous-section active pour la présentation
const presentationSubSection = ref('hero')

const presentationSections = [
  { id: 'hero', label: ' Hero / Bannière', icon: '🎯' },
  { id: 'about', label: ' Le Festival (3 cartes)', icon: '📋' },
  { id: 'desc1', label: ' Description 1', icon: '📝' },
  { id: 'desc2', label: ' Description 2', icon: '📝' },
  { id: 'cta', label: ' Appel à l\'action', icon: '🎯' },
  { id: 'map', label: '️ Carte', icon: '🗺️' }
]

const selectPresentationSection = (sectionId) => {
  presentationSubSection.value = sectionId
}

const loadAuthFromStorage = () => {
  try {
    const raw = localStorage.getItem('authUser')
    authUser.value = raw ? JSON.parse(raw) : null
  } catch (e) {
    authUser.value = null
  }
}

const isAdmin = computed(() => authUser.value?.role === 'admin')
const adminEmail = computed(() => authUser.value?.email || '')

const saveUser = () => {
  if (isCreatingUser.value) {
    // Créer un nouvel utilisateur
    if (!newUser.value.email || !newUser.value.password) {
      alert('Email et mot de passe sont obligatoires')
      return
    }

    // Vérifier si l'email existe déjà
    if (users.value.some(u => u.email === newUser.value.email)) {
      alert('Cet email existe déjà')
      return
    }

    users.value.push({ ...newUser.value })
    localStorage.setItem('users', JSON.stringify(users.value))
    alert('Utilisateur créé avec succès!')
    changeSection('users')
  } else if (selectedUser.value) {
    // Modifier un utilisateur existant
    const index = users.value.findIndex(u => u.email === selectedUser.value.email)
    if (index !== -1) {
      users.value[index] = { ...selectedUser.value }
      localStorage.setItem('users', JSON.stringify(users.value))
      alert('Utilisateur modifié avec succès!')
    }
  }
}

const deleteUser = () => {
  if (!selectedUser.value) return

  if (selectedUser.value.email === authUser.value?.email) {
    alert('Vous ne pouvez pas supprimer votre propre compte!')
    return
  }

  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${selectedUser.value.email} ?`)) {
    return
  }

  const index = users.value.findIndex(u => u.email === selectedUser.value.email)
  if (index !== -1) {
    users.value.splice(index, 1)
    localStorage.setItem('users', JSON.stringify(users.value))
    alert('Utilisateur supprimé avec succès!')
    changeSection('users')
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const loadData = async () => {
  if (!isAdmin.value) {
    loading.value = false
    return
  }

  try {
    const [usersResp, prestatairesResp, avisResp] = await Promise.all([
      fetch('/data/users.json', { cache: 'no-store' }),
      fetch('/data/site.json', { cache: 'no-store' }),
      fetch('/data/avis.json', { cache: 'no-store' })
    ])

    const usersData = usersResp.ok ? await usersResp.json() : []
    const prestataireData = prestatairesResp.ok ? await prestatairesResp.json() : { prestataires: [] }
    const avisData = avisResp.ok ? await avisResp.json() : {}

    // Charger les utilisateurs avec modifications locales
    const customUsersRaw = localStorage.getItem('users')
    if (customUsersRaw) {
      try {
        users.value = JSON.parse(customUsersRaw)
      } catch (e) {
        users.value = Array.isArray(usersData) ? usersData : []
      }
    } else {
      users.value = Array.isArray(usersData) ? usersData : []
    }

    // Filtrer uniquement les prestataires présents dans avis.json
    const prestatairesValides = Object.keys(avisData)
    const prestatairesFiltered = (prestataireData.prestataires || []).filter(p =>
      prestatairesValides.includes(p.nom)
    )

    prestatairesOriginaux.value = JSON.parse(JSON.stringify(prestatairesFiltered))

    // Charger les modifications locales
    const customRaw = localStorage.getItem('customPrestataires')
    if (customRaw) {
      try {
        customPrestataires.value = JSON.parse(customRaw)
      } catch (e) {
        customPrestataires.value = {}
      }
    }
    
    // Fusionner les données originales avec les modifications
    prestataires.value = prestatairesFiltered.map(p => {
      const custom = customPrestataires.value[p.nom]
      if (custom) {
        return { ...p, ...custom }
      }
      return p
    })

    const totalServices = prestataires.value.reduce((acc, p) => acc + (p.services?.length || 0), 0)

    // Charger les réservations
    const reservationsRaw = localStorage.getItem('reservations')
    let reservations = []
    if (reservationsRaw) {
      try {
        reservations = JSON.parse(reservationsRaw)
      } catch (e) {
        reservations = []
      }
    }

    // Calculer les stats de tickets
    const ticketsStats = {
      oneDay: 0,
      twoDays: 0,
      threeDays: 0,
      parking: 0,
      camping: 0
    }
    let totalRevenue = 0
    const TARIFS = {
      oneDay: 49,
      twoDays: 89,
      threeDays: 119,
      parking: 15,
      camping: 25
    }

    reservations.forEach(reservation => {
      if (reservation.oneDay) {
        ticketsStats.oneDay += reservation.oneDay
        totalRevenue += reservation.oneDay * TARIFS.oneDay
      }
      if (reservation.twoDays) {
        ticketsStats.twoDays += reservation.twoDays
        totalRevenue += reservation.twoDays * TARIFS.twoDays
      }
      if (reservation.threeDays) {
        ticketsStats.threeDays += reservation.threeDays
        totalRevenue += reservation.threeDays * TARIFS.threeDays
      }
      if (reservation.parking) {
        ticketsStats.parking += reservation.parking
        totalRevenue += reservation.parking * TARIFS.parking
      }
      if (reservation.camping) {
        ticketsStats.camping += reservation.camping
        totalRevenue += reservation.camping * TARIFS.camping
      }
    })

    const totalTickets = Object.values(ticketsStats).reduce((sum, val) => sum + val, 0)

    // Calculer les stats globales des avis (toutes notes confondues)
    const localAvisRaw = localStorage.getItem('prestataireAvis')
    let allAvis = null
    if (localAvisRaw) {
      allAvis = JSON.parse(localAvisRaw)
    } else {
      allAvis = avisData
    }

    let totalAvis = 0
    let sommeNotes = 0
    const repartitionNotes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    Object.values(allAvis).forEach(entry => {
      const avisArray = entry.avis || []
      avisArray.forEach(a => {
        totalAvis++
        sommeNotes += a.note || 0
        const note = a.note || 0
        if (repartitionNotes[note] !== undefined) {
          repartitionNotes[note]++
        }
      })
    })

    const notesMoyenne = totalAvis > 0 ? sommeNotes / totalAvis : 0

    stats.value = {
      totalUsers: users.value.length,
      totalPrestataires: prestataires.value.length,
      totalReservations: reservations.length,
      totalServices,
      totalTickets,
      totalRevenue,
      ticketsParType: ticketsStats,
      notesMoyenne,
      totalAvis,
      repartitionNotes
    }

    // Charger présentation personnalisée si elle existe
    const savedPresentation = localStorage.getItem('festivalPresentation')
    if (savedPresentation) {
      try {
        festivalPresentation.value = JSON.parse(savedPresentation)
      } catch (e) {
        // ignore
      }
    }

    // Charger la programmation
    await loadProgrammation()

    // Calculer les stats d'avis
    await computeAvisStatsForPrestataires()
  } catch (e) {
    console.error('Erreur chargement données:', e)
  } finally {
    loading.value = false
  }
}

const loadProgrammation = async () => {
  try {
    const resp = await fetch('/data/programmation.json', { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    programmationOriginaux.value = JSON.parse(JSON.stringify(data)) // Copie profonde
    
    // Charger les modifications locales
    const customRaw = localStorage.getItem('customProgrammation')
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw)
        // Fusionner avec les données originales
        programmation.value = {
          stages: custom.stages || data.stages || [],
          schedules: custom.schedules || data.schedules || []
        }
      } catch (e) {
        programmation.value = { ...data }
      }
    } else {
      programmation.value = { ...data }
    }
    
    if (programmation.value.stages.length > 0 && !selectedStage.value) {
      selectedStage.value = programmation.value.stages[0].name
    }
  } catch (e) {
    console.error('Erreur chargement programmation:', e)
    programmation.value = { stages: [], schedules: [] }
  }
}

const saveProgrammation = () => {
  localStorage.setItem('customProgrammation', JSON.stringify(programmation.value))
  window.dispatchEvent(new Event('programmation-updated'))
  alert('Programmation sauvegardée avec succès!')
}

const addSlot = (dayIndex, stageName) => {
  // S'assurer que le tableau schedules a assez d'éléments
  while (programmation.value.schedules.length <= dayIndex) {
    programmation.value.schedules.push({})
  }
  
  if (!programmation.value.schedules[dayIndex][stageName]) {
    programmation.value.schedules[dayIndex][stageName] = []
  }
  
  const newSlot = {
    start: '15:00',
    end: '16:00',
    artist: 'Nouvel artiste',
    style: 'Rap'
  }
  programmation.value.schedules[dayIndex][stageName].push(newSlot)
  editingSlot.value = { dayIndex, stageName, slotIndex: programmation.value.schedules[dayIndex][stageName].length - 1 }
}

const editSlot = (dayIndex, stageName, slotIndex) => {
  editingSlot.value = { dayIndex, stageName, slotIndex }
}

const deleteSlot = (dayIndex, stageName, slotIndex) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
    programmation.value.schedules[dayIndex][stageName].splice(slotIndex, 1)
    saveProgrammation()
  }
}

const saveSlot = () => {
  if (!editingSlot.value) return
  const { dayIndex, stageName, slotIndex } = editingSlot.value
  editingSlot.value = null
  saveProgrammation()
}

const cancelEdit = () => {
  editingSlot.value = null
  loadProgrammation() // Recharger pour annuler les modifications
}

const changeSection = (section) => {
  currentSection.value = section
  selectedPrestataire.value = null
}

const selectPrestataire = (prestataire) => {
  selectedPrestataire.value = { ...prestataire }
  currentSection.value = 'prestataire-detail'
}

const startCreateUser = () => {
  newUser.value = {
    email: '',
    password: '',
    role: 'user',
    prestataireNom: ''
  }
  isCreatingUser.value = true
  selectedUser.value = null
  currentSection.value = 'user-detail'
}

const selectUser = (user) => {
  selectedUser.value = { ...user }
  isCreatingUser.value = false
  currentSection.value = 'user-detail'
}

// Vérifier si un prestataire a des modifications
const hasModifications = (prestataire) => {
  return !!customPrestataires.value[prestataire.nom]
}

// Obtenir les champs modifiés
const getModifiedFields = (prestataire) => {
  const original = prestatairesOriginaux.value.find(p => p.nom === prestataire.nom)
  if (!original) return []
  
  const custom = customPrestataires.value[prestataire.nom]
  if (!custom) return []
  
  const modified = []
  if (custom.description !== undefined && custom.description !== original.description) modified.push('Description')
  if (custom.email !== undefined && custom.email !== original.email) modified.push('Email')
  if (custom.tel !== undefined && custom.tel !== original.tel) modified.push('Téléphone')
  if (custom.site !== undefined && custom.site !== original.site) modified.push('Site web')
  if (custom.services && JSON.stringify(custom.services) !== JSON.stringify(original.services)) modified.push('Services')
  
  return modified
}

// Réinitialiser un prestataire (supprimer les modifications)
const resetPrestataire = () => {
  if (!selectedPrestataire.value) return
  if (!confirm('Êtes-vous sûr de vouloir réinitialiser ce prestataire ? Toutes les modifications locales seront supprimées.')) return
  
  delete customPrestataires.value[selectedPrestataire.value.nom]
  localStorage.setItem('customPrestataires', JSON.stringify(customPrestataires.value))
  
  // Recharger les données
  loadData().then(() => {
    // Remettre à jour le prestataire sélectionné avec les données originales
    const original = prestatairesOriginaux.value.find(p => p.nom === selectedPrestataire.value.nom)
    if (original) {
      selectedPrestataire.value = { ...original }
    }
    alert('Prestataire réinitialisé avec succès!')
  })
}

const savePresentation = () => {
  localStorage.setItem('festivalPresentation', JSON.stringify(festivalPresentation.value))
  window.dispatchEvent(new Event('festival-presentation-updated'))
  alert('Présentation sauvegardée avec succès!')
}

const resetPresentation = () => {
  if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les textes aux valeurs par défaut ?')) {
    return
  }

  festivalPresentation.value = {
    titre: 'GOLDEN COAST FESTIVAL V3',
    date: '28 - 29 - 30 août 2026',
    lieu: 'CORCELLES-LES-MONTS • DIJON',
    aboutCard1Titre: '100% RAP FR',
    aboutCard1Texte: 'Le plus grand festival entièrement dédié au <strong>rap français</strong> avec les plus grandes têtes d\'affiche et les talents émergents.',
    aboutCard2Titre: 'SITE NATUREL',
    aboutCard2Texte: 'Un cadre exceptionnel à la <strong>Combe à la Serpent</strong>, offrant une expérience unique en pleine nature près de Dijon.',
    aboutCard3Titre: '52 000 FESTIVALIERS',
    aboutCard3Texte: 'Une première édition couronnée de succès qui revient encore plus fort pour <strong>trois jours de culture urbaine</strong>.',
    desc1Titre: 'Le rendez-vous des fans de rap',
    desc1Texte: 'Plonge au cœur de l\'expérience Golden Coast Festival, l\'événement rap français qui transforme la fin de l\'été en un moment d\'exception.<br/><br/>Dans un cadre soigneusement scénographié, tu découvres des performances exclusives, un son trap & boom bap d\'une qualité studio, et des scènes immersives pensées pour sublimer chaque artiste.',
    desc1Chip1: 'Les plus grandes stars du rap français',
    desc1Chip2: 'Boissons & street-food',
    desc2Titre: 'Une immersion totale',
    desc2Texte: 'Entre shows lumineux haute intensité, espaces lifestyle, sélections fripes pointues, et street-food signature, chaque détail est conçu pour offrir une expérience fluide, raffinée et mémorable.<br/><br/>Les afters confidentiels, réservés à ceux qui veulent prolonger l\'instant, ajoutent une touche rare et privilégiée. Le Golden Coast Festival, c\'est plus qu\'un rendez-vous : c\'est l\'événement premium où la culture rap se vit intensément, dans une ambiance exclusive, créative et résolument inoubliable.',
    ctaTitre: 'PRÊT À VIVRE L\'EXPÉRIENCE ?',
    ctaTexte: 'Réservez tes billets dès maintenant et rejoignez-nous pour trois jours inoubliables !',
    ctaBouton: 'RÉSERVER MA PLACE',
    mapTitre: 'LOCALISATION',
    mapIntro: 'Retrouvez tous les points d\'intérêt du festival : scènes, parkings, campings et plus encore.'
  }

  localStorage.removeItem('festivalPresentation')
  alert('Textes réinitialisés aux valeurs par défaut!')
}

const savePrestataireChanges = () => {
  if (!selectedPrestataire.value) return

  const index = prestataires.value.findIndex(p => p.nom === selectedPrestataire.value.nom)
  if (index !== -1) {
    prestataires.value[index] = { ...selectedPrestataire.value }

    // Sauvegarder dans localStorage (simulation)
    const customPrestataires = JSON.parse(localStorage.getItem('customPrestataires') || '{}')
    customPrestataires[selectedPrestataire.value.nom] = selectedPrestataire.value
    localStorage.setItem('customPrestataires', JSON.stringify(customPrestataires))

    alert('Modifications sauvegardées!')
  }
}

const toggleService = (serviceIndex) => {
  if (!selectedPrestataire.value?.services) return
  const service = selectedPrestataire.value.services[serviceIndex]
  service.actif = !service.actif
}

const deleteService = (serviceIndex) => {
  if (!selectedPrestataire.value?.services) return
  if (confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
    selectedPrestataire.value.services.splice(serviceIndex, 1)
  }
}

const addService = () => {
  if (!selectedPrestataire.value?.services) {
    selectedPrestataire.value.services = []
  }
  selectedPrestataire.value.services.push({
    nom: 'Nouveau service',
    description: 'Description du service',
    actif: true
  })
}

// =======================
// Stats avis par prestataire
// =======================
const avisStatsParPrestataire = ref([]) // [{ nom, moyenne, nbAvis, parNote, dernierAvis }]
const selectedPrestataireStats = ref(null)

const computeAvisStatsForPrestataires = async () => {
  try {
    // Charger avis depuis localStorage ou avis.json
    let allAvis = null
    const localRaw = localStorage.getItem('prestataireAvis')
    if (localRaw) {
      allAvis = JSON.parse(localRaw)
    } else {
      const resp = await fetch('/data/avis.json', { cache: 'no-store' }).catch(() => null)
      if (resp && resp.ok) {
        allAvis = await resp.json()
        localStorage.setItem('prestataireAvis', JSON.stringify(allAvis))
      } else {
        allAvis = {}
      }
    }

    const statsArray = prestataires.value.map((p) => {
      const entry = allAvis[p.nom] || { avis: [] }
      const avis = entry.avis || []
      const base = {
        nom: p.nom,
        moyenne: 0,
        nbAvis: avis.length,
        parNote: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        dernierAvis: null
      }

      if (!avis.length) return base

      let total = 0
      avis.forEach((a) => {
        const n = a.note || 0
        if (base.parNote[n] !== undefined) base.parNote[n]++
        total += n
      })
      base.moyenne = total / avis.length

      // dernier avis = le plus récent par date
      const sorted = avis
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      base.dernierAvis = sorted[sorted.length - 1] || null

      return base
    })

    avisStatsParPrestataire.value = statsArray
  } catch (e) {
    console.error('Erreur calcul stats avis prestataires', e)
    avisStatsParPrestataire.value = []
  }
}

const selectPrestataireStats = (item) => {
  selectedPrestataireStats.value = item
}

onMounted(() => {
  loadAuthFromStorage()

  if (!isAdmin.value) {
    router.push('/login')
    return
  }

  loadData().then(() => {
    // Une fois prestataires chargés, on calcule les stats avis
    computeAvisStatsForPrestataires()
  })
})
</script>

<template>
  <div class="admin-page">
    <div v-if="loading" class="loading">
      Chargement du tableau de bord...
    </div>

    <div v-else-if="!isAdmin" class="access-denied">
      <h2>Accès restreint</h2>
      <p>Vous devez être connecté en tant qu'administrateur pour accéder à cette page.</p>
      <router-link to="/login" class="btn-primary">Se connecter</router-link>
    </div>

    <div v-else class="admin-layout">
      <!-- Menu latéral -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h2>Admin Panel</h2>
          <p class="admin-email">{{ adminEmail }}</p>
        </div>

        <nav class="sidebar-nav">
          <button
            @click="changeSection('dashboard')"
            :class="['nav-item', { active: currentSection === 'dashboard' }]"
          >
            📊 Tableau de bord
          </button>
          <button
            @click="changeSection('presentation')"
            :class="['nav-item', { active: currentSection === 'presentation' }]"
          >
            📝 Présentation festival
          </button>
          <button
            @click="changeSection('carte')"
            :class="['nav-item', { active: currentSection === 'carte' }]"
          >
            🗺️ Carte interactive
          </button>
          <button
            @click="changeSection('programmation')"
            :class="['nav-item', { active: currentSection === 'programmation' }]"
          >
            🎵 Programmation
          </button>
          <button
            @click="changeSection('prestataires')"
            :class="['nav-item', { active: currentSection === 'prestataires' }]"
          >
            🏢 Gestion prestataires
          </button>
          <button
            @click="changeSection('statistiques')"
            :class="['nav-item', { active: currentSection === 'statistiques' }]"
          >
            📈 Statistiques
          </button>
          <button
            @click="changeSection('users')"
            :class="['nav-item', { active: currentSection === 'users' || currentSection === 'user-detail' }]"
          >
            👥 Gestion utilisateurs
          </button>
        </nav>
      </aside>

      <!-- Contenu principal -->
      <main class="admin-main">
        <!-- Dashboard -->
        <div v-if="currentSection === 'dashboard'" class="section-content">
          <h1 class="section-title">Tableau de bord</h1>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalUsers }}</div>
                <div class="stat-label">Utilisateurs</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🏢</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalPrestataires }}</div>
                <div class="stat-label">Prestataires</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🛠️</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalServices }}</div>
                <div class="stat-label">Services</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalReservations }}</div>
                <div class="stat-label">Réservations</div>
              </div>
            </div>
          </div>

          <!-- Carte de notation globale -->
          <div class="rating-overview-card">
            <div class="rating-left">
              <div class="rating-icon">⭐</div>
              <div class="rating-main">
                <div class="rating-score">
                  {{ stats.totalAvis > 0 ? stats.notesMoyenne.toFixed(1) : '—' }}
                </div>
                <div class="rating-stars">
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="star"
                    :class="{ filled: stats.totalAvis > 0 && i <= Math.round(stats.notesMoyenne) }"
                  >★</span>
                </div>
                <div class="rating-meta">
                  {{ stats.totalAvis }} avis au total
                </div>
              </div>
            </div>

            <div class="rating-right">
              <h3>Répartition des notes</h3>
              <div class="rating-distribution">
                <div
                  v-for="i in [5, 4, 3, 2, 1]"
                  :key="i"
                  class="distribution-row"
                >
                  <span class="distribution-label">{{ i }}★</span>
                  <div class="distribution-bar">
                    <div
                      class="distribution-fill"
                      :style="{
                        width: stats.totalAvis > 0 ? (stats.repartitionNotes[i] / stats.totalAvis * 100) + '%' : '0%'
                      }"
                    ></div>
                  </div>
                  <span class="distribution-count">{{ stats.repartitionNotes[i] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Présentation Festival (WYSIWYG) -->
        <div v-if="currentSection === 'presentation'" class="section-content">
          <div class="section-header">
            <h1 class="section-title">Présentation du festival</h1>
            <button @click="resetPresentation" class="btn-reset">
              🔄 Réinitialiser aux valeurs par défaut
            </button>
          </div>

          <!-- Menu de navigation des sous-sections -->
          <div class="presentation-tabs">
            <button
              v-for="section in presentationSections"
              :key="section.id"
              @click="selectPresentationSection(section.id)"
              :class="['tab-btn', { active: presentationSubSection === section.id }]"
            >
              {{ section.icon }} {{ section.label }}
            </button>
          </div>

          <div class="editor-container">
            <!-- Section Hero -->
            <div v-if="presentationSubSection === 'hero'" class="presentation-group">
              <h3 class="group-title">🎯 Section Hero (Bannière principale)</h3>

              <div class="form-group">
                <label>Titre principal</label>
                <WysiwygEditor
                  v-model="festivalPresentation.titre"
                  :height="300"
                  placeholder="GOLDEN COAST FESTIVAL V3"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Date</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.date"
                    :height="400"
                    placeholder="28 - 29 - 30 août 2026"
                  />
                </div>

                <div class="form-group">
                  <label>Lieu</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.lieu"
                    :height="400"
                    placeholder="CORCELLES-LES-MONTS • DIJON"
                  />
                </div>
              </div>
            </div>

            <!-- Section About (3 cards) -->
            <div v-if="presentationSubSection === 'about'" class="presentation-group">
              <h3 class="group-title">📋 Section "Le Festival" (3 cartes)</h3>

              <div class="card-editor">
                <h4>Card 1</h4>
                <div class="form-group">
                  <label>Titre</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.aboutCard1Titre"
                    :height="300"
                    placeholder="100% RAP FR"
                  />
                </div>
                <div class="form-group">
                  <label>Texte</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.aboutCard1Texte"
                    :height="300"
                    placeholder="Description de la première carte..."
                  />
                </div>
              </div>

              <div class="card-editor">
                <h4>Card 2</h4>
                <div class="form-group">
                  <label>Titre</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.aboutCard2Titre"
                    :height="300"
                    placeholder="SITE NATUREL"
                  />
                </div>
                <div class="form-group">
                  <label>Texte</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.aboutCard2Texte"
                    :height="300"
                    placeholder="Description de la deuxième carte..."
                  />
                </div>
              </div>

              <div class="card-editor">
                <h4>Card 3</h4>
                <div class="form-group">
                  <label>Titre</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.aboutCard3Titre"
                    :height="300"
                    placeholder="52 000 FESTIVALIERS"
                  />
                </div>
                <div class="form-group">
                  <label>Texte</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.aboutCard3Texte"
                    :height="300"
                    placeholder="Description de la troisième carte..."
                  />
                </div>
              </div>
            </div>

            <!-- Section Description 1 -->
            <div v-if="presentationSubSection === 'desc1'" class="presentation-group">
              <h3 class="group-title">📝 Section Description 1</h3>

              <div class="form-group">
                <label>Titre</label>
                <WysiwygEditor
                  v-model="festivalPresentation.desc1Titre"
                  :height="300"
                  placeholder="Le rendez-vous des fans de rap"
                />
              </div>

              <div class="form-group">
                <label>Texte principal</label>
                <WysiwygEditor
                  v-model="festivalPresentation.desc1Texte"
                  :height="450"
                  placeholder="Décrivez l'expérience du festival..."
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Chip 1</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.desc1Chip1"
                    :height="300"
                    placeholder="Premier point fort"
                  />
                </div>

                <div class="form-group">
                  <label>Chip 2</label>
                  <WysiwygEditor
                    v-model="festivalPresentation.desc1Chip2"
                    :height="300"
                    placeholder="Deuxième point fort"
                  />
                </div>
              </div>
            </div>

            <!-- Section Description 2 -->
            <div v-if="presentationSubSection === 'desc2'" class="presentation-group">
              <h3 class="group-title">📝 Section Description 2</h3>

              <div class="form-group">
                <label>Titre</label>
                <WysiwygEditor
                  v-model="festivalPresentation.desc2Titre"
                  :height="300"
                  placeholder="Une immersion totale"
                />
              </div>

              <div class="form-group">
                <label>Texte principal</label>
                <WysiwygEditor
                  v-model="festivalPresentation.desc2Texte"
                  :height="500"
                  placeholder="Détaillez l'ambiance et l'expérience..."
                />
              </div>
            </div>

            <!-- Section CTA -->
            <div v-if="presentationSubSection === 'cta'" class="presentation-group">
              <h3 class="group-title">🎯 Section Appel à l'action (CTA)</h3>

              <div class="form-group">
                <label>Titre</label>
                <WysiwygEditor
                  v-model="festivalPresentation.ctaTitre"
                  :height="300"
                  placeholder="PRÊT À VIVRE L'EXPÉRIENCE ?"
                />
              </div>

              <div class="form-group">
                <label>Texte</label>
                <WysiwygEditor
                  v-model="festivalPresentation.ctaTexte"
                  :height="250"
                  placeholder="Message d'invitation..."
                />
              </div>

              <div class="form-group">
                <label>Texte du bouton</label>
                <WysiwygEditor
                  v-model="festivalPresentation.ctaBouton"
                  :height="250"
                  placeholder="RÉSERVER MA PLACE"
                />
              </div>
            </div>

            <!-- Section Map -->
            <div v-if="presentationSubSection === 'map'" class="presentation-group">
              <h3 class="group-title">🗺️ Section Carte</h3>

              <div class="form-group">
                <label>Titre</label>
                <WysiwygEditor
                  v-model="festivalPresentation.mapTitre"
                  :height="300"
                  placeholder="LOCALISATION"
                />
              </div>

              <div class="form-group">
                <label>Texte d'introduction</label>
                <WysiwygEditor
                  v-model="festivalPresentation.mapIntro"
                  :height="250"
                  placeholder="Retrouvez tous les points d'intérêt..."
                />
              </div>
            </div>

            <div class="form-actions">
              <button @click="savePresentation" class="btn-save">
                💾 Sauvegarder toutes les modifications
              </button>
            </div>
          </div>
        </div>

        <!-- Carte Interactive -->
        <div v-if="currentSection === 'carte'" class="section-content">
          <h1 class="section-title">Configuration de la carte</h1>

          <div class="carte-config">
            <p class="info-text">
              Associez automatiquement les emplacements aux prestataires sur la carte interactive.
            </p>

            <div class="prestataires-map-list">
              <div
                v-for="(prestataire, index) in prestataires"
                :key="prestataire.nom"
                class="map-item"
              >
                <div class="map-item-info">
                  <strong>{{ prestataire.nom }}</strong>
                  <span class="map-type">{{ prestataire.type }}</span>
                </div>
                <div class="map-item-location">
                  <label>Position:</label>
                  <select class="location-select">
                    <option>Zone A - Stand {{ index + 1 }}</option>
                    <option>Zone B - Stand {{ index + 1 }}</option>
                    <option>Zone C - Stand {{ index + 1 }}</option>
                  </select>
                </div>
              </div>
            </div>

            <button class="btn-save">
              🗺️ Mettre à jour la carte
            </button>
          </div>
        </div>

        <!-- Programmation -->
        <div v-if="currentSection === 'programmation'" class="section-content">
          <h1 class="section-title">Gestion de la programmation</h1>

          <div class="programmation-editor">
            <!-- Sélecteur de jour -->
            <div class="day-selector-admin">
              <label>Jour :</label>
              <select v-model="selectedDayIndex" class="form-input">
                <option v-for="(day, index) in programmation.schedules" :key="index" :value="index">
                  {{ day.day || `Jour ${index + 1}` }}
                </option>
              </select>
            </div>

            <!-- Sélecteur de scène -->
            <div class="stage-selector-admin">
              <label>Scène :</label>
              <select v-model="selectedStage" class="form-input">
                <option v-for="stage in programmation.stages" :key="stage.name" :value="stage.name">
                  {{ stage.name }} {{ stage.by ? `(by ${stage.by})` : '' }}
                </option>
              </select>
            </div>

            <!-- Liste des créneaux pour la scène sélectionnée -->
            <div v-if="selectedStage && programmation.schedules[selectedDayIndex]" class="slots-list">
              <div class="slots-header">
                <h3>Créneaux - {{ selectedStage }}</h3>
                <button @click="addSlot(selectedDayIndex, selectedStage)" class="btn-add">
                  ➕ Ajouter un créneau
                </button>
              </div>

              <div v-if="programmation.schedules[selectedDayIndex][selectedStage]?.length" class="slots-grid">
                <div
                  v-for="(slot, slotIndex) in programmation.schedules[selectedDayIndex][selectedStage]"
                  :key="slotIndex"
                  class="slot-card"
                  :class="{ editing: editingSlot && editingSlot.dayIndex === selectedDayIndex && editingSlot.stageName === selectedStage && editingSlot.slotIndex === slotIndex }"
                >
                  <div v-if="editingSlot && editingSlot.dayIndex === selectedDayIndex && editingSlot.stageName === selectedStage && editingSlot.slotIndex === slotIndex" class="slot-editor">
                    <div class="form-row">
                      <label>Artiste</label>
                      <input v-model="slot.artist" class="form-input" />
                    </div>
                    <div class="form-row">
                      <label>Heure début</label>
                      <input v-model="slot.start" type="time" class="form-input" />
                    </div>
                    <div class="form-row">
                      <label>Heure fin</label>
                      <input v-model="slot.end" type="time" class="form-input" />
                    </div>
                    <div class="form-row">
                      <label>Style</label>
                      <input v-model="slot.style" class="form-input" />
                    </div>
                    <div class="slot-actions">
                      <button @click="saveSlot" class="btn-save-small">💾 Sauvegarder</button>
                      <button @click="cancelEdit" class="btn-cancel">❌ Annuler</button>
                    </div>
                  </div>
                  <div v-else class="slot-display">
                    <div class="slot-info">
                      <div class="slot-artist-name">{{ slot.artist }}</div>
                      <div class="slot-time">{{ slot.start }} - {{ slot.end }}</div>
                      <div class="slot-style">{{ slot.style }}</div>
                    </div>
                    <div class="slot-actions">
                      <button @click="editSlot(selectedDayIndex, selectedStage, slotIndex)" class="btn-edit">✏️</button>
                      <button @click="deleteSlot(selectedDayIndex, selectedStage, slotIndex)" class="btn-delete">🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-slots">
                <p>Aucun créneau pour cette scène ce jour-là.</p>
                <button @click="addSlot(selectedDayIndex, selectedStage)" class="btn-add">
                  ➕ Ajouter le premier créneau
                </button>
              </div>
            </div>

            <div class="programmation-actions">
              <button @click="saveProgrammation" class="btn-save">
                💾 Sauvegarder toute la programmation
              </button>
            </div>
          </div>
        </div>

        <!-- Gestion Prestataires -->
        <div v-if="currentSection === 'prestataires'" class="section-content">
          <h1 class="section-title">Gestion des prestataires</h1>
          
          <div class="modifications-summary" v-if="Object.keys(customPrestataires).length > 0">
            <p class="summary-text">
              📝 <strong>{{ Object.keys(customPrestataires).length }}</strong> prestataire(s) avec modifications
            </p>
          </div>

          <div class="prestataires-list">
            <div
              v-for="prestataire in prestataires"
              :key="prestataire.nom"
              class="prestataire-item"
              :class="{ 'has-modifications': hasModifications(prestataire) }"
              @click="selectPrestataire(prestataire)"
            >
              <img
                v-if="prestataire.image"
                :src="prestataire.image"
                :alt="prestataire.nom"
                class="prestataire-thumb"
              />
              <div class="prestataire-info">
                <div class="prestataire-header-row">
                  <h3>{{ prestataire.nom }}</h3>
                  <span v-if="hasModifications(prestataire)" class="modification-badge">✏️ Modifié</span>
                </div>
                <p>{{ prestataire.type }}</p>
                <span class="services-count">{{ prestataire.services?.length || 0 }} service(s)</span>
                <div v-if="hasModifications(prestataire)" class="modified-fields">
                  <span class="modified-label">Champs modifiés :</span>
                  <span class="modified-list">{{ getModifiedFields(prestataire).join(', ') || 'Aucun' }}</span>
                </div>
              </div>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>

        <!-- Détail Prestataire -->
        <div v-if="currentSection === 'prestataire-detail' && selectedPrestataire" class="section-content">
          <div class="section-header">
            <button @click="changeSection('prestataires')" class="btn-back">← Retour</button>
            <h1 class="section-title">{{ selectedPrestataire.nom }}</h1>
          </div>

          <!-- Indicateur de modifications -->
          <div v-if="hasModifications(selectedPrestataire)" class="modifications-alert">
            <div class="alert-content">
              <span class="alert-icon">⚠️</span>
              <div class="alert-text">
                <strong>Ce prestataire a des modifications locales</strong>
                <p>Champs modifiés : {{ getModifiedFields(selectedPrestataire).join(', ') || 'Aucun' }}</p>
              </div>
              <button @click="resetPrestataire" class="btn-reset">🔄 Réinitialiser</button>
            </div>
          </div>

          <div class="prestataire-editor">
            <div class="form-group">
              <label>Nom du prestataire</label>
              <input
                v-model="selectedPrestataire.nom"
                type="text"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Type</label>
              <input
                v-model="selectedPrestataire.type"
                type="text"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Description (Éditeur WYSIWYG)</label>
              <WysiwygEditor
                v-model="selectedPrestataire.description"
                :height="600"
                placeholder="Décrivez le prestataire, ajoutez des images..."
              />
              <p class="form-hint">Utilisez l'éditeur pour formater le texte et insérer des images</p>
            </div>

            <div class="form-group">
              <label>Aperçu de la description</label>
              <div class="preview-box" v-html="selectedPrestataire.description"></div>
            </div>

            <div class="form-group">
              <label>Image (URL)</label>
              <input
                v-model="selectedPrestataire.image"
                type="text"
                class="form-input"
              />
            </div>

            <div class="services-section">
              <div class="services-header">
                <h2>Services</h2>
                <button @click="addService" class="btn-add">+ Ajouter un service</button>
              </div>

              <div
                v-for="(service, index) in selectedPrestataire.services"
                :key="index"
                class="service-item"
              >
                <div class="service-content">
                  <input
                    v-model="service.nom"
                    type="text"
                    class="form-input"
                    placeholder="Nom du service"
                  />
                  <textarea
                    v-model="service.description"
                    class="form-textarea"
                    rows="2"
                    placeholder="Description du service"
                  ></textarea>
                </div>
                <div class="service-actions">
                  <button
                    @click="toggleService(index)"
                    :class="['btn-toggle', { active: service.actif !== false }]"
                  >
                    {{ service.actif !== false ? '✓ Actif' : '✗ Inactif' }}
                  </button>
                  <button @click="deleteService(index)" class="btn-delete">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            </div>

            <button @click="savePrestataireChanges" class="btn-save">
              💾 Sauvegarder toutes les modifications
            </button>
          </div>
        </div>

        <!-- Statistiques -->
        <div v-if="currentSection === 'statistiques'" class="section-content">
          <h1 class="section-title">Statistiques</h1>

          <!-- =============================== -->
          <!-- Stats services (déjà présentes) -->
          <!-- =============================== -->
          <div class="stats-charts">
            <div class="chart-card">
              <h3>Services par prestataire</h3>
              <div class="chart-bars">
                <div
                  v-for="prestataire in prestataires"
                  :key="prestataire.nom"
                  class="chart-bar-item"
                >
                  <span class="bar-label">{{ prestataire.nom }}</span>
                  <div
                    class="bar-container"
                    :style="{ width: ((prestataire.services?.length || 0) * 20) + '%' }"
                  >
                    <div
                      class="bar-fill"
                      :style="{ width: ((prestataire.services?.length || 0) * 20) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-value">{{ prestataire.services?.length || 0 }}</span>
                </div>
              </div>
            </div>

            <div class="chart-card">
              <h3>Répartition par type</h3>
              <div class="type-stats">
                <div
                  v-for="(count, type) in prestataires.reduce((acc, p) => {
                    acc[p.type] = (acc[p.type] || 0) + 1
                    return acc
                  }, {})"
                  :key="type"
                  class="type-stat-item"
                >
                  <strong>{{ type }}</strong>
                  <span class="type-count">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ======================================= -->
          <!-- NOUVELLE PARTIE : Stats avis prestataire -->
          <!-- ======================================= -->
          <div class="avis-stats-section">
            <h2 class="avis-section-title">📊 Notes et avis des prestataires</h2>
            <p class="avis-section-subtitle">
              Vue d'ensemble des avis (notes et commentaires) laissés par les festivaliers sur chaque prestataire.
            </p>

            <div class="avis-stats-grid">
              <!-- Liste des prestataires -->
              <div class="avis-prestataires-list">
                <h3 class="list-title">Sélectionner un prestataire</h3>
                <div class="prestataire-cards">
                  <div
                    v-for="item in avisStatsParPrestataire"
                    :key="item.nom"
                    @click="selectPrestataireStats(item)"
                    :class="['prestataire-stat-card', { 'selected': selectedPrestataireStats && selectedPrestataireStats.nom === item.nom }]"
                  >
                    <div class="card-header">
                      <h4>{{ item.nom }}</h4>
                      <span class="badge-avis">{{ item.nbAvis }} avis</span>
                    </div>
                    <div class="card-rating">
                      <div class="rating-value" v-if="item.nbAvis">
                        {{ item.moyenne.toFixed(1) }}
                      </div>
                      <div class="rating-value no-rating" v-else>—</div>
                      <div class="rating-stars-mini">
                        <span
                          v-for="i in 5"
                          :key="i"
                          class="star-mini"
                          :class="{ filled: item.nbAvis && i <= Math.round(item.moyenne) }"
                        >★</span>
                      </div>
                    </div>
                    <div class="card-footer" v-if="item.dernierAvis">
                      <span class="last-comment-label">Dernier avis :</span>
                      <p class="last-comment-text">
                        "{{ item.dernierAvis.commentaire.length > 50 ? (item.dernierAvis.commentaire.slice(0, 50) + '...') : item.dernierAvis.commentaire }}"
                      </p>
                    </div>
                    <div class="card-footer" v-else>
                      <p class="no-comment-text">Aucun avis pour le moment</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Détail du prestataire sélectionné -->
              <div class="avis-detail-panel" v-if="selectedPrestataireStats">
                <div class="detail-header">
                  <h3>{{ selectedPrestataireStats.nom }}</h3>
                  <button @click="selectedPrestataireStats = null" class="btn-close-detail">✕</button>
                </div>

                <div class="detail-content">
                  <div class="detail-score-section">
                    <div class="detail-score-main">
                      <div class="detail-score-value">
                        {{ selectedPrestataireStats.nbAvis ? selectedPrestataireStats.moyenne.toFixed(1) : '—' }}
                      </div>
                      <div class="detail-score-label">sur 5</div>
                    </div>
                    <div class="detail-score-stars">
                      <span
                        v-for="i in 5"
                        :key="i"
                        class="star-detail"
                        :class="{ filled: selectedPrestataireStats.nbAvis && i <= Math.round(selectedPrestataireStats.moyenne) }"
                      >★</span>
                    </div>
                    <div class="detail-score-meta">
                      Basé sur {{ selectedPrestataireStats.nbAvis }} avis
                    </div>
                  </div>

                  <div class="detail-distribution">
                    <h4>Répartition des notes</h4>
                    <div class="distribution-bars">
                      <div
                        v-for="i in [5,4,3,2,1]"
                        :key="i"
                        class="distribution-bar-row"
                      >
                        <span class="distribution-star-label">{{ i }}★</span>
                        <div class="distribution-bar-bg">
                          <div
                            class="distribution-bar-fg"
                            :style="{ width: selectedPrestataireStats.nbAvis ? (selectedPrestataireStats.parNote[i] / selectedPrestataireStats.nbAvis) * 100 + '%' : '0%' }"
                          ></div>
                        </div>
                        <span class="distribution-count-label">
                          {{ selectedPrestataireStats.parNote[i] }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-info-box">
                    <p>💡 Ces statistiques sont basées sur les avis saisis par les festivaliers directement sur la page du prestataire.</p>
                  </div>
                </div>
              </div>

              <!-- Message si aucun prestataire sélectionné -->
              <div class="avis-detail-panel empty" v-else>
                <div class="empty-state">
                  <span class="empty-icon">📊</span>
                  <h3>Aucun prestataire sélectionné</h3>
                  <p>Cliquez sur un prestataire dans la liste de gauche pour voir les détails de ses avis.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Gestion des utilisateurs -->
        <div v-if="currentSection === 'users'" class="section-content">
          <div class="section-header">
            <h1 class="section-title">Gestion des utilisateurs</h1>
            <button @click="startCreateUser" class="btn-add-user">
              ➕ Créer un utilisateur
            </button>
          </div>

          <div class="users-list">
            <div
              v-for="user in users"
              :key="user.email"
              class="user-item"
              @click="selectUser(user)"
            >
              <div class="user-icon">
                <span v-if="user.role === 'admin'">👑</span>
                <span v-else-if="user.role === 'prestataire'">🏢</span>
                <span v-else>👤</span>
              </div>
              <div class="user-info">
                <div class="user-email">{{ user.email }}</div>
                <div class="user-role-badge" :class="`role-${user.role}`">
                  {{ user.role }}
                </div>
                <div v-if="user.prestataireNom" class="user-prestataire">
                  📍 {{ user.prestataireNom }}
                </div>
              </div>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>

        <!-- Détail utilisateur -->
        <div v-if="currentSection === 'user-detail'" class="section-content">
          <div class="section-header">
            <button @click="changeSection('users')" class="btn-back">← Retour</button>
            <h1 class="section-title">
              {{ isCreatingUser ? 'Créer un utilisateur' : 'Modifier l\'utilisateur' }}
            </h1>
          </div>

          <div class="user-editor">
            <div class="form-group">
              <label>Email *</label>
              <input
                v-if="isCreatingUser"
                v-model="newUser.email"
                type="email"
                class="form-input"
                placeholder="email@example.com"
              />
              <input
                v-else
                v-model="selectedUser.email"
                type="email"
                class="form-input"
                placeholder="email@example.com"
                disabled
              />
              <p v-if="!isCreatingUser" class="form-hint">L'email ne peut pas être modifié</p>
            </div>

            <div class="form-group">
              <label>Mot de passe {{ isCreatingUser ? '*' : '' }}</label>
              <input
                v-if="isCreatingUser"
                v-model="newUser.password"
                type="text"
                class="form-input"
                placeholder="Mot de passe"
              />
              <input
                v-else
                v-model="selectedUser.password"
                type="text"
                class="form-input"
                placeholder="Mot de passe"
              />
              <p class="form-hint">
                {{ isCreatingUser ? 'Minimum 6 caractères' : 'Laisser vide pour ne pas modifier' }}
              </p>
            </div>

            <div class="form-group">
              <label>Rôle *</label>
              <select
                v-if="isCreatingUser"
                v-model="newUser.role"
                class="form-input"
              >
                <option value="user">Utilisateur</option>
                <option value="prestataire">Prestataire</option>
                <option value="admin">Administrateur</option>
              </select>
              <select
                v-else
                v-model="selectedUser.role"
                class="form-input"
              >
                <option value="user">Utilisateur</option>
                <option value="prestataire">Prestataire</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div
              v-if="(isCreatingUser && newUser.role === 'prestataire') || (!isCreatingUser && selectedUser?.role === 'prestataire')"
              class="form-group"
            >
              <label>Nom du prestataire</label>
              <select
                v-if="isCreatingUser"
                v-model="newUser.prestataireNom"
                class="form-input"
              >
                <option value="">-- Sélectionner un prestataire --</option>
                <option
                  v-for="prestataire in prestataires"
                  :key="prestataire.nom"
                  :value="prestataire.nom"
                >
                  {{ prestataire.nom }}
                </option>
              </select>
              <select
                v-else
                v-model="selectedUser.prestataireNom"
                class="form-input"
              >
                <option value="">-- Sélectionner un prestataire --</option>
                <option
                  v-for="prestataire in prestataires"
                  :key="prestataire.nom"
                  :value="prestataire.nom"
                >
                  {{ prestataire.nom }}
                </option>
              </select>
              <p class="form-hint">Requis pour les comptes prestataires</p>
            </div>

            <div class="user-actions">
              <button @click="saveUser" class="btn-save">
                💾 {{ isCreatingUser ? 'Créer l\'utilisateur' : 'Sauvegarder les modifications' }}
              </button>
              <button
                v-if="!isCreatingUser && selectedUser?.email !== authUser?.email"
                @click="deleteUser"
                class="btn-delete-user"
              >
                🗑️ Supprimer l'utilisateur
              </button>
            </div>

            <div v-if="!isCreatingUser && selectedUser?.email === authUser?.email" class="warning-box">
              ⚠️ Vous ne pouvez pas supprimer votre propre compte
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0b122a 0%, #07103a 100%);
  color: #fff;
}

.loading,
.access-denied {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 80px 20px;
}

.access-denied h2 {
  color: #FCDC1E;
  margin-bottom: 16px;
}

.btn-primary {
  display: inline-block;
  margin-top: 20px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 700;
  transition: transform 0.12s ease;
}

.admin-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.admin-sidebar {
  width: 280px;
  background: rgba(0, 0, 0, 0.3);
  border-right: 1px solid rgba(252, 220, 30, 0.15);
  padding: 30px 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 0 24px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 24px;
}

.sidebar-header h2 {
  color: #FCDC1E;
  margin-bottom: 8px;
  font-size: 1.5rem;
}

.admin-email {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 16px 24px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(252, 220, 30, 0.05);
  color: #FCDC1E;
}

.nav-item.active {
  background: rgba(252, 220, 30, 0.1);
  color: #FCDC1E;
  border-left-color: #FCDC1E;
  font-weight: 600;
}

/* Main content */
.admin-main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.section-content {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  color: #FCDC1E;
  font-size: 2rem;
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(252, 220, 30, 0.3);
  color: #FCDC1E;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: rgba(252, 220, 30, 0.15);
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(252, 220, 30, 0.1);
  border-radius: 12px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #FCDC1E;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

/* Forms */
.editor-container,
.carte-config,
.prestataire-editor,
.user-editor {
  background: rgba(255, 255, 255, 0.05);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  color: #FCDC1E;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-input,
.form-textarea,
.location-select {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 1rem;
}

.form-input:focus,
.form-textarea:focus,
.location-select:focus {
  outline: none;
  border-color: #FCDC1E;
}

.form-hint {
  margin-top: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.preview-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  min-height: 100px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.preview-box :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 12px 0;
}

.preview-box :deep(p) {
  margin-bottom: 12px;
}

.preview-box :deep(h1),
.preview-box :deep(h2),
.preview-box :deep(h3) {
  color: #FCDC1E;
  margin: 16px 0 8px;
}

.preview-box :deep(ul),
.preview-box :deep(ol) {
  margin-left: 24px;
  margin-bottom: 12px;
}

.preview-box :deep(a) {
  color: #FCDC1E;
  text-decoration: underline;
}

/* Prestataires list */
.prestataires-list {
  display: grid;
  gap: 16px;
}

.prestataire-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.prestataire-item:hover {
  background: rgba(252, 220, 30, 0.08);
  transform: translateX(4px);
}

.prestataire-thumb {
  width: 60px;
  height: 60px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 8px;
}

.prestataire-info {
  flex: 1;
}

.prestataire-info h3 {
  color: #FCDC1E;
  margin-bottom: 4px;
}

.prestataire-info p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.services-count {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.prestataire-item.has-modifications {
  border-color: rgba(252, 220, 30, 0.4);
  background: rgba(252, 220, 30, 0.05);
}

.prestataire-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.modification-badge {
  background: rgba(252, 220, 30, 0.2);
  color: #FCDC1E;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(252, 220, 30, 0.4);
}

.modified-fields {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.modified-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 6px;
}

.modified-list {
  font-size: 0.85rem;
  color: #FCDC1E;
  font-weight: 600;
}

.modifications-summary {
  background: rgba(252, 220, 30, 0.1);
  border: 1px solid rgba(252, 220, 30, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 24px;
}

.summary-text {
  color: #FCDC1E;
  font-size: 0.95rem;
  margin: 0;
}

.modifications-alert {
  background: rgba(255, 193, 7, 0.15);
  border: 2px solid rgba(255, 193, 7, 0.4);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-text {
  flex: 1;
}

.alert-text strong {
  display: block;
  color: #FCDC1E;
  margin-bottom: 4px;
  font-size: 1rem;
}

.alert-text p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin: 0;
}

.btn-reset {
  background: rgba(255, 87, 34, 0.2);
  border: 1px solid rgba(255, 87, 34, 0.4);
  color: #ff5722;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-reset:hover {
  background: rgba(255, 87, 34, 0.3);
  border-color: rgba(255, 87, 34, 0.6);
}

.arrow {
  color: #FCDC1E;
  font-size: 1.5rem;
}

/* Services */
.services-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.services-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.services-header h2 {
  color: #FCDC1E;
  font-size: 1.4rem;
}

.btn-add {
  background: rgba(252, 220, 30, 0.15);
  border: 1px solid #FCDC1E;
  color: #FCDC1E;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-add:hover {
  background: rgba(252, 220, 30, 0.25);
}

.service-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.service-content {
  margin-bottom: 12px;
}

.service-content input,
.service-content textarea {
  margin-bottom: 8px;
}

.service-actions {
  display: flex;
  gap: 12px;
}

.btn-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-toggle.active {
  background: rgba(0, 255, 0, 0.15);
  border-color: #00ff00;
  color: #00ff00;
}

.btn-delete {
  background: rgba(255, 0, 0, 0.15);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: #ff6b6b;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: rgba(255, 0, 0, 0.25);
}

/* Carte */
.info-text {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
}

.prestataires-map-list {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.map-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.map-item-info strong {
  display: block;
  color: #FCDC1E;
  margin-bottom: 4px;
}

.map-type {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.map-item-location {
  display: flex;
  align-items: center;
  gap: 12px;
}

.map-item-location label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

/* Statistiques */
.stats-charts {
  display: grid;
  gap: 32px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.chart-card h3 {
  color: #FCDC1E;
  margin-bottom: 20px;
}

.chart-bars {
  display: grid;
  gap: 12px;
}

.chart-bar-item {
  display: grid;
  grid-template-columns: 150px 1fr 50px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-container {
  background: rgba(255, 255, 255, 0.1);
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  background: linear-gradient(90deg, #FCDC1E, #ffe676);
  height: 100%;
  transition: width 0.3s ease;
}

.bar-value {
  text-align: right;
  color: #FCDC1E;
  font-weight: 700;
}

.type-stats {
  display: grid;
  gap: 12px;
}

.type-stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.type-stat-item strong {
  color: #FCDC1E;
  font-weight: 600;
}

.type-count {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  font-size: 1.1rem;
}

/* Gestion utilisateurs - Corrections */
.btn-add-user {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  transition: transform 0.12s ease;
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
}

.btn-add-user:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(252, 220, 30, 0.4);
}

.users-list {
  display: grid;
  gap: 16px;
}

.user-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-item:hover {
  background: rgba(252, 220, 30, 0.08);
  transform: translateX(4px);
}

.user-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(252, 220, 30, 0.15);
  border-radius: 50%;
  font-size: 1.5rem;
}

.user-info {
  flex: 1;
}

.user-email {
  color: #FCDC1E;
  font-weight: 600;
  font-size: 1.05rem;
  margin-bottom: 6px;
}

.user-role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.role-admin {
  background: rgba(255, 87, 34, 0.2);
  color: #ff5722;
  border: 1px solid rgba(255, 87, 34, 0.4);
}

.role-prestataire {
  background: rgba(33, 150, 243, 0.2);
  color: #2196F3;
  border: 1px solid rgba(33, 150, 243, 0.4);
}

.role-user {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.4);
}

.user-prestataire {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.user-editor {
  background: rgba(255, 255, 255, 0.05);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.user-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.btn-delete-user {
  background: rgba(255, 0, 0, 0.15);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: #ff6b6b;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  transition: all 0.2s ease;
}

.btn-delete-user:hover {
  background: rgba(255, 0, 0, 0.25);
}

.warning-box {
  margin-top: 24px;
  padding: 16px;
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

/* Programmation - Corrections */
.programmation-editor {
  background: rgba(255, 255, 255, 0.05);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.day-selector-admin,
.stage-selector-admin {
  margin-bottom: 24px;
}

.day-selector-admin label,
.stage-selector-admin label {
  display: block;
  color: #FCDC1E;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 1rem;
}

.slots-list {
  margin-top: 32px;
}

.slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(252, 220, 30, 0.2);
}

.slots-header h3 {
  color: #FCDC1E;
  font-size: 1.4rem;
  margin: 0;
}

.slots-grid {
  display: grid;
  gap: 16px;
}

.slot-card {
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.slot-card:hover {
  border-color: rgba(252, 220, 30, 0.3);
  background: rgba(252, 220, 30, 0.05);
}

.slot-card.editing {
  border-color: #FCDC1E;
  background: rgba(252, 220, 30, 0.1);
}

.slot-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.slot-info {
  flex: 1;
}

.slot-artist-name {
  color: #FCDC1E;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.slot-time {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.slot-style {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-style: italic;
}

.slot-actions {
  display: flex;
  gap: 8px;
}

.btn-edit {
  background: rgba(33, 150, 243, 0.2);
  border: 1px solid rgba(33, 150, 243, 0.4);
  color: #2196F3;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.3);
}

.slot-editor {
  display: grid;
  gap: 16px;
}

.slot-editor .form-row {
  display: grid;
  gap: 8px;
}

.slot-editor .form-row label {
  color: #FCDC1E;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-cancel {
  background: rgba(255, 87, 34, 0.2);
  border: 1px solid rgba(255, 87, 34, 0.4);
  color: #ff5722;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: rgba(255, 87, 34, 0.3);
}

.empty-slots {
  text-align: center;
  padding: 40px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
}

.empty-slots p {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 20px;
  font-size: 1rem;
}

/* ========================================== */
/* Stats avis prestataires - Nouveau style   */
/* ========================================== */
.avis-stats-section {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 2px solid rgba(252, 220, 30, 0.2);
}

.avis-section-title {
  color: #FCDC1E;
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.avis-section-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin-bottom: 32px;
  line-height: 1.5;
}

.avis-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
  min-height: 600px;
}

/* Liste des prestataires */
.avis-prestataires-list {
  background: rgba(0, 0, 0, 0.2);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  overflow-y: auto;
  max-height: 800px;
}

.list-title {
  color: #FCDC1E;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(252, 220, 30, 0.2);
}

.prestataire-cards {
  display: grid;
  gap: 12px;
}

.prestataire-stat-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 12px;
  border: 2px solid rgba(252, 220, 30, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
}

.prestataire-stat-card:hover {
  background: rgba(252, 220, 30, 0.08);
  border-color: rgba(252, 220, 30, 0.4);
  transform: translateX(4px);
}

.prestataire-stat-card.selected {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.15) 0%, rgba(255, 230, 118, 0.15) 100%);
  border-color: #FCDC1E;
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h4 {
  color: #FCDC1E;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.badge-avis {
  background: rgba(252, 220, 30, 0.2);
  color: #FCDC1E;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rating-value {
  font-size: 2rem;
  font-weight: 900;
  color: #FCDC1E;
  line-height: 1;
}

.rating-value.no-rating {
  color: rgba(255, 255, 255, 0.3);
}

.rating-stars-mini {
  display: flex;
  gap: 2px;
}

.star-mini {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.2);
}

.star-mini.filled {
  color: #FCDC1E;
}

.card-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.last-comment-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.last-comment-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  font-style: italic;
  margin: 0;
  line-height: 1.4;
}

.no-comment-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  font-style: italic;
  margin: 0;
  text-align: center;
}

/* Panneau de détail */
.avis-detail-panel {
  background: rgba(0, 0, 0, 0.2);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.avis-detail-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(252, 220, 30, 0.2);
}

.detail-header h3 {
  color: #FCDC1E;
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.btn-close-detail {
  background: rgba(255, 87, 34, 0.2);
  border: 1px solid rgba(255, 87, 34, 0.4);
  color: #ff5722;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: 700;
  transition: all 0.2s ease;
  line-height: 1;
}

.btn-close-detail:hover {
  background: rgba(255, 87, 34, 0.3);
  transform: rotate(90deg);
}

.detail-content {
  display: grid;
  gap: 24px;
}

.detail-score-section {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.1) 0%, rgba(255, 230, 118, 0.1) 100%);
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(252, 220, 30, 0.3);
}

.detail-score-main {
  margin-bottom: 12px;
}

.detail-score-value {
  font-size: 4rem;
  font-weight: 900;
  color: #FCDC1E;
  line-height: 1;
  margin-bottom: 4px;
}

.detail-score-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  font-weight: 600;
}

.detail-score-stars {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.star-detail {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.2);
}

.star-detail.filled {
  color: #FCDC1E;
  filter: drop-shadow(0 2px 4px rgba(252, 220, 30, 0.4));
}

.detail-score-meta {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 600;
}

.detail-distribution {
  background: rgba(0, 0, 0, 0.3);
  padding: 20px;
  border-radius: 12px;
}

.detail-distribution h4 {
  color: #FCDC1E;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.distribution-bars {
  display: grid;
  gap: 12px;
}

.distribution-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.distribution-star-label {
  width: 40px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.distribution-bar-bg {
  flex: 1;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.distribution-bar-fg {
  height: 100%;
  background: linear-gradient(90deg, #FCDC1E, #ffe676);
  border-radius: 999px;
  transition: width 0.5s ease;
  box-shadow: 0 0 8px rgba(252, 220, 30, 0.5);
}

.distribution-count-label {
  width: 40px;
  text-align: right;
  color: #FCDC1E;
  font-size: 0.95rem;
  font-weight: 700;
}

.detail-info-box {
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 10px;
  padding: 16px;
}

.detail-info-box p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}

@media screen and (max-width: 1024px) {
  .avis-stats-grid {
    grid-template-columns: 1fr;
  }

  .avis-prestataires-list {
    max-height: 500px;
  }
}

@media screen and (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }

  .rating-overview-card {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

/* Presentation tabs */
.presentation-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(252, 220, 30, 0.15);
}

.tab-btn {
  padding: 14px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 2px solid rgba(252, 220, 30, 0.3);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tab-btn:hover {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.15) 0%, rgba(252, 220, 30, 0.1) 100%);
  border-color: rgba(252, 220, 30, 0.6);
  color: #FCDC1E;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.3);
}

.tab-btn.active {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  border-color: #FCDC1E;
  color: #0a0a0a;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(252, 220, 30, 0.4);
  transform: translateY(-1px);
}

.tab-btn.active:hover {
  background: linear-gradient(135deg, #ffe676 0%, #FCDC1E 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(252, 220, 30, 0.5);
}

.presentation-group {
  background: rgba(0, 0, 0, 0.2);
  padding: 32px;
  border-radius: 12px;
  border: 1px solid rgba(252, 220, 30, 0.2);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.group-title {
  color: #FCDC1E;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(252, 220, 30, 0.3);
}

.card-editor {
  background: rgba(0, 0, 0, 0.15);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-editor:last-child {
  margin-bottom: 0;
}

.card-editor h4 {
  color: rgba(252, 220, 30, 0.8);
  font-size: 1.1rem;
  margin-bottom: 16px;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

@media screen and (max-width: 768px) {
  .presentation-tabs {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
    text-align: left;
  }
}

.rating-overview-card {
  margin-top: 32px;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.08) 0%, rgba(255, 230, 118, 0.08) 100%);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.3);
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 32px;
  align-items: center;
}

.rating-left {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}

.rating-icon {
  font-size: 4rem;
  filter: drop-shadow(0 4px 8px rgba(252, 220, 30, 0.5));
}

.rating-main {
  flex: 1;
}

.rating-score {
  font-size: 3.5rem;
  font-weight: 900;
  color: #FCDC1E;
  line-height: 1;
  margin-bottom: 8px;
}

.rating-stars {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.rating-stars .star {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.2);
  transition: color 0.2s ease;
}

.rating-stars .star.filled {
  color: #FCDC1E;
  filter: drop-shadow(0 2px 4px rgba(252, 220, 30, 0.4));
}

.rating-meta {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 600;
}

.rating-right h3 {
  color: #FCDC1E;
  font-size: 1.2rem;
  margin-bottom: 16px;
  font-weight: 700;
}

.rating-distribution {
  display: grid;
  gap: 10px;
}

.distribution-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.distribution-label {
  width: 40px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.distribution-bar {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.distribution-fill {
  height: 100%;
  background: linear-gradient(90deg, #FCDC1E, #ffe676);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.distribution-count {
  width: 40px;
  text-align: right;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 600;
}
</style>

