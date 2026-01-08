<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import WysiwygEditor from '@/components/WysiwygEditor.vue'

// AJOUT: Référence pour le canvas Chart.js
const chartCanvas = ref(null)
let chartInstance = null

const router = useRouter()
const authUser = ref(null)
const loading = ref(true)
const currentSection = ref('dashboard')
const prestataires = ref([])
const prestatairesOriginaux = ref([])
const customPrestataires = ref({})
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

// AJOUT: Données pour la carte
const mapContainer = ref(null)
const mapInstance = ref(null)
const mapLoaded = ref(false)
const zones = ref([])
const emplacementsForMap = ref([])

// MODIFICATION: Données pour les demandes d'emplacements
const demandesEmplacement = ref([])
const emplacementsAttribues = ref({})

const demandesEnAttente = computed(() => {
  return demandesEmplacement.value.filter(d => d.statut === 'en_attente')
})

const historiqueDemandes = computed(() => {
  return demandesEmplacement.value
    .filter(d => d.statut === 'acceptee' || d.statut === 'refusee')
    .sort((a, b) => new Date(b.dateTraitement || 0) - new Date(a.dateTraitement || 0))
})

// AJOUT: Fonction pour charger les demandes
const loadDemandesEmplacement = () => {
  try {
    const demandesRaw = localStorage.getItem('demandesEmplacement')
    demandesEmplacement.value = demandesRaw ? JSON.parse(demandesRaw) : []
  } catch (e) {
    console.error('Erreur chargement demandes', e)
    demandesEmplacement.value = []
  }
}

// AJOUT: Fonction pour charger les emplacements attribués
const loadEmplacementsAttribues = () => {
  try {
    const emplacementsRaw = localStorage.getItem('emplacementsAttribues')
    emplacementsAttribues.value = emplacementsRaw ? JSON.parse(emplacementsRaw) : {}
  } catch (e) {
    console.error('Erreur chargement emplacements', e)
    emplacementsAttribues.value = {}
  }
}

// AJOUT: Accepter une demande (fonctionnel) - UNE SEULE VERSION
const accepterDemande = (demande) => {
  if (!confirm(`Accepter la demande de ${demande.prestataireNom} pour l'emplacement ${demande.coordonnees} ?`)) return

  try {
    const emplacementsRaw = localStorage.getItem('emplacementsAttribues')
    let emplacements = emplacementsRaw ? JSON.parse(emplacementsRaw) : {}

    const prestataireOccupant = Object.entries(emplacements).find(([, coords]) => coords === demande.coordonnees)
    if (prestataireOccupant && prestataireOccupant[0] !== demande.prestataireNom) {
      alert(`❌ Cet emplacement est déjà occupé par ${prestataireOccupant[0]}`)
      return
    }

    if (emplacements[demande.prestataireNom]) {
      delete emplacements[demande.prestataireNom]
    }

    emplacements[demande.prestataireNom] = demande.coordonnees
    localStorage.setItem('emplacementsAttribues', JSON.stringify(emplacements))

    const demandesRaw = localStorage.getItem('demandesEmplacement')
    let demandes = demandesRaw ? JSON.parse(demandesRaw) : []

    const index = demandes.findIndex(d => d.id === demande.id)
    if (index !== -1) {
      demandes[index].statut = 'acceptee'
      demandes[index].dateTraitement = new Date().toISOString()
    }

    localStorage.setItem('demandesEmplacement', JSON.stringify(demandes))

    loadDemandesEmplacement()
    loadEmplacementsAttribues()

    window.dispatchEvent(new Event('emplacements-updated'))
    window.dispatchEvent(new Event('demandes-updated'))

    // AJOUT: Rafraîchir la carte
    if (mapInstance.value) {
      updateAdminMapMarkers()
    }

    alert(`✅ Demande acceptée !\n\nL'emplacement ${demande.coordonnees} a été attribué à ${demande.prestataireNom}.`)
  } catch (e) {
    console.error('Erreur acceptation demande', e)
    alert('❌ Erreur lors de l\'acceptation de la demande')
  }
}

// AJOUT: Refuser une demande (fonctionnel) - UNE SEULE VERSION
const refuserDemande = (demande) => {
  const raison = prompt(`Raison du refus de la demande de ${demande.prestataireNom} :`)
  if (raison === null) return

  try {
    const demandesRaw = localStorage.getItem('demandesEmplacement')
    let demandes = demandesRaw ? JSON.parse(demandesRaw) : []

    const index = demandes.findIndex(d => d.id === demande.id)
    if (index !== -1) {
      demandes[index].statut = 'refusee'
      demandes[index].raison = raison
      demandes[index].dateTraitement = new Date().toISOString()
    }

    localStorage.setItem('demandesEmplacement', JSON.stringify(demandes))

    loadDemandesEmplacement()

    window.dispatchEvent(new Event('demandes-updated'))

    alert(`✅ Demande refusée.\n\nRaison : ${raison}`)
  } catch (e) {
    console.error('Erreur refus demande', e)
    alert('❌ Erreur lors du refus de la demande')
  }
}

// AJOUT: Assigner directement un emplacement (fonctionnel) - UNE SEULE VERSION
const assignerEmplacement = (prestataireNom, coords) => {
  if (!confirm(`Assigner l'emplacement ${coords} à ${prestataireNom} ?`)) return

  try {
    const emplacementsRaw = localStorage.getItem('emplacementsAttribues')
    let emplacements = emplacementsRaw ? JSON.parse(emplacementsRaw) : {}

    const prestataireOccupant = Object.entries(emplacements).find(([, c]) => c === coords)
    if (prestataireOccupant && prestataireOccupant[0] !== prestataireNom) {
      alert(`❌ Cet emplacement est déjà occupé par ${prestataireOccupant[0]}`)
      return
    }

    if (emplacements[prestataireNom]) {
      delete emplacements[prestataireNom]
    }

    emplacements[prestataireNom] = coords
    localStorage.setItem('emplacementsAttribues', JSON.stringify(emplacements))

    loadEmplacementsAttribues()

    window.dispatchEvent(new Event('emplacements-updated'))

    alert(`✅ Emplacement assigné !\n\n${coords} a été attribué à ${prestataireNom}.`)
  } catch (e) {
    console.error('Erreur assignation emplacement', e)
    alert('❌ Erreur lors de l\'assignation')
  }
}

// AJOUT: Libérer un emplacement (fonctionnel) - UNE SEULE VERSION
const libererEmplacementAdmin = (prestataireNom) => {
  if (!confirm(`Libérer l'emplacement de ${prestataireNom} ?`)) return

  try {
    const emplacementsRaw = localStorage.getItem('emplacementsAttribues')
    let emplacements = emplacementsRaw ? JSON.parse(emplacementsRaw) : {}

    const coords = emplacements[prestataireNom]
    if (!coords) {
      alert('❌ Ce prestataire n\'a pas d\'emplacement attribué')
      return
    }

    delete emplacements[prestataireNom]
    localStorage.setItem('emplacementsAttribues', JSON.stringify(emplacements))

    loadEmplacementsAttribues()

    window.dispatchEvent(new Event('emplacements-updated'))

    alert(`✅ Emplacement libéré !\n\nL'emplacement ${coords} de ${prestataireNom} a été libéré.`)
  } catch (e) {
    console.error('Erreur libération emplacement', e)
    alert('❌ Erreur lors de la libération')
  }
}

