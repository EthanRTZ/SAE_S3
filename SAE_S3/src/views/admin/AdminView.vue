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
  },
  // Nouveaux champs pour les avis festival
  avisFestivalMoyenne: 0,
  totalAvisFestival: 0,
  repartitionNotesFestival: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  },
  dernierAvisFestival: [] // AJOUT: liste des derniers avis
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

// Sections pour les statistiques
// Suppression de statistiquesSubSection
// const statistiquesSubSection = ref('prestataires')

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

    // Calculer les stats globales des avis prestataires
    let allAvis = {}

    // Charger depuis JSON
    try {
      const resp = await fetch('/data/avis.json', { cache: 'no-store' })
      if (resp.ok) {
        allAvis = await resp.json()
      }
    } catch (e) {
      console.error('Erreur avis.json', e)
    }

    // Ajouter les avis localStorage
    try {
      const stored = localStorage.getItem('festivalAvis')
      if (stored) {
        const localAvis = JSON.parse(stored)
        localAvis.forEach(avis => {
          if (!allAvis[avis.prestataire]) {
            allAvis[avis.prestataire] = { avis: [] }
          }
          allAvis[avis.prestataire].avis.push(avis)
        })
      }
    } catch (e) {
      console.error('Erreur localStorage avis', e)
    }

    let totalAvis = 0
    let sommeNotes = 0
    const repartitionNotes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    // Suppression de tousLesAvisPrestataires

    Object.entries(allAvis).forEach(([prestataire, entry]) => {
      const avisArray = entry.avis || []
      avisArray.forEach(a => {
        totalAvis++
        sommeNotes += a.note || 0
        const note = a.note || 0
        if (repartitionNotes[note] !== undefined) {
          repartitionNotes[note]++
        }
        // Suppression de l'ajout dans tousLesAvisPrestataires
      })
    })

    const notesMoyenne = totalAvis > 0 ? sommeNotes / totalAvis : 0

    // Suppression du calcul de derniersAvisPrestataires

    // ===================================
    // NOUVEAU : Calcul des avis festival
    // ===================================
    let avisFestivalList = []
    try {
      const storedFestivalAvis = localStorage.getItem('avisFestival')
      if (storedFestivalAvis) {
        avisFestivalList = JSON.parse(storedFestivalAvis)
      }
    } catch (e) {
      console.error('Erreur chargement avisFestival', e)
    }

    const totalAvisFestival = avisFestivalList.length
    let sommeNotesFestival = 0
    const repartitionNotesFestival = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    avisFestivalList.forEach(avis => {
      sommeNotesFestival += avis.note || 0
      const note = avis.note || 0
      if (repartitionNotesFestival[note] !== undefined) {
        repartitionNotesFestival[note]++
      }
    })

    const avisFestivalMoyenne = totalAvisFestival > 0 ? sommeNotesFestival / totalAvisFestival : 0

    // Récupérer les derniers avis du festival (triés par date décroissante)
    const dernierAvisFestival = avisFestivalList
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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
      repartitionNotes,
      avisFestivalMoyenne,
      totalAvisFestival,
      repartitionNotesFestival,
      dernierAvisFestival // AJOUT
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
    // 1. Charger avis depuis JSON
    let jsonAvis = {}
    try {
      const resp = await fetch('/data/avis.json', { cache: 'no-store' })
      if (resp && resp.ok) {
        jsonAvis = await resp.json()
      }
    } catch (e) {
      console.error('Erreur chargement avis.json', e)
    }

    // 2. Charger avis depuis localStorage
    let localAvisByPrestataire = {}
    try {
      const stored = localStorage.getItem('festivalAvis')
      if (stored) {
        const allLocalAvis = JSON.parse(stored)
        // Grouper par prestataire
        allLocalAvis.forEach(avis => {
          if (!localAvisByPrestataire[avis.prestataire]) {
            localAvisByPrestataire[avis.prestataire] = []
          }
          localAvisByPrestataire[avis.prestataire].push(avis)
        })
      }
    } catch (e) {
      console.error('Erreur chargement localStorage avis', e)
    }

    // 3. Calculer les stats pour chaque prestataire
    const statsArray = prestataires.value.map((p) => {
      // Fusionner les avis JSON et localStorage
      const jsonPrestataireAvis = (jsonAvis[p.nom]?.avis || [])
      const localPrestataireAvis = (localAvisByPrestataire[p.nom] || [])
      const allAvis = [...localPrestataireAvis, ...jsonPrestataireAvis]

      const base = {
        nom: p.nom,
        moyenne: 0,
        nbAvis: allAvis.length,
        parNote: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        dernierAvis: null
      }

      if (!allAvis.length) return base

      let total = 0
      allAvis.forEach((a) => {
        const n = a.note || 0
        if (base.parNote[n] !== undefined) base.parNote[n]++
        total += n
      })
      base.moyenne = total / allAvis.length

      // dernier avis = le plus récent par date
      const sorted = allAvis
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

          <div class="dash-stats-grid">
            <div class="dash-stat-card">
              <div class="dash-stat-icon">👥</div>
              <div class="dash-stat-info">
                <div class="dash-stat-value">{{ stats.totalUsers }}</div>
                <div class="dash-stat-label">Utilisateurs</div>
              </div>
            </div>
            <div class="dash-stat-card">
              <div class="dash-stat-icon">🏢</div>
              <div class="dash-stat-info">
                <div class="dash-stat-value">{{ stats.totalPrestataires }}</div>
                <div class="dash-stat-label">Prestataires</div>
              </div>
            </div>
            <div class="dash-stat-card">
              <div class="dash-stat-icon">🛠️</div>
              <div class="dash-stat-info">
                <div class="dash-stat-value">{{ stats.totalServices }}</div>
                <div class="dash-stat-label">Services</div>
              </div>
            </div>
            <div class="dash-stat-card">
              <div class="dash-stat-icon">📅</div>
              <div class="dash-stat-info">
                <div class="dash-stat-value">{{ stats.totalReservations }}</div>
                <div class="dash-stat-label">Réservations</div>
              </div>
            </div>
          </div>

          <!-- Carte de notation globale prestataires -->
          <div class="dash-rating-overview-card">
            <div class="dash-rating-left">
              <div class="dash-rating-icon">⭐</div>
              <div class="dash-rating-main">
                <div class="dash-rating-score">
                  {{ stats.totalAvis > 0 ? stats.notesMoyenne.toFixed(1) : '—' }}
                </div>
                <div class="dash-rating-stars">
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="dash-star"
                    :class="{ filled: stats.totalAvis > 0 && i <= Math.round(stats.notesMoyenne) }"
                  >★</span>
                </div>
                <div class="dash-rating-meta">
                  {{ stats.totalAvis }} avis prestataires
                </div>
              </div>
            </div>

            <div class="dash-rating-right">
              <h3>Répartition des notes prestataires</h3>
              <div class="dash-rating-distribution">
                <div
                  v-for="i in [5, 4, 3, 2, 1]"
                  :key="i"
                  class="dash-distribution-row"
                >
                  <span class="dash-distribution-label">{{ i }}★</span>
                  <div class="dash-distribution-bar">
                    <div
                      class="dash-distribution-fill"
                      :style="{
                        width: stats.totalAvis > 0 ? (stats.repartitionNotes[i] / stats.totalAvis * 100) + '%' : '0%'
                      }"
                    ></div>
                  </div>
                  <span class="dash-distribution-count">{{ stats.repartitionNotes[i] }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- CARTE AVIS FESTIVAL -->
          <div class="dash-rating-overview-card festival-card">
            <div class="dash-rating-left">
              <div class="dash-rating-icon">⭐</div>
              <div class="dash-rating-main">
                <div class="dash-rating-score">
                  {{ stats.totalAvisFestival > 0 ? stats.avisFestivalMoyenne.toFixed(1) : '—' }}
                </div>
                <div class="dash-rating-stars">
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="dash-star"
                    :class="{ filled: stats.totalAvisFestival > 0 && i <= Math.round(stats.avisFestivalMoyenne) }"
                  >★</span>
                </div>
                <div class="dash-rating-meta">
                  {{ stats.totalAvisFestival }} avis sur le festival
                </div>
              </div>
            </div>

            <div class="dash-rating-right">
              <h3>Répartition des notes du festival</h3>
              <div class="dash-rating-distribution">
                <div
                  v-for="i in [5, 4, 3, 2, 1]"
                  :key="i"
                  class="dash-distribution-row"
                >
                  <span class="dash-distribution-label">{{ i }}★</span>
                  <div class="dash-distribution-bar">
                    <div
                      class="dash-distribution-fill"
                      :style="{
                        width: stats.totalAvisFestival > 0 ? (stats.repartitionNotesFestival[i] / stats.totalAvisFestival * 100) + '%' : '0%'
                      }"
                    ></div>
                  </div>
                  <span class="dash-distribution-count">{{ stats.repartitionNotesFestival[i] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Présentation Festival (WYSIWYG) -->
        <div v-if="currentSection === 'presentation'" class="section-content">
          <div class="section-header">
            <h1 class="section-title">Présentation du festival</h1>
            <button @click="resetPresentation" class="pres-btn-reset">
              🔄 Réinitialiser aux valeurs par défaut
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
                      v-model="festivalPresentation.titre"
                      :height="300"
                      placeholder="GOLDEN COAST FESTIVAL V3"
                    />
                  </div>

                  <div class="pres-form-row">
                    <div class="pres-form-group">
                      <label class="pres-form-label">Date</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.date"
                        :height="400"
                        placeholder="28 - 29 - 30 août 2026"
                      />
                    </div>

                    <div class="pres-form-group">
                      <label class="pres-form-label">Lieu</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.lieu"
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
                  <div class="pres-card-editor">
                    <div class="pres-card-header">
                      <span class="pres-card-badge">Card 1</span>
                      <h4 class="pres-card-title">Première carte</h4>
                    </div>
                    <div class="pres-form-group">
                      <label class="pres-form-label">Titre</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.aboutCard1Titre"
                        :height="300"
                        placeholder="100% RAP FR"
                      />
                    </div>
                    <div class="pres-form-group">
                      <label class="pres-form-label">Texte</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.aboutCard1Texte"
                        :height="300"
                        placeholder="Description de la première carte..."
                      />
                    </div>
                  </div>

                  <div class="pres-card-editor">
                    <div class="pres-card-header">
                      <span class="pres-card-badge">Card 2</span>
                      <h4 class="pres-card-title">Deuxième carte</h4>
                    </div>
                    <div class="pres-form-group">
                      <label class="pres-form-label">Titre</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.aboutCard2Titre"
                        :height="300"
                        placeholder="SITE NATUREL"
                      />
                    </div>
                    <div class="pres-form-group">
                      <label class="pres-form-label">Texte</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.aboutCard2Texte"
                        :height="300"
                        placeholder="Description de la deuxième carte..."
                      />
                    </div>
                  </div>

                  <div class="pres-card-editor">
                    <div class="pres-card-header">
                      <span class="pres-card-badge">Card 3</span>
                      <h4 class="pres-card-title">Troisième carte</h4>
                    </div>
                    <div class="pres-form-group">
                      <label class="pres-form-label">Titre</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.aboutCard3Titre"
                        :height="300"
                        placeholder="52 000 FESTIVALIERS"
                      />
                    </div>
                    <div class="pres-form-group">
                      <label class="pres-form-label">Texte</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.aboutCard3Texte"
                        :height="300"
                        placeholder="Description de la troisième carte..."
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
                      v-model="festivalPresentation.desc1Titre"
                      :height="300"
                      placeholder="Le rendez-vous des fans de rap"
                    />
                  </div>

                  <div class="pres-form-group">
                    <label class="pres-form-label">Texte principal</label>
                    <WysiwygEditor
                      v-model="festivalPresentation.desc1Texte"
                      :height="450"
                      placeholder="Décrivez l'expérience du festival..."
                    />
                  </div>

                  <div class="pres-form-row">
                    <div class="pres-form-group">
                      <label class="pres-form-label">Point fort 1</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.desc1Chip1"
                        :height="300"
                        placeholder="Premier point fort"
                      />
                    </div>

                    <div class="pres-form-group">
                      <label class="pres-form-label">Point fort 2</label>
                      <WysiwygEditor
                        v-model="festivalPresentation.desc1Chip2"
                        :height="300"
                        placeholder="Deuxième point fort"
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
                      v-model="festivalPresentation.desc2Titre"
                      :height="300"
                      placeholder="Une immersion totale"
                    />
                  </div>

                  <div class="pres-form-group">
                    <label class="pres-form-label">Texte principal</label>
                    <WysiwygEditor
                      v-model="festivalPresentation.desc2Texte"
                      :height="500"
                      placeholder="Détaillez l'ambiance et l'expérience..."
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
                      v-model="festivalPresentation.ctaTitre"
                      :height="300"
                      placeholder="PRÊT À VIVRE L'EXPÉRIENCE ?"
                    />
                  </div>

                  <div class="pres-form-group">
                    <label class="pres-form-label">Texte</label>
                    <WysiwygEditor
                      v-model="festivalPresentation.ctaTexte"
                      :height="250"
                      placeholder="Message d'invitation..."
                    />
                  </div>

                  <div class="pres-form-group">
                    <label class="pres-form-label">Texte du bouton</label>
                    <WysiwygEditor
                      v-model="festivalPresentation.ctaBouton"
                      :height="250"
                      placeholder="RÉSERVER MA PLACE"
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
                      v-model="festivalPresentation.mapTitre"
                      :height="300"
                      placeholder="LOCALISATION"
                    />
                  </div>

                  <div class="pres-form-group">
                    <label class="pres-form-label">Texte d'introduction</label>
                    <WysiwygEditor
                      v-model="festivalPresentation.mapIntro"
                      :height="250"
                      placeholder="Retrouvez tous les points d'intérêt..."
                    />
                  </div>
                </div>
              </div>

              <div class="pres-actions">
                <button @click="savePresentation" class="pres-btn-save">
                  <span class="pres-btn-icon">💾</span>
                  Sauvegarder toutes les modifications
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Carte Interactive -->
        <div v-if="currentSection === 'carte'" class="section-content">
          <div class="section-header">
            <h1 class="section-title">Configuration de la carte interactive</h1>
          </div>

          <div class="carte-config-wrapper">
            <div class="carte-intro-card">
              <div class="carte-intro-icon">🗺️</div>
              <div class="carte-intro-content">
                <h3>Gestion des emplacements</h3>
                <p>Associez automatiquement les prestataires aux emplacements sur la carte interactive du festival. Chaque prestataire peut être placé dans une zone spécifique pour faciliter la navigation des festivaliers.</p>
              </div>
            </div>

            <div class="carte-stats-grid">
              <div class="carte-stat-card">
                <div class="carte-stat-icon">🏢</div>
                <div class="carte-stat-info">
                  <div class="carte-stat-value">{{ prestataires.length }}</div>
                  <div class="carte-stat-label">Prestataires</div>
                </div>
              </div>
              <div class="carte-stat-card">
                <div class="carte-stat-icon">📍</div>
                <div class="carte-stat-info">
                  <div class="carte-stat-value">{{ prestataires.length }}</div>
                  <div class="carte-stat-label">Emplacements configurés</div>
                </div>
              </div>
              <div class="carte-stat-card">
                <div class="carte-stat-icon">🎯</div>
                <div class="carte-stat-info">
                  <div class="carte-stat-value">3</div>
                  <div class="carte-stat-label">Zones disponibles</div>
                </div>
              </div>
            </div>

            <div class="carte-prestataires-container">
              <div class="carte-section-header">
                <div class="carte-header-icon">📍</div>
                <div class="carte-header-content">
                  <h3 class="carte-section-title">Attribution des emplacements</h3>
                  <p class="carte-section-subtitle">Définissez l'emplacement de chaque prestataire sur la carte du festival</p>
                </div>
              </div>

              <div class="carte-prestataires-grid">
                <div
                  v-for="(prestataire, index) in prestataires"
                  :key="prestataire.nom"
                  class="carte-prestataire-card"
                >
                  <div class="carte-card-header">
                    <div class="carte-card-image-wrapper">
                      <img
                        v-if="prestataire.image"
                        :src="prestataire.image"
                        :alt="prestataire.nom"
                        class="carte-card-image"
                      />
                      <div v-else class="carte-card-placeholder">
                        <span class="prest-placeholder-icon">🏢</span>
                      </div>
                    </div>
                    <div class="carte-card-info">
                      <h4 class="carte-card-name">{{ prestataire.nom }}</h4>
                      <span class="carte-card-type">{{ prestataire.type }}</span>
                    </div>
                  </div>

                  <div class="carte-card-body">
                    <div class="carte-location-selector">
                      <label class="carte-location-label">
                        <span class="carte-label-icon">📍</span>
                        <span class="carte-label-text">Emplacement sur la carte</span>
                      </label>
                      <select class="carte-location-select">
                        <option value="">-- Sélectionner une zone --</option>
                        <option :value="`zone-a-${index + 1}`">Zone A - Stand {{ index + 1 }}</option>
                        <option :value="`zone-b-${index + 1}`">Zone B - Stand {{ index + 1 }}</option>
                        <option :value="`zone-c-${index + 1}`">Zone C - Stand {{ index + 1 }}</option>
                      </select>
                    </div>

                    <div class="carte-card-meta">
                      <span class="carte-meta-badge">
                        <span class="carte-badge-icon">🛠️</span>
                        <span class="carte-badge-text">{{ prestataire.services?.length || 0 }} service(s)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="carte-actions">
              <button class="carte-btn-save">
                <span class="carte-btn-icon">💾</span>
                <span class="carte-btn-text">Enregistrer la configuration</span>
              </button>
              <button class="carte-btn-preview">
                <span class="carte-btn-icon">👁️</span>
                <span class="carte-btn-text">Prévisualiser la carte</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Programmation -->
        <div v-if="currentSection === 'programmation'" class="section-content">
          <div class="section-header">
            <h1 class="section-title">Gestion de la programmation</h1>
          </div>

          <div class="prog-config-wrapper">
            <div class="prog-intro-card">
              <div class="prog-intro-icon">🎵</div>
              <div class="prog-intro-content">
                <h3>Programmation artistique</h3>
                <p>Gérez les créneaux horaires des artistes sur les différentes scènes du festival. Planifiez les performances jour par jour et scène par scène pour offrir la meilleure expérience aux festivaliers.</p>
              </div>
            </div>

            <div class="prog-controls-card">
              <div class="prog-control-group">
                <label class="prog-control-label">
                  <span class="prog-label-icon">📅</span>
                  Sélectionner le jour
                </label>
                <select v-model="selectedDayIndex" class="prog-select">
                  <option v-for="(day, index) in programmation.schedules" :key="index" :value="index">
                    {{ day.day || `Jour ${index + 1}` }}
                  </option>
                </select>
              </div>

              <div class="prog-control-group">
                <label class="prog-control-label">
                  <span class="prog-label-icon">🎤</span>
                  Sélectionner la scène
                </label>
                <select v-model="selectedStage" class="prog-select">
                  <option v-for="stage in programmation.stages" :key="stage.name" :value="stage.name">
                    {{ stage.name }} {{ stage.by ? `(by ${stage.by})` : '' }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="selectedStage && programmation.schedules[selectedDayIndex]" class="prog-slots-container">
              <div class="prog-slots-header">
                <div class="prog-slots-title-wrapper">
                  <h3 class="prog-slots-title">{{ selectedStage }}</h3>
                  <p class="prog-slots-subtitle">Créneaux programmés pour cette scène</p>
                </div>
                <button @click="addSlot(selectedDayIndex, selectedStage)" class="btn-prog-add">
                  <span class="btn-prog-icon">➕</span>
                  Ajouter un créneau
                </button>
              </div>

              <div v-if="programmation.schedules[selectedDayIndex][selectedStage]?.length" class="prog-slots-grid">
                <div
                  v-for="(slot, slotIndex) in programmation.schedules[selectedDayIndex][selectedStage]"
                  :key="slotIndex"
                  class="prog-slot-card"
                  :class="{ 'prog-slot-editing': editingSlot && editingSlot.dayIndex === selectedDayIndex && editingSlot.stageName === selectedStage && editingSlot.slotIndex === slotIndex }"
                >
                  <div v-if="editingSlot && editingSlot.dayIndex === selectedDayIndex && editingSlot.stageName === selectedStage && editingSlot.slotIndex === slotIndex" class="prog-slot-editor">
                    <div class="prog-editor-header">
                      <span class="prog-editor-icon">✏️</span>
                      <h4>Modifier le créneau</h4>
                    </div>

                    <div class="prog-form-group">
                      <label class="prog-form-label">Nom de l'artiste</label>
                      <input v-model="slot.artist" class="prog-form-input" placeholder="Ex: Nekfeu, PNL..." />
                    </div>

                    <div class="prog-form-row">
                      <div class="prog-form-group">
                        <label class="prog-form-label">Heure de début</label>
                        <input v-model="slot.start" type="time" class="prog-form-input" />
                      </div>
                      <div class="prog-form-group">
                        <label class="prog-form-label">Heure de fin</label>
                        <input v-model="slot.end" type="time" class="prog-form-input" />
                      </div>
                    </div>

                    <div class="prog-form-group">
                      <label class="prog-form-label">Style musical</label>
                      <input v-model="slot.style" class="prog-form-input" placeholder="Ex: Rap, Trap, Boom Bap..." />
                    </div>

                    <div class="prog-editor-actions">
                      <button @click="saveSlot" class="btn-prog-save">
                        <span class="btn-prog-icon">💾</span>
                        Sauvegarder
                      </button>
                      <button @click="cancelEdit" class="btn-prog-cancel">
                        <span class="btn-prog-icon">❌</span>
                        Annuler
                      </button>
                    </div>
                  </div>

                  <div v-else class="prog-slot-display">
                    <div class="prog-slot-badge">
                      <span class="prog-badge-icon">🎤</span>
                      Créneau {{ slotIndex + 1 }}
                    </div>
                    <div class="prog-slot-info">
                      <h4 class="prog-artist-name">{{ slot.artist }}</h4>
                      <div class="prog-slot-meta">
                        <span class="prog-time-badge">
                          <span class="prog-time-icon">🕐</span>
                          {{ slot.start }} - {{ slot.end }}
                        </span>
                        <span class="prog-style-badge">
                          <span class="prog-style-icon">🎵</span>
                          {{ slot.style }}
                        </span>
                      </div>
                    </div>
                    <div class="prog-slot-actions">
                      <button @click="editSlot(selectedDayIndex, selectedStage, slotIndex)" class="btn-prog-edit">
                        <span class="btn-action-icon">✏️</span>
                      </button>
                      <button @click="deleteSlot(selectedDayIndex, selectedStage, slotIndex)" class="btn-prog-delete">
                        <span class="btn-action-icon">🗑️</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="prog-empty-state">
                <div class="prog-empty-icon">🎭</div>
                <h3 class="prog-empty-title">Aucun créneau programmé</h3>
                <p class="prog-empty-text">Il n'y a pas encore d'artistes programmés sur cette scène pour ce jour.</p>
                <button @click="addSlot(selectedDayIndex, selectedStage)" class="btn-prog-add-first">
                  <span class="btn-prog-icon">➕</span>
                  Ajouter le premier créneau
                </button>
              </div>
            </div>

            <div class="prog-global-actions">
              <button @click="saveProgrammation" class="btn-prog-save-all">
                <span class="btn-prog-icon">💾</span>
                Sauvegarder toute la programmation
              </button>
            </div>
          </div>
        </div>

        <!-- Gestion Prestataires -->
        <div v-if="currentSection === 'prestataires'" class="section-content">
          <div class="section-header">
            <h1 class="section-title">Gestion des prestataires</h1>
          </div>

          <div class="prest-config-wrapper">
            <div class="prest-intro-card">
              <div class="prest-intro-icon">🏢</div>
              <div class="prest-intro-content">
                <h3>Gérez vos prestataires</h3>
                <p>Modifiez les informations, descriptions et services de tous les prestataires du festival. Les modifications sont sauvegardées localement et peuvent être réinitialisées à tout moment.</p>
              </div>
            </div>

            <div v-if="Object.keys(customPrestataires).length > 0" class="prest-modifications-alert">
              <div class="prest-alert-icon">📝</div>
              <div class="prest-alert-content">
                <strong class="prest-alert-title">{{ Object.keys(customPrestataires).length }} prestataire(s) modifié(s)</strong>
                <p class="prest-alert-text">Des modifications locales sont en cours sur certains prestataires</p>
              </div>
            </div>

            <div class="prest-stats-row">
              <div class="prest-stat-box">
                <div class="prest-stat-icon">🏢</div>
                <div class="prest-stat-details">
                  <div class="prest-stat-number">{{ prestataires.length }}</div>
                  <div class="prest-stat-label">Prestataires</div>
                </div>
              </div>
              <div class="prest-stat-box">
                <div class="prest-stat-icon">✏️</div>
                <div class="prest-stat-details">
                  <div class="prest-stat-number">{{ Object.keys(customPrestataires).length }}</div>
                  <div class="prest-stat-label">Modifiés</div>
                </div>
              </div>
              <div class="prest-stat-box">
                <div class="prest-stat-icon">🛠️</div>
                <div class="prest-stat-details">
                  <div class="prest-stat-number">{{ prestataires.reduce((acc, p) => acc + (p.services?.length || 0), 0) }}</div>
                  <div class="prest-stat-label">Services</div>
                </div>
              </div>
            </div>

            <div class="prest-list-container">
              <h3 class="prest-list-title">Liste des prestataires</h3>
              <div class="prest-grid">
                <div
                  v-for="prestataire in prestataires"
                  :key="prestataire.nom"
                  @click="selectPrestataire(prestataire)"
                  class="prest-card"
                  :class="{ 'prest-card-modified': hasModifications(prestataire) }"
                >
                  <div v-if="hasModifications(prestataire)" class="prest-modified-badge">
                    <span class="prest-badge-icon">✏️</span>
                    Modifié
                  </div>

                  <div class="prest-card-header">
                    <img
                      v-if="prestataire.image"
                      :src="prestataire.image"
                      :alt="prestataire.nom"
                      class="prest-card-image"
                    />
                    <div v-else class="prest-card-placeholder">
                      <span class="prest-placeholder-icon">🏢</span>
                    </div>
                  </div>

                  <div class="prest-card-body">
                    <h4 class="prest-card-name">{{ prestataire.nom }}</h4>
                    <span class="prest-card-type">{{ prestataire.type }}</span>
                    
                    <div class="prest-card-meta">
                      <div class="prest-meta-item">
                        <span class="prest-meta-icon">🛠️</span>
                        <span class="prest-meta-value">{{ prestataire.services?.length || 0 }} service(s)</span>
                      </div>
                    </div>

                    <div v-if="hasModifications(prestataire)" class="prest-card-changes">
                      <span class="prest-changes-label">Modifications :</span>
                      <div class="prest-changes-tags">
                        <span
                          v-for="field in getModifiedFields(prestataire)"
                          :key="field"
                          class="prest-change-tag"
                        >{{ field }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="prest-card-footer">
                    <button class="prest-btn-view">
                      <span class="prest-btn-icon">👁️</span>
                      Voir les détails
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Détail Prestataire -->
        <div v-if="currentSection === 'prestataire-detail' && selectedPrestataire" class="section-content">
          <div class="section-header">
            <button @click="changeSection('prestataires')" class="btn-back">← Retour</button>
            <h1 class="section-title">{{ selectedPrestataire.nom }}</h1>
          </div>

          <div class="prest-detail-wrapper">
            <div v-if="hasModifications(selectedPrestataire)" class="prest-detail-alert">
              <div class="prest-detail-alert-icon">⚠️</div>
              <div class="prest-detail-alert-content">
                <strong class="prest-detail-alert-title">Ce prestataire a des modifications locales</strong>
                <p class="prest-detail-alert-text">
                  Champs modifiés : {{ getModifiedFields(selectedPrestataire).join(', ') || 'Aucun' }}
                </p>
              </div>
              <button @click="resetPrestataire" class="prest-btn-reset-detail">
                <span class="prest-btn-icon">🔄</span>
                Réinitialiser
              </button>
            </div>

            <div class="prest-editor-card">
              <div class="prest-editor-section">
                <h3 class="prest-editor-section-title">
                  <span class="prest-section-icon">ℹ️</span>
                  Informations générales
                </h3>

                <div class="prest-form-group">
                  <label class="prest-form-label">Nom du prestataire</label>
                  <input
                    v-model="selectedPrestataire.nom"
                    type="text"
                    class="prest-form-input"
                    placeholder="Nom du prestataire"
                  />
                </div>

                <div class="prest-form-group">
                  <label class="prest-form-label">Type</label>
                  <input
                    v-model="selectedPrestataire.type"
                    type="text"
                    class="prest-form-input"
                    placeholder="Type de prestataire"
                  />
                </div>

                <div class="prest-form-group">
                  <label class="prest-form-label">Image (URL)</label>
                  <input
                    v-model="selectedPrestataire.image"
                    type="text"
                    class="prest-form-input"
                    placeholder="https://..."
                  />
                  <div v-if="selectedPrestataire.image" class="prest-image-preview">
                    <img :src="selectedPrestataire.image" alt="Aperçu" />
                  </div>
                </div>
              </div>

              <div class="prest-editor-section">
                <h3 class="prest-editor-section-title">
                  <span class="prest-section-icon">📝</span>
                  Description (Éditeur WYSIWYG)
                </h3>

                <div class="prest-form-group">
                  <WysiwygEditor
                    v-model="selectedPrestataire.description"
                    :height="600"
                    placeholder="Décrivez le prestataire, ajoutez des images..."
                  />
                  <p class="prest-form-hint">
                    <span class="hint-icon">💡</span>
                    Utilisez l'éditeur pour formater le texte et insérer des images
                  </p>
                </div>

                <div class="prest-form-group">
                  <label class="prest-form-label">Aperçu de la description</label>
                  <div class="prest-preview-box" v-html="selectedPrestataire.description"></div>
                </div>
              </div>

              <div class="prest-editor-section">
                <div class="prest-services-header">
                  <h3 class="prest-editor-section-title">
                    <span class="prest-section-icon">🛠️</span>
                    Services ({{ selectedPrestataire.services?.length || 0 }})
                  </h3>
                  <button @click="addService" class="prest-btn-add-service">
                    <span class="prest-btn-icon">➕</span>
                    Ajouter un service
                  </button>
                </div>

                <div v-if="selectedPrestataire.services?.length" class="prest-services-list">
                  <div
                    v-for="(service, index) in selectedPrestataire.services"
                    :key="index"
                    class="prest-service-card"
                    :class="{ 'prest-service-inactive': service.actif === false }"
                  >
                    <div class="prest-service-number">
                      <span class="prest-number-icon">📋</span>
                      Service {{ index + 1 }}
                    </div>

                    <div class="prest-service-content">
                      <div class="prest-form-group">
                        <label class="prest-form-label-small">Nom du service</label>
                        <input
                          v-model="service.nom"
                          type="text"
                          class="prest-form-input"
                          placeholder="Nom du service"
                        />
                      </div>

                      <div class="prest-form-group">
                        <label class="prest-form-label-small">Description</label>
                        <textarea
                          v-model="service.description"
                          class="prest-form-textarea"
                          rows="3"
                          placeholder="Description du service"
                        ></textarea>
                      </div>
                    </div>

                    <div class="prest-service-actions">
                      <button
                        @click="toggleService(index)"
                        :class="['prest-btn-toggle', { 'prest-btn-toggle-active': service.actif !== false }]"
                      >
                        <span class="prest-toggle-icon">{{ service.actif !== false ? '✓' : '✗' }}</span>
                        {{ service.actif !== false ? 'Actif' : 'Inactif' }}
                      </button>
                      <button @click="deleteService(index)" class="prest-btn-delete-service">
                        <span class="prest-btn-icon">🗑️</span>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else class="prest-services-empty">
                  <div class="prest-empty-icon">🛠️</div>
                  <h4 class="prest-empty-title">Aucun service</h4>
                  <p class="prest-empty-text">Ajoutez des services pour ce prestataire</p>
                </div>
              </div>

              <div class="prest-editor-footer">
                <button @click="savePrestataireChanges" class="prest-btn-save">
                  <span class="prest-btn-icon">💾</span>
                  Sauvegarder toutes les modifications
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div v-if="currentSection === 'statistiques'" class="section-content">
          <h1 class="section-title">Statistiques</h1>

          <div class="stats-main-section">
            <div class="stats-section-header">
              <h2 class="stats-section-title">🏢 Statistiques des Prestataires</h2>
              <p class="stats-section-subtitle">Performances et retours clients sur les prestataires du festival</p>
            </div>

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
                    <div class="bar-container">
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

            <div class="avis-stats-section">
              <h2 class="avis-section-title">📊 Notes et avis des prestataires</h2>
              <p class="avis-section-subtitle">
                Vue d'ensemble des avis (notes et commentaires) laissés par les festivaliers sur chaque prestataire.
              </p>

              <div class="avis-stats-grid">
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

          <div class="stats-main-section">
            <div class="stats-section-header festival-header">
              <h2 class="stats-section-title">🎪 Statistiques du Festival</h2>
              <p class="stats-section-subtitle">Retours festivaliers et performances commerciales de l'événement</p>
            </div>

            <div class="festival-avis-stats">
              <h3 class="festival-subsection-title">⭐ Notes et avis du festival</h3>

              <div class="festival-rating-overview">
                <div class="festival-rating-card-main">
                  <div class="festival-rating-icon-wrapper">
                    <div class="festival-rating-icon-large">🎉</div>
                  </div>
                  <div class="festival-rating-details">
                    <div class="festival-rating-score-huge">
                      {{ stats.totalAvisFestival > 0 ? stats.avisFestivalMoyenne.toFixed(1) : '—' }}
                    </div>
                    <div class="festival-rating-stars-large">
                      <span
                        v-for="i in 5"
                        :key="i"
                        class="star-huge"
                        :class="{ filled: stats.totalAvisFestival > 0 && i <= Math.round(stats.avisFestivalMoyenne) }"
                      >★</span>
                    </div>
                    <div class="festival-rating-label">
                      Note moyenne du festival
                    </div>
                    <div class="festival-rating-count">
                      {{ stats.totalAvisFestival }} avis festivaliers
                    </div>
                  </div>
                </div>

                <div class="festival-rating-distribution-card">
                  <h4>Répartition des notes</h4>
                  <div class="festival-distribution-bars">
                    <div
                      v-for="i in [5, 4, 3, 2, 1]"
                      :key="i"
                      class="festival-distribution-row"
                    >
                      <span class="festival-dist-label">{{ i }}★</span>
                      <div class="festival-dist-bar-bg">
                        <div
                          class="festival-dist-bar-fill"
                          :style="{
                            width: stats.totalAvisFestival > 0 ? (stats.repartitionNotesFestival[i] / stats.totalAvisFestival * 100) + '%' : '0%'
                          }"
                        ></div>
                      </div>
                      <span class="festival-dist-count">{{ stats.repartitionNotesFestival[i] }}</span>
                      <span class="festival-dist-percent">
                        {{ stats.totalAvisFestival > 0 ? Math.round((stats.repartitionNotesFestival[i] / stats.totalAvisFestival) * 100) : 0 }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="festival-comments-section">
                <h4 class="comments-title">💬 Commentaires des festivaliers</h4>
                <div v-if="stats.dernierAvisFestival.length > 0" class="comments-list">
                  <div
                    v-for="avis in stats.dernierAvisFestival"
                    :key="avis.id"
                    class="comment-card"
                  >
                    <div class="comment-header">
                      <div class="comment-author">
                        <span class="author-icon">👤</span>
                        <strong>{{ avis.nom || 'Anonyme' }}</strong>
                      </div>
                      <div class="comment-rating">
                        <span
                          v-for="i in 5"
                          :key="i"
                          class="comment-star"
                          :class="{ filled: i <= avis.note }"
                        >★</span>
                      </div>
                    </div>
                    <p class="comment-text">{{ avis.commentaire }}</p>
                    <div class="comment-date">
                      {{ new Date(avis.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) }}
                    </div>
                  </div>
                </div>
                <div v-else class="no-comments">
                  <span class="no-comments-icon">💭</span>
                  <p>Aucun avis sur le festival pour le moment</p>
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

<style>
/* ================================================ */
/* STYLES DE BASE */
/* ================================================ */

.admin-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0b122a 0%, #07103a 100%);
  color: #fff;
}

.loading {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 80px 20px;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.85);
}

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

/* ================================================ */
/* SIDEBAR */
/* ================================================ */

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

/* ================================================ */
/* MAIN CONTENT */
/* ================================================ */

.admin-main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.section-content {
  max-width: 1600px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.section-title {
  color: #FCDC1E;
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 2px 20px rgba(252, 220, 30, 0.5);
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateX(-4px);
}

/* ================================================ */
/* TABLEAU DE BORD */
/* ================================================ */

.dash-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 28px;
  margin-bottom: 48px;
}

.dash-stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(252, 220, 30, 0.05) 100%);
  padding: 32px;
  border-radius: 20px;
  border: 2px solid rgba(252, 220, 30, 0.25);
  display: flex;
  align-items: center;
  gap: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.dash-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #FCDC1E 0%, #ffe676 100%);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.dash-stat-card:hover {
  transform: translateY(-6px);
  border-color: rgba(252, 220, 30, 0.5);
  box-shadow: 0 12px 48px rgba(252, 220, 30, 0.3);
}

.dash-stat-card:hover::before {
  transform: scaleX(1);
}

.dash-stat-icon {
  font-size: 3rem;
  width: 85px;
  height: 85px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 18px;
  border: 2px solid rgba(252, 220, 30, 0.35);
  flex-shrink: 0;
  transition: all 0.4s ease;
  filter: drop-shadow(0 6px 16px rgba(252, 220, 30, 0.4));
}

.dash-stat-card:hover .dash-stat-icon {
  transform: scale(1.15) rotate(-5deg);
  filter: drop-shadow(0 8px 24px rgba(252, 220, 30, 0.6));
}

.dash-stat-info {
  flex: 1;
}

.dash-stat-value {
  font-size: 2.8rem;
  font-weight: 900;
  color: #FCDC1E;
  margin-bottom: 8px;
  line-height: 1;
  text-shadow: 0 2px 16px rgba(252, 220, 30, 0.5);
}

.dash-stat-label {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.dash-rating-overview-card {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(252, 220, 30, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 32px;
  display: flex;
  gap: 40px;
  align-items: stretch;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  transition: all 0.4s ease;
}

.dash-rating-overview-card:hover {
  border-color: rgba(252, 220, 30, 0.3);
  box-shadow: 0 12px 48px rgba(252, 220, 30, 0.2);
}

.dash-rating-overview-card.festival-card {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(168, 85, 247, 0.05) 100%);
  border-color: rgba(168, 85, 247, 0.25);
}

.dash-rating-overview-card.festival-card:hover {
  border-color: rgba(168, 85, 247, 0.4);
  box-shadow: 0 12px 48px rgba(168, 85, 247, 0.25);
}

.dash-rating-left {
  display: flex;
  gap: 32px;
  align-items: center;
  min-width: 380px;
}

.dash-rating-icon {
  font-size: 5rem;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 24px;
  border: 3px solid rgba(252, 220, 30, 0.4);
  flex-shrink: 0;
  filter: drop-shadow(0 8px 24px rgba(252, 220, 30, 0.5));
  transition: all 0.4s ease;
}

.dash-rating-overview-card:hover .dash-rating-icon {
  transform: scale(1.1) rotate(-5deg);
}

.dash-rating-overview-card.festival-card .dash-rating-icon {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(168, 85, 247, 0.15));
  border-color: rgba(168, 85, 247, 0.4);
  filter: drop-shadow(0 8px 24px rgba(168, 85, 247, 0.5));
}

.dash-rating-main {
  flex: 1;
  text-align: center;
}

.dash-rating-score {
  font-size: 4.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 16px;
  text-shadow: 0 4px 20px rgba(252, 220, 30, 0.6);
}

.dash-rating-overview-card.festival-card .dash-rating-score {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 20px rgba(168, 85, 247, 0.6);
}

.dash-rating-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.dash-star {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.dash-star.filled {
  color: #FCDC1E;
  filter: drop-shadow(0 2px 12px rgba(252, 220, 30, 0.9));
}

.dash-rating-overview-card.festival-card .dash-star.filled {
  color: #a855f7;
  filter: drop-shadow(0 2px 12px rgba(168, 85, 247, 0.9));
}

.dash-rating-meta {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.dash-rating-right {
  flex: 1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(252, 220, 30, 0.03) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  padding: 32px;
}

.dash-rating-overview-card.festival-card .dash-rating-right {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%);
}

.dash-rating-right h3 {
  color: #FCDC1E;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(252, 220, 30, 0.5);
}

.dash-rating-overview-card.festival-card .dash-rating-right h3 {
  color: #a855f7;
  text-shadow: 0 2px 8px rgba(168, 85, 247, 0.5);
}

.dash-rating-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dash-distribution-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dash-distribution-label {
  min-width: 40px;
  font-size: 0.95rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.dash-distribution-bar {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dash-distribution-fill {
  height: 100%;
  background: linear-gradient(90deg, #FCDC1E 0%, #ffe676 100%);
  border-radius: 7px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(252, 220, 30, 0.6);
}

.dash-rating-overview-card.festival-card .dash-distribution-fill {
  background: linear-gradient(90deg, #a855f7 0%, #c084fc 100%);
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.6);
}

.dash-distribution-count {
  min-width: 40px;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 800;
  color: #FCDC1E;
}

.dash-rating-overview-card.festival-card .dash-distribution-count {
  color: #a855f7;
}

/* ================================================ */
/* GESTION UTILISATEURS */
/* ================================================ */

.btn-add-user {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  border: none;
  color: #0a0a0a;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(252, 220, 30, 0.3);
}

.btn-add-user:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(252, 220, 30, 0.5);
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-item {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(252, 220, 30, 0.03) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-item:hover {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.1) 0%, rgba(252, 220, 30, 0.05) 100%);
  border-color: rgba(252, 220, 30, 0.4);
  transform: translateX(8px);
  box-shadow: 0 4px 24px rgba(252, 220, 30, 0.2);
}

.user-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(252, 220, 30, 0.15);
  border-radius: 14px;
  border: 2px solid rgba(252, 220, 30, 0.3);
}

.user-info {
  flex: 1;
}

.user-email {
  color: #FCDC1E;
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.user-role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.role-admin {
  background: rgba(255, 59, 48, 0.2);
  border: 1px solid rgba(255, 59, 48, 0.4);
  color: #ff3b30;
}

.role-prestataire {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #3b82f6;
}

.role-user {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: #22c55e;
}

.user-prestataire {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.arrow {
  color: rgba(255, 255, 255, 0.4);
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.user-item:hover .arrow {
  transform: translateX(8px);
  color: #FCDC1E;
}

/* User editor */
.user-editor {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(252, 220, 30, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.form-group {
  margin-bottom: 28px;
}

.form-group label {
  display: block;
  color: #FCDC1E;
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(252, 220, 30, 0.5);
  box-shadow: 0 0 0 3px rgba(252, 220, 30, 0.1);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin-top: 8px;
}

.user-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.btn-save {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  border: none;
  color: #0a0a0a;
  padding: 16px 40px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.4s ease;
  box-shadow: 0 6px 28px rgba(252, 220, 30, 0.4);
  flex: 1;
}

.btn-save:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(252, 220, 30, 0.6);
}

.btn-delete-user {
  background: rgba(255, 59, 48, 0.15);
  border: 2px solid rgba(255, 59, 48, 0.4);
  color: #ff3b30;
  padding: 14px 32px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.btn-delete-user:hover {
  background: rgba(255, 59, 48, 0.25);
  border-color: rgba(255, 59, 48, 0.6);
  transform: translateY(-2px);
}

.warning-box {
  background: rgba(255, 152, 0, 0.15);
  border: 2px solid rgba(255, 152, 0, 0.4);
  color: #ff9800;
  padding: 16px;
  border-radius: 12px;
  margin-top: 20px;
  text-align: center;
  font-weight: 600;
}

/* ================================================ */
/* GESTION PRESTATAIRES - STYLES COMPLETS */
/* ================================================ */

.prest-config-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.prest-intro-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 28px;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
  transition: all 0.4s ease;
}

.prest-intro-card:hover {
  box-shadow: 0 12px 48px rgba(59, 130, 246, 0.25);
  transform: translateY(-4px);
}

.prest-intro-icon {
  font-size: 4rem;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.15));
  border-radius: 20px;
  border: 3px solid rgba(59, 130, 246, 0.4);
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.prest-intro-content h3 {
  color: #3b82f6;
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-shadow: 0 2px 12px rgba(59, 130, 246, 0.4);
}

.prest-intro-content p {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  font-size: 1rem;
  margin: 0;
}

.prest-modifications-alert {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.08) 100%);
  border: 2px solid rgba(234, 179, 8, 0.4);
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(234, 179, 8, 0.2);
}

.prest-alert-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(234, 179, 8, 0.2);
  border-radius: 14px;
  border: 2px solid rgba(234, 179, 8, 0.4);
}

.prest-alert-title {
  color: #eab308;
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 6px;
}

.prest-alert-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin: 0;
}

.prest-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.prest-stat-box {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 24px;
  transition: all 0.4s ease;
}

.prest-stat-box:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(59, 130, 246, 0.25);
}

.prest-stat-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.15));
  border-radius: 16px;
  border: 2px solid rgba(59, 130, 246, 0.35);
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
}

