<script setup>
import { ref, onMounted, computed, watch, nextTick, toRaw } from 'vue'
import { useAdminAuth } from '@/composables/admin/useAdminAuth'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminDashboard from '@/components/admin/AdminDashboard.vue'
import AdminStats from '@/components/admin/AdminStats.vue'
import AdminPresentation from '@/components/admin/AdminPresentation.vue'
// AJOUT: Imports manquants pour les prestataires
import AdminPrestataires from '@/components/admin/AdminPrestataires.vue'
import AdminPrestataireDetail from '@/components/admin/AdminPrestataireDetail.vue'
import WysiwygEditor from '@/components/WysiwygEditor.vue'
import AdminProgrammation from '@/components/admin/AdminProgrammation.vue'
import AdminMap from '@/components/admin/AdminMap.vue'
import AdminUsers from '@/components/admin/AdminUsers.vue'
import AdminUserDetail from '@/components/admin/AdminUserDetail.vue'

// AJOUT: Référence pour le canvas Chart.js
const chartCanvas = ref(null)
let chartInstance = null

const { authUser, loading, isAdmin, adminEmail, loadAuthFromStorage, checkAdminAccess } = useAdminAuth()
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
const emplacements = ref([])

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
  mapIntro: 'Retrouvez tous les points d\'intérêt du festival : scènes, parkings, campings et plus encore.',

  // AJOUT: Footer
  footerDescription: 'Le Golden Coast Festival est l\'événement rap français incontournable de l\'année. Rejoignez-nous pour trois jours de musique, de culture urbaine et de moments inoubliables.'
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
  mapIntro: 'Find all the festival points of interest: stages, parking lots, campsites and more.',

  // AJOUT: Footer
  footerDescription: 'Golden Coast Festival is the must-attend French rap event of the year. Join us for three days of music, urban culture and unforgettable moments.'
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

  try {
    const emailToDelete = selectedUser.value.email

    // MODIFICATION: Supprimer de users.value
    const index = users.value.findIndex(u => u.email === emailToDelete)
    if (index !== -1) {
      users.value.splice(index, 1)
    }

    // MODIFICATION: Supprimer du localStorage 'users' (créés via AdminView)
    const localStorageUsersRaw = localStorage.getItem('users')
    if (localStorageUsersRaw) {
      try {
        let localUsers = JSON.parse(localStorageUsersRaw)
        localUsers = localUsers.filter(u => u.email !== emailToDelete)
        localStorage.setItem('users', JSON.stringify(localUsers))
      } catch (e) {
        console.error('Erreur suppression localStorage users', e)
      }
    }

    // MODIFICATION: Supprimer du localStorage 'customUsers' (créés via RegisterView)
    const customUsersRaw = localStorage.getItem('customUsers')
    if (customUsersRaw) {
      try {
        let customUsers = JSON.parse(customUsersRaw)
        customUsers = customUsers.filter(u => u.email !== emailToDelete)
        localStorage.setItem('customUsers', JSON.stringify(customUsers))
      } catch (e) {
        console.error('Erreur suppression customUsers', e)
      }
    }

    // AJOUT: Émettre des événements pour synchroniser
    window.dispatchEvent(new Event('auth-changed'))
    window.dispatchEvent(new Event('storage'))

    alert('Utilisateur supprimé avec succès!')
    changeSection('users')
  } catch (e) {
    console.error('Erreur lors de la suppression:', e)
    alert('Erreur lors de la suppression de l\'utilisateur')
  }
}