// AJOUT: Helper pour obtenir l'emplacement d'un prestataire
const getEmplacementPrestataire = (nomPrestataire) => {
  return emplacementsAttribues.value[nomPrestataire] || null
}

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
// Structure par défaut pour les deux langues
const defaultPresentationFR = {
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
}

const defaultPresentationEN = {
  // Hero
  titre: 'GOLDEN COAST FESTIVAL V3',
  date: 'August 28 - 29 - 30, 2026',
  lieu: 'CORCELLES-LES-MONTS • DIJON',

  // Section About (les 3 cards)
  aboutCard1Titre: '100% FRENCH RAP',
  aboutCard1Texte: 'The biggest festival entirely dedicated to <strong>French rap</strong> with the biggest headliners and emerging talents.',
  aboutCard2Titre: 'NATURAL SITE',
  aboutCard2Texte: 'An exceptional setting at <strong>Combe à la Serpent</strong>, offering a unique experience in the heart of nature near Dijon.',
  aboutCard3Titre: '52,000 FESTIVAL-GOERS',
  aboutCard3Texte: 'A successful first edition that returns even stronger for <strong>three days of urban culture</strong>.',

  // Section Description 1
  desc1Titre: 'The meeting place for rap fans',
  desc1Texte: 'Dive into the Golden Coast Festival experience, the French rap event that transforms the end of summer into an exceptional moment.<br/><br/>In a carefully scenographed setting, you discover exclusive performances, trap & boom bap sound of studio quality, and immersive stages designed to enhance each artist.',
  desc1Chip1: 'The biggest stars of French rap',
  desc1Chip2: 'Drinks & street food',

  // Section Description 2
  desc2Titre: 'Total immersion',
  desc2Texte: 'Between high-intensity light shows, lifestyle spaces, sharp vintage selections, and signature street food, every detail is designed to offer a smooth, refined and memorable experience.<br/><br/>The exclusive afters, reserved for those who want to prolong the moment, add a rare and privileged touch. Golden Coast Festival is more than a meeting: it\'s the premium event where rap culture is lived intensely, in an exclusive, creative and truly unforgettable atmosphere.',

  // Section CTA
  ctaTitre: 'READY TO LIVE THE EXPERIENCE?',
  ctaTexte: 'Book your tickets now and join us for three unforgettable days!',
  ctaBouton: 'BOOK MY SPOT',

  // Section Map
  mapTitre: 'LOCATION',
  mapIntro: 'Find all the festival points of interest: stages, parking lots, campsites and more.'
}

// Structure bilingue de festivalPresentation
const festivalPresentation = ref({
  fr: { ...defaultPresentationFR },
  en: { ...defaultPresentationEN }
})

// Langue d'édition actuelle
const editingLang = ref('fr')

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

    // AJOUT: Charger les zones pour la carte
    zones.value = prestataireData.zones || []
    emplacementsForMap.value = prestataireData.emplacements || []

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

    // Charger présentation depuis site.json (BDD)
    try {
      const siteResp = await fetch('/data/site.json', { cache: 'no-store' })
      if (siteResp.ok) {
        const siteData = await siteResp.json()
        if (siteData.festival && siteData.festival.presentation) {
          // Charger depuis site.json
          festivalPresentation.value = siteData.festival.presentation
        } else {
          // Si pas de présentation dans site.json, utiliser les valeurs par défaut
          festivalPresentation.value = {
            fr: { ...defaultPresentationFR },
            en: { ...defaultPresentationEN }
          }
        }
      } else {
        // En cas d'erreur, utiliser les valeurs par défaut
        festivalPresentation.value = {
          fr: { ...defaultPresentationFR },
          en: { ...defaultPresentationEN }
        }
      }
    } catch (e) {
      console.error('Erreur chargement présentation depuis site.json:', e)
      // En cas d'erreur, utiliser les valeurs par défaut
      festivalPresentation.value = {
        fr: { ...defaultPresentationFR },
        en: { ...defaultPresentationEN }
      }
    }

    // Charger la programmation
    await loadProgrammation()

    // Calculer les stats d'avis
    await computeAvisStatsForPrestataires()

    // AJOUT: Charger les demandes et emplacements
    loadDemandesEmplacement()
    loadEmplacementsAttribues()
  } catch (e) {
    console.error('Erreur chargement données:', e)
  } finally {
    loading.value = false
  }
}

// GARDER CETTE VERSION UNIQUEMENT
const loadEmplacements = async () => {
  try {
    const resp = await fetch('/data/site.json', { cache: 'no-store' })
    if (resp.ok) {
      const data = await resp.json()
      emplacements.value = data.emplacements || []
    }
  } catch (e) {
    console.error('Erreur chargement emplacements', e)
    emplacements.value = []
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

const savePresentation = async () => {
  // Sauvegarder dans localStorage (cache local)
  localStorage.setItem('festivalPresentation', JSON.stringify(festivalPresentation.value))
  
  // TODO: Sauvegarder dans la BDD via API
  // Pour l'instant, on simule en mettant à jour site.json
  // En production, cela sera fait via une API PUT /api/festival/presentation
  try {
    // Charger site.json actuel
    const siteResp = await fetch('/data/site.json', { cache: 'no-store' })
    if (siteResp.ok) {
      const siteData = await siteResp.json()
      // Mettre à jour la présentation
      if (!siteData.festival) {
        siteData.festival = {}
      }
      siteData.festival.presentation = festivalPresentation.value
      
      // Note: En production, on ferait un PUT vers l'API
      // await fetch('/api/festival/presentation', { method: 'PUT', body: JSON.stringify(festivalPresentation.value) })
      // Pour l'instant, on garde juste localStorage comme cache
      console.log('Présentation mise à jour (sera sauvegardée dans la BDD via API)')
    }
  } catch (e) {
    console.error('Erreur lors de la sauvegarde de la présentation:', e)
  }
  
  window.dispatchEvent(new Event('festival-presentation-updated'))
  alert('Présentation sauvegardée avec succès!')
}

const resetPresentation = async () => {
  if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les textes aux valeurs par défaut ?')) {
    return
  }

  festivalPresentation.value = {
    fr: { ...defaultPresentationFR },
    en: { ...defaultPresentationEN }
  }

  // Sauvegarder la réinitialisation
  localStorage.setItem('festivalPresentation', JSON.stringify(festivalPresentation.value))
  
  // TODO: Sauvegarder dans la BDD via API
  // await fetch('/api/festival/presentation', { method: 'PUT', body: JSON.stringify(festivalPresentation.value) })
  
  window.dispatchEvent(new Event('festival-presentation-updated'))
  alert('Textes réinitialisés aux valeurs par défaut!')
}

// Computed pour accéder facilement aux données selon la langue d'édition
const currentPresentation = computed({
  get: () => {
    // S'assurer que la structure existe
    if (!festivalPresentation.value[editingLang.value]) {
      festivalPresentation.value[editingLang.value] = editingLang.value === 'fr' 
        ? { ...defaultPresentationFR }
        : { ...defaultPresentationEN }
    }
    return festivalPresentation.value[editingLang.value]
  },
  set: (value) => {
    festivalPresentation.value[editingLang.value] = { ...value }
  }
})

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

    // MODIFICATION: Attendre que le DOM soit mis à jour avant de créer le graphique
    await nextTick()
    if (currentSection.value === 'statistiques' && chartCanvas.value && avisStatsParPrestataire.value.length > 0) {
      createBarChart()
    }
  } catch (e) {
    console.error('Erreur calcul stats avis prestataires', e)
    avisStatsParPrestataire.value = []
  }
}