.prest-stat-details {
  flex: 1;
}

.prest-stat-number {
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 8px;
}

.prest-stat-label {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.prest-list-container {
  background: rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 0;
  margin-bottom: 32px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.prest-list-title {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  padding: 28px 32px;
  margin: 0;
  color: #3b82f6;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.prest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 28px;
  padding: 32px;
}

.prest-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  overflow: hidden;
  transition: all 0.4s ease;
  cursor: pointer;
  position: relative;
}

.prest-card:hover {
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 48px rgba(59, 130, 246, 0.3);
}

.prest-card-modified {
  border-color: rgba(234, 179, 8, 0.4);
}

.prest-card-modified:hover {
  border-color: rgba(234, 179, 8, 0.6);
  box-shadow: 0 16px 48px rgba(234, 179, 8, 0.3);
}

.prest-modified-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.9), rgba(202, 138, 4, 0.9));
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(234, 179, 8, 0.4);
}

.prest-card-header {
  padding: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.prest-card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.prest-card-placeholder {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08));
  border-radius: 12px;
  border: 2px solid rgba(59, 130, 246, 0.3);
}

.prest-placeholder-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.prest-card-body {
  padding: 24px;
}

.prest-card-name {
  color: #3b82f6;
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prest-card-type {
  display: inline-block;
  background: rgba(59, 130, 246, 0.15);
  border: 2px solid rgba(59, 130, 246, 0.35);
  color: #3b82f6;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.prest-card-meta {
  margin: 16px 0;
}

.prest-meta-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 10px;
}