// AJOUT: Fonction pour recharger les utilisateurs
const reloadUsers = async () => {
  try {
    const usersResp = await fetch('/data/users.json', { cache: 'no-store' })

    if (usersResp.ok) {
      const usersData = await usersResp.json()
      users.value = []
      await nextTick()

      // Charger depuis localStorage (qui contient les utilisateurs créés via RegisterView)
      const customUsersRaw = localStorage.getItem('customUsers')
      const localStorageUsersRaw = localStorage.getItem('users')

      let allUsers = [...usersData]

      // Ajouter les utilisateurs de customUsers (créés via RegisterView)
      if (customUsersRaw) {
        try {
          const customUsers = JSON.parse(customUsersRaw)
          allUsers = [...allUsers, ...customUsers]
        } catch (e) {
          console.error('Erreur parsing customUsers', e)
        }
      }

      // Ajouter les utilisateurs de users (créés via AdminView)
      if (localStorageUsersRaw) {
        try {
          const localUsers = JSON.parse(localStorageUsersRaw)
          // Fusionner en évitant les doublons par email
          localUsers.forEach(localUser => {
            if (!allUsers.some(u => u.email === localUser.email)) {
              allUsers.push(localUser)
            }
          })
        } catch (e) {
          console.error('Erreur parsing users', e)
        }
      }

      // Supprimer les doublons basés sur l'email
      const uniqueUsers = allUsers.reduce((acc, user) => {
        if (!acc.some(u => u.email === user.email)) {
          acc.push(user)
        }
        return acc
      }, [])

      users.value = uniqueUsers
      await nextTick()

      console.log('✅ Utilisateurs rechargés:', users.value.length)
    }
  } catch (e) {
    console.error('Erreur rechargement utilisateurs', e)
  }
}