const selectPrestataireStats = (item) => {
  selectedPrestataireStats.value = item
}

// SUPPRIMER LES DÉCLARATIONS EN DOUBLE ICI (lignes 929-1004)
// Les fonctions accepterDemande, refuserDemande, assignerEmplacement, libererEmplacementAdmin
// sont déjà déclarées plus haut dans le fichier

// AJOUT: Fonctions pour la carte
const initAdminMap = async () => {
  if (typeof window === 'undefined' || !mapContainer.value) return

  const ver = '1.9.4'
  const cssHref = `https://unpkg.com/leaflet@${ver}/dist/leaflet.css`
  const jsSrc = `https://unpkg.com/leaflet@${ver}/dist/leaflet.js`

  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssHref
    document.head.appendChild(link)
  }

  const loadLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L)
    const existing = document.querySelector(`script[src="${jsSrc}"]`)
    if (existing) {
      const wait = () => (window.L ? resolve(window.L) : setTimeout(wait, 50))
      return wait()
    }
    const script = document.createElement('script')
    script.src = jsSrc
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.head.appendChild(script)
  })

  try {
    const L = await loadLeaflet()

    if (mapInstance.value) {
      mapInstance.value.remove()
    }

    const map = L.map(mapContainer.value, {
      center: [47.304164, 4.965223],
      zoom: 16.4,
      minZoom: 16.4,
      maxZoom: 19,
      zoomControl: true,
      scrollWheelZoom: true,
      maxBoundsViscosity: 1.0
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    const initialBounds = map.getBounds()
    map.setMaxBounds(initialBounds)

    mapInstance.value = map
    mapLoaded.value = true

    updateAdminMapMarkers()
    initAdminZones()
  } catch (e) {
    console.error('Erreur chargement carte:', e)
  }
}

const updateAdminMapMarkers = () => {
  if (!mapInstance.value || !window.L) return

  const L = window.L
  const map = mapInstance.value

  map.eachLayer((layer) => {
    if (layer instanceof L.CircleMarker) {
      map.removeLayer(layer)
    }
  })

  // MODIFICATION: Charger les emplacements avec statut depuis localStorage
  let emplacementsAvecStatut = [...emplacementsForMap.value]

  try {
    const emplacementsRaw = localStorage.getItem('emplacementsAttribues')
    const emplacementsAttribues = emplacementsRaw ? JSON.parse(emplacementsRaw) : {}

    emplacementsAvecStatut = emplacementsAvecStatut.map(e => {
      const prestataireAttribue = Object.entries(emplacementsAttribues).find(
        ([, coords]) => coords === e.coordonnees
      )

      if (prestataireAttribue) {
        return {
          ...e,
          statut: 'pris',
          prestataireNom: prestataireAttribue[0]
        }
      }
      return e
    })
  } catch (e) {
    console.error('Erreur chargement emplacements attribués', e)
  }

  try {
    const demandesRaw = localStorage.getItem('demandesEmplacement')
    const demandes = demandesRaw ? JSON.parse(demandesRaw) : []

    emplacementsAvecStatut = emplacementsAvecStatut.map(e => {
      const demandePendante = demandes.find(
        d => d.coordonnees === e.coordonnees && d.statut === 'en_attente'
      )

      if (demandePendante && e.statut !== 'pris') {
        return {
          ...e,
          statut: 'en_attente',
          prestataireNom: demandePendante.prestataireNom
        }
      }
      return e
    })
  } catch (e) {
    console.error('Erreur chargement demandes', e)
  }

  emplacementsAvecStatut.forEach(emplacement => {
    const coords = emplacement.coordonnees
    const parts = coords.split(',').map(s => parseFloat(s.trim()))
    if (parts.length !== 2 || parts.some(isNaN)) return

    const [lat, lng] = parts

    let color = '#4caf50'
    let radius = 8
    let label = 'Disponible'

    if (emplacement.statut === 'pris') {
      color = '#FCDC1E'
      radius = 10
      label = `Occupé par ${emplacement.prestataireNom || 'Unknown'}`
    } else if (emplacement.statut === 'en_attente') {
      color = '#ff9800'
      radius = 9
      label = `En attente: ${emplacement.prestataireNom || 'Unknown'}`
    }

    const marker = L.circleMarker([lat, lng], {
      radius: radius,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map)

    // NOUVEAU: Créer un popup interactif avec sélecteur de prestataire
    let popupContent = `
      <div style="text-align: center; font-family: Arial, sans-serif; padding: 12px; min-width: 280px;">
        <strong style="color: ${color}; font-size: 16px; display: block; margin-bottom: 8px;">${label}</strong>
        <small style="color: #666; display: block; margin-bottom: 4px;">Emplacement #${emplacement.id}</small>
        <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 11px; display: block; margin-bottom: 12px;">${coords}</code>
    `

    if (emplacement.statut === 'pris') {
      // Emplacement occupé - bouton pour libérer
      popupContent += `
        <button
          onclick="window.libererEmplacementFromAdminMap('${emplacement.prestataireNom}')"
          style="
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 700;
            width: 100%;
            margin-top: 8px;
            transition: transform 0.2s ease;
          "
          onmouseover="this.style.transform='translateY(-2px)'"
          onmouseout="this.style.transform='translateY(0)'"
        >
          🗑️ Libérer l'emplacement
        </button>
      `
    } else if (emplacement.statut === 'libre') {
      // Emplacement disponible - sélecteur de prestataire
      const prestataireOptions = prestataires.value
        .map(p => `<option value="${p.nom}">${p.nom}</option>`)
        .join('')

      popupContent += `
        <div style="margin-top: 12px;">
          <label style="display: block; color: #333; font-weight: 600; margin-bottom: 8px; font-size: 13px; text-align: left;">
            👤 Assigner à un prestataire :
          </label>
          <select
            id="prestataire-select-${emplacement.id}"
            style="
              width: 100%;
              padding: 10px;
              border-radius: 6px;
              border: 2px solid #ddd;
              font-size: 14px;
              margin-bottom: 10px;
              background: white;
              cursor: pointer;
            "
          >
            <option value="">-- Sélectionner --</option>
            ${prestataireOptions}
          </select>
          <button
            onclick="window.assignerEmplacementFromAdminMap('${coords}', ${emplacement.id})"
            style="
              background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
              color: #0a0a0a;
              border: none;
              padding: 10px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 700;
              width: 100%;
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            ✅ Assigner l'emplacement
          </button>
        </div>
      `
    } else if (emplacement.statut === 'en_attente') {
      // Demande en attente - boutons accepter/refuser
      popupContent += `
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button
            onclick="window.accepterDemandeFromAdminMap('${coords}')"
            style="
              flex: 1;
              background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
              color: white;
              border: none;
              padding: 10px 12px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 700;
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            ✅ Accepter
          </button>
          <button
            onclick="window.refuserDemandeFromAdminMap('${coords}')"
            style="
              flex: 1;
              background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
              color: white;
              border: none;
              padding: 10px 12px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 700;
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            ❌ Refuser
          </button>
        </div>
      `
    }

    popupContent += `</div>`

    marker.bindPopup(popupContent, {
      maxWidth: 320,
      className: 'admin-map-popup'
    })
  })

  // Exposer les fonctions globales pour les popups
  window.assignerEmplacementFromAdminMap = (coords, emplacementId) => {
    const selectElement = document.getElementById(`prestataire-select-${emplacementId}`)
    if (!selectElement) return

    const prestataireNom = selectElement.value
    if (!prestataireNom) {
      alert('⚠️ Veuillez sélectionner un prestataire')
      return
    }

    assignerEmplacement(prestataireNom, coords)
    map.closePopup()
  }

  window.libererEmplacementFromAdminMap = (prestataireNom) => {
    libererEmplacementAdmin(prestataireNom)
    map.closePopup()
  }

  window.accepterDemandeFromAdminMap = (coords) => {
    try {
      const demandesRaw = localStorage.getItem('demandesEmplacement')
      const demandes = demandesRaw ? JSON.parse(demandesRaw) : []
      const demande = demandes.find(d => d.coordonnees === coords && d.statut === 'en_attente')

      if (demande) {
        accepterDemande(demande)
        map.closePopup()
      }
    } catch (e) {
      console.error('Erreur', e)
    }
  }

  window.refuserDemandeFromAdminMap = (coords) => {
    try {
      const demandesRaw = localStorage.getItem('demandesEmplacement')
      const demandes = demandesRaw ? JSON.parse(demandesRaw) : []
      const demande = demandes.find(d => d.coordonnees === coords && d.statut === 'en_attente')

      if (demande) {
        refuserDemande(demande)
        map.closePopup()
      }
    } catch (e) {
      console.error('Erreur', e)
    }
  }
}

const initAdminZones = () => {
  const L = window.L
  if (!L || !mapInstance.value) return

  zones.value.forEach(z => {
    if (!Array.isArray(z.coords) || z.coords.length < 3) return
    const latlngs = []
    for (const c of z.coords) {
      const parts = String(c).split(',').map(s => parseFloat(s.trim()))
      if (parts.length !== 2 || parts.some(isNaN)) return
      latlngs.push([parts[0], parts[1]])
    }

    let layer
    if (z.type === 'festival') {
      layer = L.polygon(latlngs, {
        color: '#FFD700',
        weight: 3,
        fillColor: 'transparent',
        fillOpacity: 0,
        interactive: false,
      })
    } else if (z.type === 'scène') {
      const sceneColors = {
        'MOTHERSHIP': '#FF1744',
        'ZERO GRAVITY': '#00E5FF',
        'CARGO': '#FF9800',
        'ANTDT CLUB': '#E91E63',
      }
      const color = sceneColors[z.nom] || '#9C27B0'
      layer = L.polygon(latlngs, {
        color: color,
        weight: 4,
        fillColor: color,
        fillOpacity: 0.4,
        opacity: 0.9,
      }).bindPopup(`🎵 ${z.nom}${z.sponsor ? ` (by ${z.sponsor})` : ''}`)
    } else {
      const colorMap = {
        'parking': '#0066FF',
        'camping': '#2ECC71',
        'VIP': '#9B59B6'
      }
      const color = colorMap[z.type] || '#888888'
      layer = L.polygon(latlngs, {
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.25,
      }).bindPopup(`${z.nom} (${z.type})`)
    }

    layer.addTo(mapInstance.value)
  })
}

// AJOUT: Fonction pour créer le graphique Chart.js
const createBarChart = async () => {
  if (!chartCanvas.value) {
    console.warn('Canvas non trouvé')
    return
  }

  // Charger Chart.js dynamiquement
  if (!window.Chart) {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js'
    script.onload = () => {
      console.log('Chart.js chargé')
      initChart()
    }
    script.onerror = () => {
      console.error('Erreur chargement Chart.js')
    }
    document.head.appendChild(script)
  } else {
    initChart()
  }
}

const initChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }

  if (!chartCanvas.value) {
    console.warn('Canvas non disponible pour initChart')
    return
  }

  const ctx = chartCanvas.value.getContext('2d')

  // Préparer les données
  const sortedStats = [...avisStatsParPrestataire.value]
    .filter(p => p.nbAvis > 0)
    .sort((a, b) => b.moyenne - a.moyenne)

  if (sortedStats.length === 0) {
    console.warn('Aucune donnée à afficher')
    return
  }

  console.log('Création du graphique avec', sortedStats.length, 'prestataires')

  const labels = sortedStats.map(p => p.nom)
  const data = sortedStats.map(p => p.moyenne)
  const backgroundColors = sortedStats.map(p => {
    if (p.moyenne >= 4.5) return 'rgba(34, 197, 94, 0.8)'
    if (p.moyenne >= 4) return 'rgba(252, 220, 30, 0.8)'
    if (p.moyenne >= 3) return 'rgba(255, 152, 0, 0.8)'
    return 'rgba(239, 68, 68, 0.8)'
  })

  chartInstance = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Note moyenne',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c.replace('0.8', '1')),
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 50
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#FCDC1E',
          bodyColor: '#e5e7eb',
          borderColor: 'rgba(252, 220, 30, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              const prestataire = sortedStats[context.dataIndex]
              return [
                `Note: ${context.parsed.y.toFixed(2)} / 5`,
                `Nombre d'avis: ${prestataire.nbAvis}`
              ]
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          ticks: {
            stepSize: 1,
            color: 'rgba(226, 232, 240, 0.8)',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: 'rgba(226, 232, 240, 0.8)',
            font: {
              size: 11,
              weight: '600'
            },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  })

  console.log('Graphique créé avec succès')
}