.prest-meta-icon {
  font-size: 1.2rem;
}

.prest-meta-value {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 700;
}

.prest-card-changes {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.prest-changes-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  display: block;
  margin-bottom: 10px;
}

.prest-changes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prest-change-tag {
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.35);
  color: #eab308;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.prest-card-footer {
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.prest-btn-view {
  width: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: white;
  padding: 14px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  transition: all 0.4s ease;
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.prest-btn-view:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.5);
}

/* Détail prestataire */
.prest-detail-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.prest-detail-alert {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.08) 100%);
  border: 2px solid rgba(234, 179, 8, 0.4);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.prest-detail-alert-icon {
  font-size: 2.5rem;
}

.prest-detail-alert-content {
  flex: 1;
}

.prest-detail-alert-title {
  color: #eab308;
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 6px;
}

.prest-detail-alert-text {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.prest-btn-reset-detail {
  background: rgba(255, 59, 48, 0.15);
  border: 2px solid rgba(255, 59, 48, 0.4);
  color: #ff3b30;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prest-btn-reset-detail:hover {
  background: rgba(255, 59, 48, 0.25);
  transform: translateY(-2px);
}

.prest-editor-card {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.prest-editor-section {
  margin-bottom: 40px;
  padding-bottom: 40px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.prest-editor-section:last-child {
  border-bottom: none;
}

.prest-editor-section-title {
  color: #3b82f6;
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-transform: uppercase;
}

.prest-section-icon {
  font-size: 1.8rem;
}

.prest-form-group {
  margin-bottom: 24px;
}

.prest-form-label {
  display: block;
  color: #3b82f6;
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.prest-form-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.prest-form-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.prest-form-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;
}

.prest-form-textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.prest-form-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin-top: 8px;
}

.prest-image-preview {
  margin-top: 16px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(59, 130, 246, 0.3);
}

.prest-image-preview img {
  width: 100%;
  max-width: 400px;
  height: auto;
  display: block;
}

.prest-preview-box {
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  max-height: 400px;
  overflow-y: auto;
}

.prest-services-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.prest-btn-add-service {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.prest-btn-add-service:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.prest-services-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prest-service-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.prest-service-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
}

.prest-service-inactive {
  opacity: 0.5;
}

.prest-service-number {
  background: rgba(59, 130, 246, 0.15);
  border: 2px solid rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.prest-number-icon {
  font-size: 1rem;
}

.prest-service-content {
  margin-bottom: 16px;
}

.prest-form-label-small {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.prest-service-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.prest-btn-toggle {
  background: rgba(255, 59, 48, 0.15);
  border: 2px solid rgba(255, 59, 48, 0.4);
  color: #ff3b30;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.prest-btn-toggle-active {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: #22c55e;
}

.prest-toggle-icon {
  font-size: 1rem;
}

.prest-btn-delete-service {
  background: rgba(255, 59, 48, 0.15);
  border: 2px solid rgba(255, 59, 48, 0.4);
  color: #ff3b30;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.prest-btn-delete-service:hover {
  background: rgba(255, 59, 48, 0.25);
}

.prest-services-empty {
  text-align: center;
  padding: 60px 20px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.prest-empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.3;
}

.prest-empty-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.prest-empty-text {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.prest-editor-footer {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
}

.prest-btn-save {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: white;
  padding: 16px 40px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.4s ease;
  box-shadow: 0 6px 28px rgba(59, 130, 246, 0.4);
  display: flex;
  align-items: center;
  gap: 12px;
}

.prest-btn-save:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.6);
}

/* ================================================ */
/* STATISTIQUES - STYLES COMPLETS */
/* ================================================ */

.stats-main-section {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.stats-section-header {
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.15);
}

.stats-section-header.festival-header {
  border-bottom-color: rgba(168, 85, 247, 0.3);
}

.stats-section-title {
  color: #3b82f6;
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 2px 16px rgba(59, 130, 246, 0.5);
}

.stats-section-header.festival-header .stats-section-title {
  color: #a855f7;
  text-shadow: 0 2px 16px rgba(168, 85, 247, 0.5);
}

.stats-section-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.stats-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 32px;
  margin-bottom: 40px;
}

.chart-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.4s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.chart-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.25);
}