// MODIFICATION: Fonction loadData - simplifier le chargement des utilisateurs
const loadData = async () => {
  if (!isAdmin.value) {
    loading.value = false
    return
  }

  try {
    // Utiliser reloadUsers au lieu de dupliquer le code
    await reloadUsers()

    // Charger les autres données
    const [prestatairesResp, zonesResp, emplacementsResp, avisResp] = await Promise.all([
      fetch('/data/prestataires.json', { cache: 'no-store' }),
      fetch('/data/zones.json', { cache: 'no-store' }),
      fetch('/data/emplacements.json', { cache: 'no-store' }),
      fetch('/data/avis.json', { cache: 'no-store' })
    ])

    const prestataireData = prestatairesResp.ok ? await prestatairesResp.json() : { prestataires: [] }
    const zonesData = zonesResp.ok ? await zonesResp.json() : { zones: [] }
    const emplacementsData = emplacementsResp.ok ? await emplacementsResp.json() : { emplacements: [] }
    const avisData = avisResp.ok ? await avisResp.json() : {}

    zones.value = zonesData.zones || []
    emplacementsForMap.value = emplacementsData.emplacements || []

    // MODIFICATION: Utiliser TOUS les prestataires du JSON, pas seulement ceux avec des avis
    const prestatairesFiltered = (prestataireData.prestataires || [])
      .map(p => ({
        ...p,
        description: typeof p.description === 'string' ? p.description : (p.description || '')
      }))

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
        return {
          ...p,
          ...custom,
          description: typeof custom.description === 'string'
            ? custom.description
            : (custom.description || p.description || '')
        }
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

    Object.entries(allAvis).forEach(([prestataire, entry]) => {
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
      totalPrestataires: prestataires.value.length, // MODIFICATION: Utilise le nombre total de prestataires
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

    // Charger présentation depuis festival.json (BDD)
    try {
      const festivalResp = await fetch('/data/festival.json', { cache: 'no-store' })
      if (festivalResp.ok) {
        const festivalData = await festivalResp.json()
        if (festivalData.presentation) {
          // Charger depuis festival.json
          festivalPresentation.value = festivalData.presentation
        } else {
          // Si pas de présentation dans festival.json, utiliser les valeurs par défaut
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

      // Charger depuis localStorage (prioritaire sur festival.json)
      const storedPresentation = localStorage.getItem('festivalPresentation')
      if (storedPresentation) {
        try {
          const parsed = JSON.parse(storedPresentation)
          festivalPresentation.value = parsed
        } catch (e) {
          console.error('Erreur lors du parsing de festivalPresentation depuis localStorage:', e)
        }
      }
    } catch (e) {
      console.error('Erreur chargement présentation depuis festival.json:', e)
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
    // Silencieux
  } finally {
    loading.value = false
  }
}

// GARDER CETTE VERSION UNIQUEMENT
const loadEmplacements = async () => {
  try {
    const resp = await fetch('/data/emplacements.json', { cache: 'no-store' })
    if (resp.ok) {
      const data = await resp.json()
      emplacements.value = data.emplacements || []
    }
  } catch (e) {
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
    programmation.value = { stages: [], schedules: [] }
  }
}

const savePresentation = async () => {
  try {
    const presentationToSave = JSON.parse(JSON.stringify(toRaw(festivalPresentation.value)));
    localStorage.setItem('festivalPresentation', JSON.stringify(presentationToSave));
    window.dispatchEvent(new Event('festival-presentation-updated'));
    alert('Présentation sauvegardée avec succès!');
  } catch (e) {
    alert('Erreur lors de la sauvegarde');
  }
};

const currentPresentation = computed({
  get: () => {
    const lang = editingLang.value;
    if (!festivalPresentation.value[lang]) {
      festivalPresentation.value[lang] = lang === 'fr'
        ? { ...defaultPresentationFR }
        : { ...defaultPresentationEN };
    }
    return { ...festivalPresentation.value[lang] };
  },
  set: (value) => {
    const lang = editingLang.value;
    festivalPresentation.value = {
      ...festivalPresentation.value,
      [lang]: { ...value }
    };
  }
})

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
    // Silencieux
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
      // Silencieux
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
      // Silencieux
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

// SUPPRESSION: Supprimer la référence chartCanvas et les fonctions createBarChart/initChart
// car elles sont maintenant dans AdminStats.vue

// SUPPRESSION: Supprimer aussi le watcher qui crée le graphique
// watch(currentSection, async (newSection) => {
//   if (newSection === 'statistiques') {
//     await nextTick()
//     if (chartCanvas.value && avisStatsParPrestataire.value.length > 0) {
//       createBarChart()
//     }
//   }
// })

onMounted(() => {
  loadAuthFromStorage()
  if (!checkAdminAccess()) return

  loadData().then(async () => {
    await computeAvisStatsForPrestataires()
  })

  // MODIFICATION: Écouter les mises à jour en temps réel
  window.addEventListener('demandes-updated', loadDemandesEmplacement)
  window.addEventListener('emplacements-updated', loadEmplacementsAttribues)
  window.addEventListener('avis-updated', handleAvisUpdated)

  // AJOUT: Écouter les changements d'authentification (création de compte)
  window.addEventListener('auth-changed', reloadUsers)
  window.addEventListener('storage', reloadUsers)
})

// AJOUT: Fonction pour gérer les mises à jour d'avis
const handleAvisUpdated = async (event) => {
  console.log('🔔 Avis mis à jour, rechargement des statistiques...', event?.detail)

  // Recharger toutes les données (incluant les avis)
  await loadData()

  // Recalculer les stats d'avis des prestataires
  await computeAvisStatsForPrestataires()

  // Forcer le re-render si on est sur la section statistiques
  if (currentSection.value === 'statistiques') {
    await nextTick()
  }

  console.log('✅ Statistiques rechargées')
}

onMounted(() => {
  loadAuthFromStorage()
  if (!checkAdminAccess()) return

  loadData().then(async () => {
    await computeAvisStatsForPrestataires()
  })

  // MODIFICATION: Écouter les mises à jour en temps réel
  window.addEventListener('demandes-updated', loadDemandesEmplacement)
  window.addEventListener('emplacements-updated', loadEmplacementsAttribues)
  window.addEventListener('avis-updated', handleAvisUpdated)

  // AJOUT: Écouter les changements d'authentification (création de compte)
  window.addEventListener('auth-changed', reloadUsers)
  window.addEventListener('storage', reloadUsers)
})

// AJOUT: Nettoyer les écouteurs d'événements au démontage
import { onBeforeUnmount } from 'vue'

onBeforeUnmount(() => {
  window.removeEventListener('demandes-updated', loadDemandesEmplacement)
  window.removeEventListener('emplacements-updated', loadEmplacementsAttribues)
  window.removeEventListener('avis-updated', handleAvisUpdated)

  // AJOUT: Nettoyer les écouteurs d'utilisateurs
  window.removeEventListener('auth-changed', reloadUsers)
  window.removeEventListener('storage', reloadUsers)
})

// AJOUT: Computed simplifié sans Proxy
const displayUsers = computed(() => {
  return users.value
})

// AJOUT: Variables manquantes pour les statistiques
const avisStatsParPrestataire = ref([])
const selectedPrestataireStats = ref(null)

// AJOUT: Fonction changeSection manquante
const changeSection = (section) => {
  currentSection.value = section
  selectedPrestataire.value = null
  selectedUser.value = null
  isCreatingUser.value = false

  // Initialiser la carte si on va sur la section carte
  if (section === 'carte') {
    nextTick(() => {
      initAdminMap()
    })
  }
}

// AJOUT: Fonction selectPrestataire manquante
const selectPrestataire = (prestataire) => {
  const normalized = {
    ...prestataire,
    // AJOUT: Normaliser description lors de la sélection
    description: typeof prestataire.description === 'string'
      ? prestataire.description
      : (prestataire.description || '')
  }
  selectedPrestataire.value = JSON.parse(JSON.stringify(normalized))
  currentSection.value = 'prestataire-detail'
}

// AJOUT: Fonction hasModifications manquante
const hasModifications = (prestataire) => {
  return !!customPrestataires.value[prestataire.nom]
}

// AJOUT: Fonction getModifiedFields manquante
const getModifiedFields = (prestataire) => {
  const custom = customPrestataires.value[prestataire.nom]
  if (!custom) return []

  const original = prestatairesOriginaux.value.find(p => p.nom === prestataire.nom)
  if (!original) return Object.keys(custom)

  const modifiedFields = []
  for (const key of Object.keys(custom)) {
    if (JSON.stringify(custom[key]) !== JSON.stringify(original[key])) {
      modifiedFields.push(key)
    }
  }
  return modifiedFields
}

// AJOUT: Fonction resetPrestataire manquante
const resetPrestataire = () => {
  if (!selectedPrestataire.value) return

  const nom = selectedPrestataire.value.nom
  const original = prestatairesOriginaux.value.find(p => p.nom === nom)

  if (original) {
    selectedPrestataire.value = JSON.parse(JSON.stringify(original))
    delete customPrestataires.value[nom]
    localStorage.setItem('customPrestataires', JSON.stringify(customPrestataires.value))

    // Mettre à jour la liste
    const index = prestataires.value.findIndex(p => p.nom === nom)
    if (index !== -1) {
      prestataires.value[index] = JSON.parse(JSON.stringify(original))
    }

    alert('Prestataire réinitialisé avec succès!')
  }
}

// AJOUT: Fonction savePrestataireChanges manquante
const savePrestataireChanges = () => {
  if (!selectedPrestataire.value) return

  const nom = selectedPrestataire.value.nom
  customPrestataires.value[nom] = JSON.parse(JSON.stringify(selectedPrestataire.value))
  localStorage.setItem('customPrestataires', JSON.stringify(customPrestataires.value))

  // Mettre à jour la liste
  const index = prestataires.value.findIndex(p => p.nom === nom)
  if (index !== -1) {
    prestataires.value[index] = JSON.parse(JSON.stringify(selectedPrestataire.value))
  }

  alert('Modifications sauvegardées avec succès!')
}

// AJOUT: Fonction addService manquante
const addService = () => {
  if (!selectedPrestataire.value) return

  if (!selectedPrestataire.value.services) {
    selectedPrestataire.value.services = []
  }

  selectedPrestataire.value.services.push({
    nom: '',
    description: '',
    actif: true
  })
}

// AJOUT: Fonction toggleService manquante
const toggleService = (index) => {
  if (!selectedPrestataire.value?.services?.[index]) return
  selectedPrestataire.value.services[index].actif = !selectedPrestataire.value.services[index].actif
}

// AJOUT: Fonction deleteService manquante
const deleteService = (index) => {
  if (!selectedPrestataire.value?.services) return
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return
  selectedPrestataire.value.services.splice(index, 1)
}

// AJOUT: Fonction selectUser manquante
const selectUser = (user) => {
  selectedUser.value = JSON.parse(JSON.stringify(user))
  isCreatingUser.value = false
  currentSection.value = 'user-detail'
}

// AJOUT: Fonction startCreateUser manquante
const startCreateUser = () => {
  isCreatingUser.value = true
  newUser.value = {
    email: '',
    password: '',
    role: 'user',
    prestataireNom: ''
  }
  currentSection.value = 'user-detail'
}

// AJOUT: Fonction resetPresentation manquante
const resetPresentation = () => {
  if (!confirm('Êtes-vous sûr de vouloir réinitialiser la présentation ? Toutes les modifications seront perdues.')) return

  festivalPresentation.value = {
    fr: { ...defaultPresentationFR },
    en: { ...defaultPresentationEN }
  }

  localStorage.removeItem('festivalPresentation')
  window.dispatchEvent(new Event('festival-presentation-updated'))
  alert('Présentation réinitialisée avec succès!')
}

// AJOUT: Fonction addSlot manquante
const addSlot = (dayIndex, stageName) => {
  if (!programmation.value.schedules[dayIndex]) {
    programmation.value.schedules[dayIndex] = {}
  }
  if (!programmation.value.schedules[dayIndex][stageName]) {
    programmation.value.schedules[dayIndex][stageName] = []
  }

  programmation.value.schedules[dayIndex][stageName].push({
    artist: 'Nouvel artiste',
    start: '18:00',
    end: '19:00',
    style: 'Rap'
  })

  // Ouvrir l'édition du nouveau slot
  editingSlot.value = {
    dayIndex,
    stageName,
    slotIndex: programmation.value.schedules[dayIndex][stageName].length - 1
  }
}

// AJOUT: Fonction editSlot manquante
const editSlot = (dayIndex, stageName, slotIndex) => {
  editingSlot.value = { dayIndex, stageName, slotIndex }
}

// AJOUT: Fonction deleteSlot manquante
const deleteSlot = (dayIndex, stageName, slotIndex) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) return

  programmation.value.schedules[dayIndex][stageName].splice(slotIndex, 1)
  editingSlot.value = null
}

// AJOUT: Fonction saveSlot manquante
const saveSlot = () => {
  editingSlot.value = null
}

// AJOUT: Fonction cancelEdit manquante
const cancelEdit = () => {
  editingSlot.value = null
}

// AJOUT: Fonction saveProgrammation manquante
const saveProgrammation = () => {
  localStorage.setItem('customProgrammation', JSON.stringify(programmation.value))
  window.dispatchEvent(new Event('programmation-updated'))
  alert('Programmation sauvegardée avec succès!')
}

// AJOUT: Fonction computeAvisStatsForPrestataires manquante
const computeAvisStatsForPrestataires = async () => {
  const statsArray = []

  for (const prestataire of prestataires.value) {
    let avisArray = []

    // Charger depuis avis.json
    try {
      const resp = await fetch('/data/avis.json', { cache: 'no-store' })
      if (resp.ok) {
        const data = await resp.json()
        if (data[prestataire.nom]?.avis) {
          avisArray = [...data[prestataire.nom].avis]
        }
      }
    } catch (e) {
      // Silencieux
    }

    // Ajouter les avis localStorage
    try {
      const stored = localStorage.getItem('festivalAvis')
      if (stored) {
        const localAvis = JSON.parse(stored)
        const prestataireAvis = localAvis.filter(a => a.prestataire === prestataire.nom)
        avisArray = [...avisArray, ...prestataireAvis]
      }
    } catch (e) {
      // Silencieux
    }

    const nbAvis = avisArray.length
    let moyenne = 0
    const parNote = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    if (nbAvis > 0) {
      let somme = 0
      avisArray.forEach(a => {
        somme += a.note || 0
        const note = a.note || 0
        if (parNote[note] !== undefined) {
          parNote[note]++
        }
      })
      moyenne = somme / nbAvis
    }

    // Dernier avis
    const dernierAvis = avisArray.length > 0
      ? avisArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null

    statsArray.push({
      nom: prestataire.nom,
      nbAvis,
      moyenne,
      parNote,
      dernierAvis
    })
  }

  avisStatsParPrestataire.value = statsArray
}

// AJOUT: Fonction selectPrestataireStats manquante
const selectPrestataireStats = (item) => {
  selectedPrestataireStats.value = item
}

// Fonction de sauvegarde pour le composant
const handleSavePresentation = async (updatedPresentation) => {
  festivalPresentation.value = { ...updatedPresentation }
  await savePresentation()
}

// Fonction de changement de langue
const handleChangeLang = (lang) => {
  editingLang.value = lang
}

// Fonction de réinitialisation
const handleResetPresentation = async () => {
  await resetPresentation()
}
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
      <AdminSidebar
        :current-section="currentSection"
        :admin-email="adminEmail"
        @change-section="changeSection"
      />

      <main class="admin-main">
        <AdminDashboard v-if="currentSection === 'dashboard'" :stats="stats" />

        <AdminStats
          v-if="currentSection === 'statistiques'"
          :avisStatsParPrestataire="avisStatsParPrestataire"
          :stats="stats"
        />

        <AdminPresentation
          v-if="currentSection === 'presentation'"
          :festivalPresentation="festivalPresentation"
          :editingLang="editingLang"
          @save="handleSavePresentation"
          @changeLang="handleChangeLang"
          @reset="handleResetPresentation"
        />

        <AdminPrestataires
          v-if="currentSection === 'prestataires'"
          :prestataires="prestataires"
          :customPrestataires="customPrestataires"
          @select="selectPrestataire"
        />

        <AdminPrestataireDetail
          v-if="currentSection === 'prestataire-detail' && selectedPrestataire"
          :prestataire="selectedPrestataire"
          :hasModifications="hasModifications(selectedPrestataire)"
          :modifiedFields="getModifiedFields(selectedPrestataire)"
          @save="savePrestataireChanges"
          @back="changeSection('prestataires')"
          @reset="resetPrestataire"
        />

        <AdminProgrammation
          v-if="currentSection === 'programmation'"
          :programmation="programmation"
          :selectedDayIndex="selectedDayIndex"
          :selectedStage="selectedStage"
          :editingSlot="editingSlot"
          @update:selectedDayIndex="selectedDayIndex = $event"
          @update:selectedStage="selectedStage = $event"
          @update:editingSlot="editingSlot = $event"
          @addSlot="addSlot"
          @editSlot="editSlot"
          @deleteSlot="deleteSlot"
          @saveSlot="saveSlot"
          @cancelEdit="cancelEdit"
          @save="saveProgrammation"
        />

        <AdminMap
          v-if="currentSection === 'carte'"
          :prestataires="prestataires"
          :zones="zones"
          :emplacements="emplacementsForMap"
          :demandesEmplacement="demandesEmplacement"
          :emplacementsAttribues="emplacementsAttribues"
          @accepterDemande="accepterDemande"
          @refuserDemande="refuserDemande"
          @assignerEmplacement="assignerEmplacement"
          @libererEmplacement="libererEmplacementAdmin"
        />

        <!-- AJOUT: Gestion utilisateurs -->
        <AdminUsers
          v-if="currentSection === 'users'"
          :users="users"
          @select="selectUser"
          @create="startCreateUser"
        />

        <!-- AJOUT: Détail utilisateur -->
        <AdminUserDetail
          v-if="currentSection === 'user-detail'"
          :user="isCreatingUser ? newUser : selectedUser"
          :isCreating="isCreatingUser"
          :prestataires="prestataires"
          :authUserEmail="adminEmail"
          @save="saveUser"
          @back="changeSection('users')"
          @delete="deleteUser"
        />
      </main>
    </div>
  </div>
</template>

<style>
/* Importer les styles modulaires avec des chemins relatifs */
@import '../../styles/admin/variables.css';
@import '../../styles/admin/base.css';

/* MODIFICATION: Layout admin avec sidebar fixe */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
}

.admin-main {
  margin-left: 280px;
  width: calc(100% - 280px);
  padding: 40px;
  overflow-y: auto;
  height: 100vh;
}
</style>