// AJOUT: Watcher pour recréer le graphique quand on change de section
watch(currentSection, async (newSection) => {
  if (newSection === 'statistiques') {
    await nextTick()
    if (chartCanvas.value && avisStatsParPrestataire.value.length > 0) {
      createBarChart()
    }
  }
})

onMounted(() => {
  loadAuthFromStorage()
  if (!isAdmin.value) {
    router.push('/login')
    return
  }

  loadData().then(async () => {
    await computeAvisStatsForPrestataires()

    // AJOUT: Si on est déjà sur la section statistiques, créer le graphique
    if (currentSection.value === 'statistiques') {
      await nextTick()
      if (chartCanvas.value && avisStatsParPrestataire.value.length > 0) {
        createBarChart()
      }
    }
  })

  // AJOUT: Écouter les mises à jour en temps réel
  window.addEventListener('demandes-updated', loadDemandesEmplacement)
  window.addEventListener('emplacements-updated', loadEmplacementsAttribues)
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
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
              <label style="font-weight: 600; color: #333;">Langue d'édition :</label>
              <div style="display: flex; gap: 0.5rem;">
                <button
                  @click="editingLang = 'fr'"
                  :class="['pres-lang-btn', { 'pres-lang-btn-active': editingLang === 'fr' }]"
                >
                  🇫🇷 Français
                </button>
                <button
                  @click="editingLang = 'en'"
                  :class="['pres-lang-btn', { 'pres-lang-btn-active': editingLang === 'en' }]"
                >
                  🇬🇧 English
                </button>
              </div>
            </div>
            <button @click="resetPresentation" class="pres-btn-reset-header">
              <span class="pres-btn-icon">🔄</span>
              <span class="pres-btn-text">Réinitialiser</span>
            </button>
          </div>

          <!-- AJOUT: wrapper avec class cohérente -->
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
            <button @click="savePresentation" class="pres-btn-save-main">
              <span class="pres-btn-icon">💾</span>
              <span class="pres-btn-text">Sauvegarder toutes les modifications</span>
              <span class="pres-btn-shine"></span>
            </button>
          </div>
        </div>

        <!-- Carte Interactive MODIFIÉE -->
        <div v-if="currentSection === 'carte'" class="section-content">
          <div class="section-header">
            <h1 class="section-title">Gestion de la carte et des emplacements</h1>
          </div>

          <div class="carte-config-wrapper">
            <div class="carte-intro-card">
              <div class="carte-intro-icon">🗺️</div>
              <div class="carte-intro-content">
                <h3>Gestion des emplacements</h3>
                <p>Gérez les demandes d'emplacements des prestataires en temps réel. Acceptez ou refusez leurs demandes, et assignez directement des emplacements si nécessaire.</p>
                <p class="success-info">✅ <strong>Système fonctionnel :</strong> Toutes les actions sont enregistrées et synchronisées instantanément !</p>
              </div>
            </div>

            <!-- AJOUT: Carte interactive -->
            <div class="carte-map-section">
              <div class="carte-map-header">
                <h2>📍 Carte interactive du festival</h2>
                <p>Vue d'ensemble de tous les emplacements et zones du festival</p>
                <button @click="initAdminMap" class="btn-refresh-map">
                  🔄 Rafraîchir la carte
                </button>
              </div>

              <div class="admin-carte-container">
                <div ref="mapContainer" class="admin-carte-map" id="admin-map"></div>

                <div class="admin-carte-legende">
                  <div class="legende-item">
                    <div class="legende-marker disponible"></div>
                    <span>Disponible</span>
                  </div>
                  <div class="legende-item">
                    <div class="legende-marker attribue"></div>
                    <span>Attribué</span>
                  </div>
                  <div class="legende-item">
                    <div class="legende-marker en-attente"></div>
                    <span>En attente</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Demandes en attente -->
            <div v-if="demandesEnAttente.length > 0" class="demandes-section">
              <div class="demandes-header">
                <h2 class="demandes-title">
                  🔔 Demandes en attente ({{ demandesEnAttente.length }})
                </h2>
              </div>

              <div class="demandes-grid">
                <div
                  v-for="demande in demandesEnAttente"
                  :key="demande.id"
                  class="demande-card"
                >
                  <div class="demande-card-header">
                    <div class="demande-icon">⏳</div>
                    <div class="demande-info">
                      <h3>{{ demande.prestataireNom }}</h3>
                      <p class="demande-coords">📌 {{ demande.coordonnees }}</p>
                      <p class="demande-date">📅 {{ new Date(demande.dateDemande).toLocaleString('fr-FR') }}</p>
                    </div>
                  </div>
                  <div class="demande-actions">
                    <button @click="accepterDemande(demande)" class="btn-accepter">
                      ✅ Accepter
                    </button>
                    <button @click="refuserDemande(demande)" class="btn-refuser">
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="no-demandes">
              <div class="no-demandes-icon">📭</div>
              <h3>Aucune demande en attente</h3>
              <p>Les nouvelles demandes d'emplacements apparaîtront ici.</p>
            </div>

            <!-- Historique -->
            <div v-if="historiqueDemandes.length > 0" class="historique-section">
              <h3 class="historique-title">📜 Historique des demandes</h3>
              <div class="historique-list">
                <div
                  v-for="demande in historiqueDemandes.slice(0, 10)"
                  :key="demande.id"
                  class="historique-item"
                  :class="{ acceptee: demande.statut === 'acceptee', refusee: demande.statut === 'refusee' }"
                >
                  <div class="historique-icon">
                    {{ demande.statut === 'acceptee' ? '✅' : '❌' }}
                  </div>
                  <div class="historique-details">
                    <strong>{{ demande.prestataireNom }}</strong>
                    <span class="historique-coords">{{ demande.coordonnees }}</span>
                    <span class="historique-status">{{ demande.statut === 'acceptee' ? 'Acceptée' : 'Refusée' }}</span>
                    <span v-if="demande.raison" class="historique-raison">Raison : {{ demande.raison }}</span>
                    <span class="historique-date">{{ new Date(demande.dateTraitement).toLocaleString('fr-FR') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Attribution manuelle MODIFIÉE -->
            <div class="attribution-section">
              <div class="attribution-header">
                <h2 class="attribution-title">📋 Vue d'ensemble des prestataires</h2>
                <p class="attribution-subtitle">Consultez et gérez les emplacements de tous les prestataires</p>
              </div>

              <div class="attribution-grid">
                <div
                  v-for="prestataire in prestataires"
                  :key="prestataire.nom"
                  class="attribution-card"
                  :class="{ 'has-emplacement': getEmplacementPrestataire(prestataire.nom) }"
                >
                  <div class="attribution-card-header">
                    <div class="attribution-card-image-wrapper">
                      <img
                        v-if="prestataire.image"
                        :src="prestataire.image"
                        :alt="prestataire.nom"
                        class="attribution-card-image"
                      />
                      <div v-else class="attribution-card-placeholder">
                        <span class="prest-placeholder-icon">🏢</span>
                      </div>
                    </div>
                    <div class="attribution-card-info">
                      <h4 class="attribution-card-name">{{ prestataire.nom }}</h4>
                      <span class="attribution-card-type">{{ prestataire.type }}</span>
                    </div>
                  </div>

                  <div class="attribution-card-body">
                    <!-- Emplacement actuel -->
                    <div v-if="getEmplacementPrestataire(prestataire.nom)" class="emplacement-actuel-display">
                      <div class="emplacement-status-header">
                        <span class="status-icon success">✅</span>
                        <span class="status-label">Emplacement attribué</span>
                      </div>
                      <div class="emplacement-coords-display">
                        <span class="coords-label">📍 Coordonnées :</span>
                        <code class="coords-value">{{ getEmplacementPrestataire(prestataire.nom) }}</code>
                      </div>
                      <button
                        @click="libererEmplacementAdmin(prestataire.nom)"
                        class="btn-liberer-full"
                      >
                        🗑️ Libérer l'emplacement
                      </button>
                    </div>

                    <!-- Pas d'emplacement -->
                    <div v-else class="emplacement-vide-display">
                      <div class="emplacement-status-header">
                        <span class="status-icon warning">⚠️</span>
                        <span class="status-label">Aucun emplacement</span>
                      </div>
                      <p class="emplacement-hint">
                        Cliquez sur un emplacement disponible sur la carte ci-dessus pour l'assigner à ce prestataire.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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

            <!-- MODIFICATION: Graphique Chart.js avec v-if pour s'assurer que les données sont chargées -->
            <div v-if="avisStatsParPrestataire.length > 0" class="chart-card-full">
              <h3>📊 Notes moyennes des prestataires</h3>
              <div class="chart-container">
                <canvas ref="chartCanvas" id="prestataireChart"></canvas>
              </div>
              <p class="chart-hint">
                💡 Ce graphique montre la note moyenne de chaque prestataire basée sur les avis des festivaliers.
                Les barres sont colorées selon la qualité: vert (≥4.5), jaune (≥4), orange (≥3), rouge (&lt;3).
              </p>
            </div>

            <div v-else class="chart-card-full">
              <h3>📊 Notes moyennes des prestataires</h3>
              <div class="chart-container" style="display: flex; align-items: center; justify-content: center;">
                <p style="color: rgba(226, 232, 240, 0.7); font-size: 1.1rem;">
                  ⏳ Chargement des données...
                </p>
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
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* ================================================ */
/* VARIABLES GLOBALES */
/* ================================================ */
:root {
  --bg-dark: rgba(15, 23, 42, 0.96);
  --bg-darker: rgba(15, 23, 42, 1);
  --border: rgba(148, 163, 184, 0.5);
  --border-light: rgba(148, 163, 184, 0.3);
  --text: #e5e7eb;
  --text-muted: rgba(148, 163, 184, 0.9);
  --yellow: #FCDC1E;
  --purple: #a855f7;
  --blue: #3b82f6;
  --green: #22c55e;
  --red: #ef4444;
  --orange: #ff9800;
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 28px rgba(15, 23, 42, 0.7);
  --shadow-lg: 0 12px 40px rgba(15, 23, 42, 0.9);
}

/* ================================================ */
/* BASE */
/* ================================================ */
* { box-sizing: border-box; }

.admin-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0b122a 0%, #07103a 100%);
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.loading, .access-denied {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 80px 20px;
}

.access-denied h2 {
  color: var(--yellow);
  margin-bottom: 16px;
  font-size: 2rem;
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
  background: rgba(0, 0, 0, 0.4);
  border-right: 1px solid rgba(252, 220, 30, 0.15);
  padding: 30px 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 0 24px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 24px;
}

.sidebar-header h2 {
  color: var(--yellow);
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 900;
}

.admin-email {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
}

.nav-item {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  border-left: 3px solid transparent;
  border-radius: 8px;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(252, 220, 30, 0.08);
  color: var(--yellow);
}

.nav-item.active {
  background: rgba(252, 220, 30, 0.12);
  color: var(--yellow);
  border-left-color: var(--yellow);
  font-weight: 700;
}

/* ================================================ */
/* LAYOUT PRINCIPAL */
/* ================================================ */
.admin-main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  min-width: 0;
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
  gap: 20px;
  flex-wrap: wrap;
}

.section-title {
  color: var(--yellow);
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 2px 20px rgba(252, 220, 30, 0.5);
}

/* ================================================ */
/* CARDS COMMUNES */
/* ================================================ */
.dash-stat-card, .user-item, .prestataire-stat-card, .prest-card,
.demande-card, .historique-item, .attribution-card, .comment-card,
.prog-slot-card, .avis-detail-panel, .festival-rating-card-main,
.stats-main-section, .prest-editor-card, .prog-controls-card,
.carte-intro-card, .prest-intro-card, .prog-intro-card, .pres-intro-card,
.chart-card-full, .prest-editor-section, .pres-section-card,
.festival-rating-distribution-card, .prest-detail-alert, .prest-modifications-alert {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.dash-stat-card, .user-item, .prest-card, .prog-slot-card, .prestataire-stat-card {
  cursor: pointer;
}

.dash-stat-card:hover, .user-item:hover, .prest-card:hover,
.prog-slot-card:hover, .prestataire-stat-card:hover {
  transform: translateY(-4px);
  border-color: var(--blue);
  box-shadow: var(--shadow-lg);
}

/* ================================================ */
/* ICONES & BADGES */
/* ================================================ */
.dash-stat-icon, .prest-intro-icon, .prog-intro-icon, .pres-intro-icon,
.carte-intro-icon, .user-icon, .demande-icon, .festival-rating-icon-large {
  font-size: 3rem;
  width: 75px;
  height: 75px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 18px;
  border: 2px solid rgba(252, 220, 30, 0.35);
  flex-shrink: 0;
}

.user-role-badge, .badge-avis, .prest-card-type, .prog-slot-badge,
.prest-modified-badge, .status-label {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-admin { background: rgba(255, 59, 48, 0.2); color: #ff3b30; border: 1px solid rgba(255, 59, 48, 0.3); }
.role-prestataire { background: rgba(59, 130, 246, 0.2); color: var(--blue); border: 1px solid rgba(59, 130, 246, 0.3); }
.role-user { background: rgba(34, 197, 94, 0.2); color: var(--green); border: 1px solid rgba(34, 197, 94, 0.3); }

/* ================================================ */
/* BOUTONS COMMUNS */
/* ================================================ */
.btn-primary, .btn-save, .btn-prog-save, .pres-btn-save, .prest-btn-save,
.btn-prog-save-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: all 0.3s ease;
  box-shadow: 0 6px 28px rgba(252, 220, 30, 0.4);
  text-decoration: none;
}

.btn-primary:hover, .btn-save:hover, .btn-prog-save:hover,
.pres-btn-save:hover, .prest-btn-save:hover, .btn-prog-save-all:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(252, 220, 30, 0.6);
}

.btn-add-user, .btn-prog-add, .prest-btn-add-service, .btn-prog-add-first,
.btn-refresh-map {
  background: linear-gradient(135deg, var(--blue) 0%, #2563eb 100%);
  border: none;
  color: #fff;
  padding: 12px 24px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.btn-add-user:hover, .btn-prog-add:hover, .prest-btn-add-service:hover,
.btn-prog-add-first:hover, .btn-refresh-map:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);
}

.btn-delete-user, .btn-prog-delete, .prest-btn-delete-service,
.btn-refuser, .btn-liberer-full {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--red);
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  transition: all 0.3s ease;
}

.btn-delete-user:hover, .btn-prog-delete:hover, .prest-btn-delete-service:hover,
.btn-refuser:hover, .btn-liberer-full:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
}

.btn-accepter {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
}

.btn-accepter:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(34, 197, 94, 0.6);
}

.btn-back, .pres-btn-reset, .prest-btn-reset-detail, .btn-prog-cancel {
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

.btn-back:hover, .pres-btn-reset:hover, .prest-btn-reset-detail:hover,
.btn-prog-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(-4px);
}

/* ================================================ */
/* FORMULAIRES */
/* ================================================ */
.form-group, .prest-form-group, .prog-form-group, .pres-form-group {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label, .prest-form-label, .prog-form-label, .pres-form-label,
.prest-form-label-small, .prog-control-label {
  display: block;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.form-input, .prest-form-input, .prog-form-input, .prog-select, .prest-form-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid var(--border-light);
  color: var(--text);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus, .prest-form-input:focus, .prog-form-input:focus,
.prog-select:focus, .prest-form-textarea:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.prest-form-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.6;
}

.form-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin: 8px 0 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ================================================ */
/* GRIDS */
/* ================================================ */
.dash-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 28px;
  margin-bottom: 48px;
}

.dash-stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 24px;
}