.chart-card h3 {
  color: #3b82f6;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  min-width: 140px;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.bar-container {
  flex: 1;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 8px;
  transition: width 0.8s ease;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
}

.bar-value {
  min-width: 40px;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 800;
  color: #3b82f6;
}

.type-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-stat-item {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 2px solid rgba(59, 130, 246, 0.25);
  border-radius: 14px;
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.type-stat-item:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateX(8px);
}

.type-stat-item strong {
  color: #3b82f6;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
}

.type-count {
  background: rgba(59, 130, 246, 0.2);
  border: 2px solid rgba(59, 130, 246, 0.4);
  color: #3b82f6;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 1.2rem;
  font-weight: 900;
  min-width: 50px;
  text-align: center;
}

.avis-stats-section {
  margin-top: 40px;
}

.avis-section-title {
  color: #3b82f6;
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.avis-section-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 32px 0;
}

.avis-stats-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 32px;
  margin-top: 24px;
}

.avis-prestataires-list {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 24px;
  max-height: 800px;
  overflow-y: auto;
}

.list-title {
  color: #3b82f6;
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 20px 0;
  text-transform: uppercase;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
}

.prestataire-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prestataire-stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.4s ease;
}

.prestataire-stat-card:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateX(8px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.prestataire-stat-card.selected {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h4 {
  color: #3b82f6;
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
}

.badge-avis {
  background: rgba(59, 130, 246, 0.2);
  border: 2px solid rgba(59, 130, 246, 0.4);
  color: #3b82f6;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 800;
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
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.rating-value.no-rating {
  color: rgba(255, 255, 255, 0.4);
  background: none;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.4);
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
  color: #3b82f6;
  filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.6));
}

.card-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.last-comment-label {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.last-comment-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  font-style: italic;
  margin: 0;
}

.no-comment-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  font-style: italic;
  margin: 0;
  text-align: center;
}

.avis-detail-panel {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 32px;
  min-height: 400px;
}

.avis-detail-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
}

.detail-header h3 {
  color: #3b82f6;
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0;
  text-transform: uppercase;
}

.btn-close-detail {
  background: rgba(255, 59, 48, 0.15);
  border: 2px solid rgba(255, 59, 48, 0.4);
  color: #ff3b30;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-detail:hover {
  background: rgba(255, 59, 48, 0.25);
  transform: rotate(90deg);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.detail-score-section {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
}

.detail-score-value {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 8px;
}

.detail-score-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-score-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 16px 0;
}

.star-detail {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.2);
}

.star-detail.filled {
  color: #3b82f6;
  filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.8));
}

.detail-score-meta {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  font-weight: 600;
}

.detail-distribution {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 28px;
}

.detail-distribution h4 {
  color: #3b82f6;
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 20px 0;
  text-transform: uppercase;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.distribution-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.distribution-star-label {
  min-width: 40px;
  font-size: 0.95rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.distribution-bar-bg {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.distribution-bar-fg {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 7px;
  transition: width 0.8s ease;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
}

.distribution-count-label {
  min-width: 40px;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 800;
  color: #3b82f6;
}

.detail-info-box {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%);
  border: 2px solid rgba(59, 130, 246, 0.25);
  border-radius: 14px;
  padding: 20px;
}

.detail-info-box p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin: 0;
}

.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 5rem;
  display: block;
  margin-bottom: 20px;
  opacity: 0.3;
}