.dash-stat-info { flex: 1; }

.dash-stat-value {
  font-size: 2.8rem;
  font-weight: 900;
  color: var(--yellow);
  line-height: 1;
  margin: 0 0 8px 0;
}

.dash-stat-label {
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.prest-grid, .attribution-grid, .comments-list, .demandes-grid, .prestataire-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.prog-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.avis-stats-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.5fr);
  gap: 24px;
}

.festival-rating-overview {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(0, 1.6fr);
  gap: 20px;
  margin-bottom: 32px;
}

/* ================================================ */
/* RATINGS & STATISTIQUES */
/* ================================================ */
.dash-rating-overview-card {
  display: flex;
  gap: 40px;
  padding: 32px;
  margin-bottom: 40px;
}

.dash-rating-left {
  display: flex;
  align-items: center;
  gap: 28px;
  min-width: 350px;
}

.dash-rating-main { flex: 1; }

.dash-rating-score {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin: 0 0 12px 0;
}

.dash-rating-stars, .detail-score-stars, .festival-rating-stars-large,
.rating-stars-mini, .comment-rating {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.dash-star, .star-detail, .star-huge, .star-mini, .comment-star {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.2);
  transition: color 0.3s ease;
}

.dash-star.filled, .star-detail.filled, .star-huge.filled,
.star-mini.filled, .comment-star.filled {
  color: var(--yellow);
  text-shadow: 0 0 10px rgba(252, 220, 30, 0.5);
}