.empty-state h3 {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.4rem;
  margin: 0 0 12px 0;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
  margin: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .festival-rating-overview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .prest-grid {
    grid-template-columns: 1fr;
  }

  .stats-charts {
    grid-template-columns: 1fr;
  }

  .avis-stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Festival avis */
.festival-avis-stats {
  margin-top: 40px;
}

.festival-subsection-title {
  color: #a855f7;
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 28px 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.festival-rating-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 40px;
}

.festival-rating-card-main {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 2px solid rgba(168, 85, 247, 0.3);
  border-radius: 20px;
  padding: 40px;
  display: flex;
  gap: 32px;
  align-items: center;
  box-shadow: 0 8px 32px rgba(168, 85, 247, 0.25);
}

.festival-rating-icon-wrapper {
  flex-shrink: 0;
}

.festival-rating-icon-large {
  font-size: 5rem;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(168, 85, 247, 0.15));
  border-radius: 24px;
  border: 3px solid rgba(168, 85, 247, 0.4);
  filter: drop-shadow(0 8px 24px rgba(168, 85, 247, 0.5));
}

.festival-rating-details {
  flex: 1;
  text-align: center;
}

.festival-rating-score-huge {
  font-size: 4.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 16px;
}

.festival-rating-stars-large {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.star-huge {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.2);
}