.dash-rating-meta, .festival-rating-count {
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.dash-rating-right {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 28px;
}

.dash-rating-right h3 {
  color: var(--yellow);
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.dash-rating-distribution, .distribution-bars, .festival-distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dash-distribution-row, .distribution-bar-row, .festival-distribution-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dash-distribution-label, .distribution-star-label, .festival-dist-label {
  min-width: 40px;
  font-weight: 700;
  color: var(--text);
  font-size: 0.95rem;
}

.dash-distribution-bar, .distribution-bar-bg, .festival-dist-bar-bg {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.dash-distribution-fill, .distribution-bar-fg, .festival-dist-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--yellow) 0%, var(--purple) 100%);
  border-radius: 8px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.dash-distribution-count, .distribution-count-label, .festival-dist-count {
  min-width: 32px;
  text-align: right;
  font-weight: 700;
  color: var(--text);
  font-size: 0.9rem;
}

.festival-dist-percent {
  min-width: 48px;
  text-align: right;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

/* ================================================ */
/* GRAPHIQUE CHART.JS */
/* ================================================ */
.chart-card-full {
  padding: 28px 32px;
  margin-bottom: 36px;
}

.chart-card-full h3 {
  margin: 0 0 24px 0;
  color: var(--text);
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.chart-container {
  position: relative;
  height: 440px;
  width: 100%;
  margin-bottom: 20px;
}

.chart-hint {
  margin: 0;
  padding: 16px 20px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  color: rgba(226, 232, 240, 0.9);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* ================================================ */
/* CARTE INTERACTIVE */
/* ================================================ */
.admin-carte-container {
  display: grid;
  grid-template-columns: minmax(0, 3.5fr) minmax(240px, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.admin-carte-map {
  height: 560px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid var(--border);
  box-shadow: var(--shadow-md);
}

.admin-carte-legende {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
}

.legende-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
}

.legende-marker {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.legende-marker.disponible { background: var(--green); }
.legende-marker.attribue { background: var(--yellow); }
.legende-marker.en-attente { background: var(--orange); }

/* ================================================ */
/* DEMANDES & HISTORIQUE */
/* ================================================ */
.demandes-section, .historique-section {
  margin-bottom: 32px;
}

.demandes-header, .historique-title {
  margin-bottom: 24px;
}

.demandes-title, .historique-title {
  color: var(--text);
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.demande-card {
  padding: 24px;
}

.demande-card-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.demande-info h3 {
  color: var(--yellow);
  font-size: 1.2rem;
  margin: 0 0 8px 0;
}

.demande-coords, .demande-date {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 4px 0;
}

.demande-actions {
  display: flex;
  gap: 12px;
}

.historique-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.historique-item {
  display: flex;
  gap: 20px;
  align-items: start;
  padding: 20px;
}

.historique-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.historique-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.historique-details strong {
  color: var(--yellow);
  font-size: 1.05rem;
}

.historique-coords, .historique-status, .historique-raison, .historique-date {
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* ================================================ */
/* ATTRIBUTION CARDS */
/* ================================================ */
.attribution-section {
  margin-top: 32px;
}

.attribution-header {
  margin-bottom: 24px;
}

.attribution-title {
  color: var(--text);
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.attribution-subtitle {
  color: var(--text-muted);
  font-size: 1rem;
  margin: 0;
}

.attribution-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attribution-card-header {
  display: flex;
  gap: 16px;
  align-items: center;
}

.attribution-card-image-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
}

.attribution-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attribution-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.attribution-card-info {
  flex: 1;
  min-width: 0;
}

.attribution-card-name {
  color: var(--yellow);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
}

.attribution-card-type {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(168, 85, 247, 0.2);
  color: var(--purple);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.emplacement-actuel-display, .emplacement-vide-display {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 16px;
}

.emplacement-status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-icon {
  font-size: 1.2rem;
}

.status-icon.success { color: var(--green); }
.status-icon.warning { color: var(--orange); }

.emplacement-coords-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.coords-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 600;
}

.coords-value {
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--yellow);
  display: block;
}

.emplacement-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}

/* ================================================ */
/* GESTION PRESTATAIRES - STYLES MANQUANTS */
/* ================================================ */

/* Stats Row */
.prest-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.prest-stat-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
}

.prest-stat-box:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.prest-stat-icon {
  font-size: 2.5rem;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.25), rgba(252, 220, 30, 0.15));
  border-radius: 16px;
  border: 2px solid rgba(252, 220, 30, 0.35);
  flex-shrink: 0;
}

.prest-stat-details {
  flex: 1;
}

.prest-stat-number {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--yellow);
  line-height: 1;
  margin-bottom: 6px;
}

.prest-stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Liste des prestataires */
.prest-list-container {
  margin-top: 32px;
}

.prest-list-title {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Cards prestataires */
.prest-card {
  position: relative;
  overflow: hidden;
}

.prest-modified-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(234, 179, 8, 0.9);
  color: #0a0a0a;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.4);
}

.prest-badge-icon {
  font-size: 0.9rem;
}

.prest-card-header {
  width: 100%;
  height: 160px;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.05);
}

.prest-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.prest-card:hover .prest-card-image {
  transform: scale(1.05);
}

.prest-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(252, 220, 30, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
}

.prest-placeholder-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.prest-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prest-card-name {
  color: var(--yellow);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prest-card-type {
  background: rgba(168, 85, 247, 0.2);
  color: var(--purple);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.prest-card-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.prest-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.prest-meta-icon {
  font-size: 1.1rem;
}

.prest-meta-value {
  font-weight: 600;
}

.prest-card-changes {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.prest-changes-label {
  display: block;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.prest-changes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prest-change-tag {
  background: rgba(234, 179, 8, 0.3);
  color: var(--yellow);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.prest-card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.prest-btn-view {
  width: 100%;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: var(--blue);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.prest-btn-view:hover {
  background: rgba(59, 130, 246, 0.25);
  transform: translateY(-2px);
}

.prest-btn-icon {
  font-size: 1rem;
}

/* ================================================ */
/* DÉTAIL PRESTATAIRE - STYLES MANQUANTS */
/* ================================================ */

.prest-detail-alert {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 152, 0, 0.1);
  border: 2px solid rgba(255, 152, 0, 0.4);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.prest-detail-alert-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.prest-detail-alert-content {
  flex: 1;
}

.prest-detail-alert-title {
  color: var(--orange);
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
}

.prest-detail-alert-text {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.prest-editor-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-light);
}

.prest-image-preview {
  margin-top: 12px;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid var(--border-light);
}

.prest-image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.prest-form-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin: 8px 0 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.hint-icon {
  font-size: 1rem;
}

.prest-preview-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 20px;
  min-height: 150px;
  color: var(--text);
  line-height: 1.6;
}

/* Services */
.prest-services-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.prest-service-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: start;
  transition: all 0.3s ease;
}

.prest-service-card:hover {
  background: rgba(255, 255, 255, 0.05);
}

.prest-service-inactive {
  opacity: 0.6;
  border-style: dashed;
}

.prest-service-number {
  background: linear-gradient(135deg, var(--purple) 0%, #818cf8 100%);
  color: #fff;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.prest-number-icon {
  font-size: 1rem;
}

.prest-service-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prest-service-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prest-btn-toggle {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--red);
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.prest-btn-toggle-active {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: var(--green);
}

.prest-btn-toggle:hover {
  transform: translateY(-2px);
}

.prest-toggle-icon {
  font-size: 1rem;
}

.prest-services-empty {
  text-align: center;
  padding: 60px 20px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed var(--border-light);
  border-radius: 16px;
}

.prest-empty-icon {
  font-size: 4rem;
  opacity: 0.5;
  display: block;
  margin-bottom: 16px;
}

.prest-empty-title {
  color: var(--text);
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.prest-empty-text {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

.prest-editor-footer {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid var(--border-light);
}

/* ================================================ */
/* CARTE - STYLES MANQUANTS */
/* ================================================ */

.carte-map-section {
  margin-bottom: 32px;
}

.carte-map-header {
  margin-bottom: 20px;
}

.carte-map-header h2 {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.carte-map-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0 0 16px 0;
}

/* ================================================ */
/* STATS - STYLES MANQUANTS */
/* ================================================ */

.stats-section-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border-light);
}

.stats-section-title {
  color: var(--yellow);
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.stats-section-subtitle {
  color: var(--text-muted);
  font-size: 1rem;
  margin: 0;
  font-weight: 600;
}

.avis-stats-section {
  margin-bottom: 48px;
}

.avis-section-title {
  color: var(--text);
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.avis-section-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.avis-prestataires-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-title {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h4 {
  color: var(--yellow);
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
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
  color: var(--yellow);
  line-height: 1;
}

.rating-value.no-rating {
  color: var(--text-muted);
}

.card-footer {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--border-light);
}

.last-comment-label {
  display: block;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.last-comment-text {
  color: var(--text);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
  font-style: italic;
}

.no-comment-text {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
  font-style: italic;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-light);
}

.detail-header h3 {
  color: var(--yellow);
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.btn-close-detail {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: var(--red);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: 700;
  transition: all 0.3s ease;
}

.btn-close-detail:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: scale(1.1);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-score-section {
  text-align: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid var(--border-light);
}

.detail-score-main {
  margin-bottom: 16px;
}

.detail-score-value {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 8px;
}

.detail-score-label {
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 600;
}

.detail-score-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 12px;
}

.detail-distribution {
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid var(--border-light);
}

.detail-distribution h4 {
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 16px 0;
  text-transform: uppercase;
}

.detail-info-box {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 16px;
}

.detail-info-box p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 5rem;
  opacity: 0.3;
  display: block;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 1rem;
  margin: 0;
  line-height: 1.6;
}

/* Festival stats */
.festival-header {
  border-top: 2px solid var(--border-light);
  padding-top: 32px;
  margin-top: 48px;
}

.festival-avis-stats {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.festival-subsection-title {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.festival-rating-icon-wrapper {
  flex-shrink: 0;
}

.festival-rating-details {
  flex: 1;
  text-align: center;
}

.festival-rating-score-huge {
  font-size: 5rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--yellow) 0%, #ffe676 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 16px;
}

.festival-rating-label {
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.festival-rating-distribution-card h4 {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 20px 0;
  text-transform: uppercase;
}

/* ================================================ */
/* PROGRAMMATION - STYLES MANQUANTS */
/* ================================================ */

.prog-control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prog-label-icon {
  margin-right: 6px;
}

.prog-slots-container {
  margin-top: 32px;
}

.prog-slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}

.prog-slots-title-wrapper {
  flex: 1;
}

.prog-slots-title {
  color: var(--yellow);
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 6px 0;
  text-transform: uppercase;
}

.prog-slots-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

.prog-slot-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prog-slot-badge {
  background: linear-gradient(135deg, var(--purple) 0%, #818cf8 100%);
  color: #fff;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
}

.prog-badge-icon {
  font-size: 0.9rem;
}

.prog-slot-info {
  flex: 1;
}

.prog-artist-name {
  color: var(--yellow);
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 12px 0;
}

.prog-slot-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.prog-time-badge, .prog-style-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-light);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.prog-time-icon, .prog-style-icon {
  font-size: 1rem;
}

.prog-slot-actions {
  display: flex;
  gap: 8px;
  align-self: flex-start;
}

.btn-prog-edit {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: var(--blue);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-prog-edit:hover {
  background: rgba(59, 130, 246, 0.25);
  transform: translateY(-2px);
}

.btn-action-icon {
  font-size: 1rem;
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
  border-bottom: 2px solid var(--border-light);
}

.prog-editor-icon {
  font-size: 1.5rem;
}

.prog-editor-header h4 {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
}

/* ================================================ */
/* PRÉSENTATION - STYLES AMÉLIORÉS BOUTONS */
/* ================================================ */

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

/* Tabs Navigation */
.pres-tabs-container {
  margin-bottom: 28px;
  overflow: hidden;
  border-radius: 16px;
  border: 2px solid var(--border-light);
  background: var(--bg-dark);
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

/* Editor Container */
.pres-editor-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Section Cards */
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

/* Section Body */
.pres-section-body {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Card Editor (pour les 3 cards About) */
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

/* Boutons de sélection de langue */
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

/* Boutons de sélection de langue */
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

/* Boutons Présentation */
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

/* Actions globales en bas de page */
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

/* Bouton Sauvegarder Principal - Design Premium */
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
  box-shadow:
    0 10px 40px rgba(252, 220, 30, 0.5),
    0 0 0 0 rgba(252, 220, 30, 0.4);
  overflow: hidden;
  z-index: 1;
}

/* Effet de brillance animé */
.pres-btn-shine {
  position: absolute;
  top: -50%;
  left: -100%;
  width: 60%;
  height: 200%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  transform: skewX(-25deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  20%, 100% { left: 200%; }
}

/* Effet de pulsation sur le box-shadow */
@keyframes pulse-shadow {
  0%, 100% {
    box-shadow:
      0 10px 40px rgba(252, 220, 30, 0.5),
      0 0 0 0 rgba(252, 220, 30, 0.4);
  }
  50% {
    box-shadow:
      0 15px 60px rgba(252, 220, 30, 0.7),
      0 0 0 8px rgba(252, 220, 30, 0.2);
  }
}

.pres-btn-save-main {
  animation: pulse-shadow 2.5s ease-in-out infinite;
}

/* Hover states */
.pres-btn-save-main:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow:
    0 20px 60px rgba(252, 220, 30, 0.7),
    0 0 0 4px rgba(252, 220, 30, 0.3);
  animation: none;
}

.pres-btn-save-main:active {
  transform: translateY(-2px) scale(0.98);
  box-shadow:
    0 8px 30px rgba(252, 220, 30, 0.6),
    0 0 0 2px rgba(252, 220, 30, 0.4);
}

/* Effet de particules au hover */
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

/* Styles des éléments internes */
.pres-btn-icon {
  font-size: 1.3rem;
  position: relative;
  z-index: 2;
  transition: transform 0.3s ease;
}

.pres-btn-save-main:hover .pres-btn-icon {
  transform: scale(1.2) rotate(360deg);
}

.pres-btn-text {
  position: relative;
  z-index: 2;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Effet de lueur au focus */
.pres-btn-save-main:focus {
  outline: none;
  box-shadow:
    0 15px 50px rgba(252, 220, 30, 0.8),
    0 0 0 6px rgba(252, 220, 30, 0.4);
}

/* Effet de chargement (optionnel) */
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

/* ================================================ */
/* ÉTATS VIDES */
/* ================================================ */
.no-demandes, .prog-empty-state, .empty-state {
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed var(--border-light);
  border-radius: 20px;
  padding: 60px 32px;
  text-align: center;
}

/* ================================================ */
/* RESPONSIVE */
/* ================================================ */
@media (max-width: 1024px) {
  /* ...existing code... */

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
  /* ...existing code... */

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