.star-huge.filled {
  color: #a855f7;
  filter: drop-shadow(0 2px 12px rgba(168, 85, 247, 0.9));
}

.festival-rating-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.festival-rating-count {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  font-weight: 700;
}

.festival-rating-distribution-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 32px;
}

.festival-rating-distribution-card h4 {
  color: #a855f7;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
}

.festival-distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.festival-distribution-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.festival-dist-label {
  min-width: 40px;
  font-size: 0.95rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.festival-dist-bar-bg {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.festival-dist-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #a855f7 0%, #c084fc 100%);
  border-radius: 7px;
  transition: width 0.8s ease;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.6);
}

.festival-dist-count {
  min-width: 40px;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 800;
  color: #a855f7;
}

.festival-dist-percent {
  min-width: 50px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

.festival-comments-section {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 32px;
}

.comments-title {
  color: #a855f7;
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

.comment-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(168, 85, 247, 0.04) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.comment-card:hover {
  border-color: rgba(168, 85, 247, 0.4);
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(168, 85, 247, 0.25);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-icon {
  font-size: 1.5rem;
}

.comment-author strong {
  color: #a855f7;
  font-size: 1.1rem;
  font-weight: 800;
}

.comment-rating {
  display: flex;
  gap: 4px;
}

.comment-star {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.2);
}

.comment-star.filled {
  color: #a855f7;
  filter: drop-shadow(0 2px 6px rgba(168, 85, 247, 0.7));
}

.comment-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.7;
  margin-bottom: 12px;
}

.comment-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: right;
}

.no-comments {
  text-align: center;
  padding: 60px 20px;
}

.no-comments-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
  opacity: 0.3;
}

.no-comments p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  font-style: italic;
  margin: 0;
}

/* ================================================ */
/* CARTE INTERACTIVE - STYLES COMPLETS */
/* ================================================ */

.carte-config-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.carte-intro-card {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.12) 0%, rgba(252, 220, 30, 0.06) 100%);
  border: 2px solid rgba(252, 220, 30, 0.3);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 28px;
  box-shadow: 0 8px 32px rgba(252, 220, 30, 0.15);
  transition: all 0.4s ease;
}

.carte-intro-card:hover {
  box-shadow: 0 12px 48px rgba(252, 220, 30, 0.25);
  transform: translateY(-4px);
}

.carte-intro-icon {
  font-size: 4rem;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 20px;
  border: 3px solid rgba(252, 220, 30, 0.4);
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(252, 220, 30, 0.3);
}

.carte-intro-content h3 {
  color: #FCDC1E;
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.carte-intro-content p {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  font-size: 1rem;
  margin: 0;
}

.carte-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.carte-stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(252, 220, 30, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 24px;
  transition: all 0.4s ease;
}

.carte-stat-card:hover {
  transform: translateY(-6px);
  border-color: rgba(252, 220, 30, 0.4);
  box-shadow: 0 12px 40px rgba(252, 220, 30, 0.25);
}

.carte-stat-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 16px;
  border: 2px solid rgba(252, 220, 30, 0.35);
  flex-shrink: 0;
}

.carte-stat-info {
  flex: 1;
}

.carte-stat-value {
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 8px;
}

.carte-stat-label {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 700;
  text-transform: uppercase;
}

.carte-prestataires-container {
  background: rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
}

.carte-section-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(252, 220, 30, 0.3);
}

.carte-header-icon {
  font-size: 3rem;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 16px;
  border: 2px solid rgba(252, 220, 30, 0.4);
}

.carte-header-content {
  flex: 1;
}

.carte-section-title {
  color: #FCDC1E;
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  text-transform: uppercase;
}

.carte-section-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin: 0;
}

.carte-prestataires-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 28px;
}

.carte-prestataire-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(252, 220, 30, 0.04) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  overflow: hidden;
  transition: all 0.4s ease;
}

.carte-prestataire-card:hover {
  border-color: rgba(252, 220, 30, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(252, 220, 30, 0.25);
}

.carte-card-header {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.carte-card-image-wrapper {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.carte-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.carte-card-info {
  flex: 1;
}

.carte-card-name {
  color: #FCDC1E;
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.carte-card-type {
  display: inline-block;
  background: rgba(252, 220, 30, 0.15);
  border: 2px solid rgba(252, 220, 30, 0.35);
  color: #FCDC1E;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.carte-card-body {
  padding: 24px;
}

.carte-location-selector {
  margin-bottom: 16px;
}

.carte-location-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FCDC1E;
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.carte-label-icon {
  font-size: 1.2rem;
}

.carte-location-select {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.carte-location-select:focus {
  outline: none;
  border-color: rgba(252, 220, 30, 0.5);
}

.carte-card-meta {
  display: flex;
  gap: 12px;
}

.carte-meta-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(252, 220, 30, 0.1);
  border: 1px solid rgba(252, 220, 30, 0.3);
  padding: 8px 14px;
  border-radius: 8px;
}

.carte-badge-icon {
  font-size: 1.1rem;
}

.carte-badge-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
  font-weight: 700;
}

.carte-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 32px;
}

.carte-btn-save,
.carte-btn-preview {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  border: none;
  color: #0a0a0a;
  padding: 14px 32px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(252, 220, 30, 0.3);
}

.carte-btn-save:hover,
.carte-btn-preview:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(252, 220, 30, 0.5);
}

.carte-btn-icon {
  font-size: 1.2rem;
}

/* ================================================ */
/* PROGRAMMATION - STYLES COMPLETS */
/* ================================================ */

.prog-config-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.prog-intro-card {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%);
  border: 2px solid rgba(168, 85, 247, 0.3);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 28px;
  box-shadow: 0 8px 32px rgba(168, 85, 247, 0.15);
  transition: all 0.4s ease;
}

.prog-intro-card:hover {
  box-shadow: 0 12px 48px rgba(168, 85, 247, 0.25);
  transform: translateY(-4px);
}

.prog-intro-icon {
  font-size: 4rem;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(168, 85, 247, 0.15));
  border-radius: 20px;
  border: 3px solid rgba(168, 85, 247, 0.4);
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.3);
}

.prog-intro-content h3 {
  color: #a855f7;
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.prog-intro-content p {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  font-size: 1rem;
  margin: 0;
}

.prog-controls-card {
  background: rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 32px;
  margin-bottom: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.prog-control-group {
  display: flex;
  flex-direction: column;
}

.prog-control-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #a855f7;
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.prog-label-icon {
  font-size: 1.3rem;
}

.prog-select {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.prog-select:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.5);
}

.prog-slots-container {
  background: rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
}

.prog-slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(168, 85, 247, 0.3);
}

.prog-slots-title-wrapper {
  flex: 1;
}

.prog-slots-title {
  color: #a855f7;
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 8px 0;
  text-transform: uppercase;
}

.prog-slots-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin: 0;
}

.btn-prog-add {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3);
}

.btn-prog-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(168, 85, 247, 0.4);
}

.btn-prog-icon {
  font-size: 1.2rem;
}

.prog-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.prog-slot-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(168, 85, 247, 0.04) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.prog-slot-card:hover {
  border-color: rgba(168, 85, 247, 0.4);
}

.prog-slot-editing {
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow: 0 8px 32px rgba(168, 85, 247, 0.3);
}

.prog-slot-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prog-editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(168, 85, 247, 0.3);
}

.prog-editor-icon {
  font-size: 1.5rem;
}

.prog-editor-header h4 {
  color: #a855f7;
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
}

.prog-slot-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prog-slot-badge {
  background: rgba(168, 85, 247, 0.15);
  border: 2px solid rgba(168, 85, 247, 0.3);
  color: #a855f7;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
}

.prog-badge-icon {
  font-size: 1rem;
}

.prog-slot-info {
  flex: 1;
}

.prog-artist-name {
  color: #a855f7;
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  text-transform: uppercase;
}

.prog-slot-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.prog-time-badge,
.prog-style-badge {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.25);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.prog-time-icon,
.prog-style-icon {
  font-size: 1rem;
}

.prog-slot-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-prog-edit,
.btn-prog-delete {
  flex: 1;
  background: rgba(168, 85, 247, 0.15);
  border: 2px solid rgba(168, 85, 247, 0.4);
  color: #a855f7;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-prog-delete {
  background: rgba(255, 59, 48, 0.15);
  border-color: rgba(255, 59, 48, 0.4);
  color: #ff3b30;
}

.btn-prog-edit:hover,
.btn-prog-delete:hover {
  transform: translateY(-2px);
}

.btn-action-icon {
  font-size: 1.1rem;
}

.prog-form-group {
  margin-bottom: 20px;
}

.prog-form-label {
  display: block;
  color: #a855f7;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.prog-form-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.prog-form-input:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.5);
}

.prog-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.prog-editor-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-prog-save,
.btn-prog-cancel {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-prog-save {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  border: none;
  color: white;
}

.btn-prog-cancel {
  background: rgba(255, 59, 48, 0.15);
  border: 2px solid rgba(255, 59, 48, 0.4);
  color: #ff3b30;
}

.prog-empty-state {
  text-align: center;
  padding: 80px 20px;
}

.prog-empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.3;
}

.prog-empty-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.4rem;
  margin-bottom: 12px;
}

.prog-empty-text {
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
}

.btn-prog-add-first {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  border: none;
  color: white;
  padding: 14px 32px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.prog-global-actions {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.btn-prog-save-all {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  border: none;
  color: white;
  padding: 16px 40px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.4s ease;
  box-shadow: 0 6px 28px rgba(168, 85, 247, 0.4);
}

.btn-prog-save-all:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(168, 85, 247, 0.6);
}

/* ================================================ */
/* PRÉSENTATION FESTIVAL - STYLES COMPLETS */
/* ================================================ */

.pres-config-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.pres-intro-card {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.12) 0%, rgba(252, 220, 30, 0.06) 100%);
  border: 2px solid rgba(252, 220, 30, 0.3);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 28px;
  box-shadow: 0 8px 32px rgba(252, 220, 30, 0.15);
  transition: all 0.4s ease;
}

.pres-intro-icon {
  font-size: 4rem;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 20px;
  border: 3px solid rgba(252, 220, 30, 0.4);
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(252, 220, 30, 0.3);
}

.pres-intro-content h3 {
  color: #FCDC1E;
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.pres-intro-content p {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  font-size: 1rem;
  margin: 0;
}

.pres-btn-reset {
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.15), rgba(255, 59, 48, 0.08));
  border: 2px solid rgba(255, 59, 48, 0.4);
  color: #ff3b30;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 800;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pres-tabs-container {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(252, 220, 30, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 32px;
}

.pres-tabs-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.pres-tab-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(252, 220, 30, 0.04) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  padding: 14px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.pres-tab-btn.pres-tab-active {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.2) 0%, rgba(252, 220, 30, 0.1) 100%);
  border-color: rgba(252, 220, 30, 0.6);
  color: #FCDC1E;
}

.pres-tab-icon {
  font-size: 1.3rem;
}

.pres-editor-container {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.25) 0%, rgba(252, 220, 30, 0.03) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
}

.pres-section-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(252, 220, 30, 0.03) 100%);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  overflow: hidden;
}

.pres-section-header {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.15) 0%, rgba(252, 220, 30, 0.08) 100%);
  border-bottom: 2px solid rgba(252, 220, 30, 0.3);
  padding: 28px 32px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.pres-section-icon {
  font-size: 3rem;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 16px;
  border: 2px solid rgba(252, 220, 30, 0.4);
}

.pres-section-title-wrapper {
  flex: 1;
}

.pres-section-title {
  color: #FCDC1E;
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  text-transform: uppercase;
}

.pres-section-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin: 0;
}

.pres-section-body {
  padding: 32px;
}

.pres-form-group {
  margin-bottom: 28px;
}

.pres-form-label {
  display: block;
  color: #FCDC1E;
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.pres-form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.pres-card-editor {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(252, 220, 30, 0.03) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
}

.pres-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.pres-card-badge {
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.3), rgba(252, 220, 30, 0.2));
  border: 2px solid rgba(252, 220, 30, 0.5);
  color: #FCDC1E;
  padding: 6px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
}

.pres-card-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.pres-actions {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
}

.pres-btn-save {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  border: none;
  color: #0a0a0a;
  padding: 16px 40px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  transition: all 0.4s ease;
  box-shadow: 0 6px 28px rgba(252, 220, 30, 0.4);
  display: flex;
  align-items: center;
  gap: 12px;
}

.pres-btn-save:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(252, 220, 30, 0.6);
}

.pres-btn-icon {
  font-size: 1.4rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .dash-rating-overview-card {
    flex-direction: column;
  }

  .dash-rating-left {
    min-width: auto;
    width: 100%;
    justify-content: center;
  }

  .avis-stats-grid {
    grid-template-columns: 1fr;
  }

  .festival-rating-overview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-sidebar {
    display: none;
  }

  .admin-main {
    padding: 20px;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .dash-stats-grid {
    grid-template-columns: 1fr;
  }

  .dash-rating-left {
    flex-direction: column;
    text-align: center;
  }

  .dash-rating-overview-card {
    padding: 24px;
  }

  .stats-charts {
    grid-template-columns: 1fr;
  }

  .prest-grid {
    grid-template-columns: 1fr;
  }

  .carte-prestataires-grid {
    grid-template-columns: 1fr;
  }

  .prog-slots-grid {
    grid-template-columns: 1fr;
  }

  .prog-controls-card {
    grid-template-columns: 1fr;
  }

  .user-editor {
    padding: 24px;
  }
}
</style>
