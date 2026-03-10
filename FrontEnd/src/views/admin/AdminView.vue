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
const prestataireDetailKey = ref(0) // Pour forcer le remontage du composant après sauvegarde
const users = ref([])
const selectedUser = ref(null)
const isCreatingUser = ref(false)
const newUser = ref({
  email: '',
  password: '',
  role: 'user',
  prestataireNom: ''
})

// Données pour la carte (zones et emplacements toujours utilisés pour les stats/demandes)
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

// Charger les demandes d'emplacement depuis l'API
const loadDemandesEmplacement = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const resp = await fetch('/api/emplacements', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (resp.ok) {
      const list = await resp.json()
      demandesEmplacement.value = (Array.isArray(list) ? list : []).filter(e => e.statut === 'en_attente')
    }
  } catch (e) {
    console.error('Erreur chargement demandes', e)
    demandesEmplacement.value = []
  }
}

// Charger les emplacements attribués depuis l'API
const loadEmplacementsAttribues = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const resp = await fetch('/api/emplacements', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (resp.ok) {
      const list = await resp.json()
      const attribues = {}
      ;(Array.isArray(list) ? list : []).forEach(e => {
        if (e.statut === 'pris' && e.prestataireNom) {
          attribues[e.prestataireNom] = e.coordonnees_completes || e.coordonnees
        }
      })
      emplacementsAttribues.value = attribues
    }
  } catch (e) {
    console.error('Erreur chargement emplacements attribués', e)
    emplacementsAttribues.value = {}
  }
}

// AJOUT: Accepter une demande (fonctionnel) - UNE SEULE VERSION
const accepterDemande = async (demande) => {
  if (!confirm(`Accepter la demande de ${demande.prestataireNom} pour l'emplacement ${demande.coordonnees} ?`)) return

  try {
    const token = localStorage.getItem('authToken')
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }

    // Mettre à jour l'emplacement via l'API
    if (demande.id_emplacement) {
      await fetch(`/api/emplacements/${demande.id_emplacement}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ statut: 'pris', prestataireNom: demande.prestataireNom })
      })
    }

    loadDemandesEmplacement()
    loadEmplacementsAttribues()

    window.dispatchEvent(new Event('emplacements-updated'))
    window.dispatchEvent(new Event('demandes-updated'))


    alert(`✅ Demande acceptée !\n\nL'emplacement ${demande.coordonnees} a été attribué à ${demande.prestataireNom}.`)
  } catch (e) {
    console.error('Erreur acceptation demande', e)
    alert('❌ Erreur lors de l\'acceptation de la demande')
  }
}

// AJOUT: Refuser une demande (fonctionnel) - UNE SEULE VERSION
const refuserDemande = async (demande) => {
  const raison = prompt(`Raison du refus de la demande de ${demande.prestataireNom} :`)
  if (raison === null) return

  try {
    const token = localStorage.getItem('authToken')
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }

    if (demande.id_emplacement) {
      await fetch(`/api/emplacements/${demande.id_emplacement}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ statut: 'libre', raison_refus: raison })
      })
    }

    loadDemandesEmplacement()
    window.dispatchEvent(new Event('demandes-updated'))

    alert(`✅ Demande refusée.\n\nRaison : ${raison}`)
  } catch (e) {
    console.error('Erreur refus demande', e)
    alert('❌ Erreur lors du refus de la demande')
  }
}

// AJOUT: Assigner directement un emplacement (fonctionnel) - UNE SEULE VERSION
const assignerEmplacement = async (prestataireNom, coords) => {
  if (!confirm(`Assigner l'emplacement ${coords} à ${prestataireNom} ?`)) return

  try {
    const token = localStorage.getItem('authToken')
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }

    // Trouver l'emplacement correspondant via l'API
    const empResp = await fetch('/api/emplacements', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (empResp.ok) {
      const list = await empResp.json()
      const emp = (Array.isArray(list) ? list : []).find(e => (e.coordonnees_completes || e.coordonnees) === coords)
      if (emp) {
        await fetch(`/api/emplacements/${emp.id_emplacement}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ statut: 'pris', prestataireNom })
        })
      }
    }

    loadEmplacementsAttribues()
    window.dispatchEvent(new Event('emplacements-updated'))

    alert(`✅ Emplacement assigné !\n\n${coords} a été attribué à ${prestataireNom}.`)
  } catch (e) {
    console.error('Erreur assignation emplacement', e)
    alert('❌ Erreur lors de l\'assignation')
  }
}

// AJOUT: Libérer un emplacement (fonctionnel) - UNE SEULE VERSION
const libererEmplacementAdmin = async (prestataireNom) => {
  if (!confirm(`Libérer l'emplacement de ${prestataireNom} ?`)) return

  try {
    const token = localStorage.getItem('authToken')
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }

    // Trouver l'emplacement attribué à ce prestataire via l'API
    const empResp = await fetch('/api/emplacements', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (empResp.ok) {
      const list = await empResp.json()
      const emp = (Array.isArray(list) ? list : []).find(e => e.prestataireNom === prestataireNom && e.statut === 'pris')
      if (emp) {
        await fetch(`/api/emplacements/${emp.id_emplacement}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ statut: 'libre', prestataireNom: null })
        })
      }
    }

    loadEmplacementsAttribues()
    window.dispatchEvent(new Event('emplacements-updated'))
    alert(`✅ Emplacement de ${prestataireNom} libéré.`)
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


const saveUser = async () => {
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
    // Créer via l'API
    try {
      const token = localStorage.getItem('authToken')
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(newUser.value)
      })
    } catch (e) { console.error('Erreur création utilisateur API:', e) }
    alert('Utilisateur créé avec succès!')
    changeSection('users')
  } else if (selectedUser.value) {
    // Modifier un utilisateur existant
    const index = users.value.findIndex(u => u.email === selectedUser.value.email)
    if (index !== -1) {
      users.value[index] = { ...selectedUser.value }
      // Mettre à jour via l'API
      try {
        const token = localStorage.getItem('authToken')
        const userId = selectedUser.value.id_utilisateur || selectedUser.value.id
        if (userId) {
          await fetch(`/api/utilisateurs/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(selectedUser.value)
          })
        }
      } catch (e) { console.error('Erreur modification utilisateur API:', e) }
      alert('Utilisateur modifié avec succès!')
    }
  }
}

const deleteUser = async () => {
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
    const userId = selectedUser.value.id_utilisateur || selectedUser.value.id

    // Supprimer via l'API
    if (userId) {
      const token = localStorage.getItem('authToken')
      await fetch(`/api/utilisateurs/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
    }

    // Mettre à jour la liste locale
    const index = users.value.findIndex(u => u.email === emailToDelete)
    if (index !== -1) {
      users.value.splice(index, 1)
    }

    window.dispatchEvent(new Event('auth-changed'))

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
    const token = localStorage.getItem('authToken')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    // Essayer l'API d'abord
    let usedApi = false
    try {
      const resp = await fetch('/api/utilisateurs', { headers })
      if (resp.ok) {
        const data = await resp.json()
        users.value = Array.isArray(data) ? data.map(u => ({
          ...u,
          username: u.nom_utilisateur,
          role: u.role?.nom_rôle || u.id_rôle
        })) : []
        usedApi = true
      }
    } catch (e) {
      console.error('Erreur chargement utilisateurs API:', e)
    }
    console.log('✅ Utilisateurs rechargés:', users.value.length)
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

    // Charger les autres données via API puis fallback JSON
    const token = localStorage.getItem('authToken')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    let prestataireData = { prestataires: [] }
    let zonesData = { zones: [] }
    let emplacementsData = { emplacements: [] }
    let avisDataRaw = {}

    // Essayer l'API
    try {
      const [prestatairesResp, zonesResp, emplacementsResp, avisResp] = await Promise.all([
        fetch('/api/prestataires', { headers }),
        fetch('/api/zones', { headers }),
        fetch('/api/emplacements', { headers }),
        fetch('/api/avis', { headers })
      ])
      if (prestatairesResp.ok) {
        const list = await prestatairesResp.json()
        prestataireData = {
          prestataires: (Array.isArray(list) ? list : []).map(p => ({
            ...p,
            description: { fr: p.description_fr || '', en: p.description_en || '' },
            email: p.contact_email, tel: p.contact_tel, site: p.site_web, image: p.photo_url,
            type: p.type_prestataire
          }))
        }
      }
      if (zonesResp.ok) { const list = await zonesResp.json(); zonesData = { zones: Array.isArray(list) ? list : [] } }
      if (emplacementsResp.ok) {
        const list = await emplacementsResp.json()
        emplacementsData = { emplacements: (Array.isArray(list) ? list : []).map(e => ({
          ...e, coordonnees: e.coordonnees_completes || e.coordonnees, id: e.id_emplacement
        })) }
      }
      if (avisResp.ok) {
        const list = await avisResp.json()
        // Convertir format API → format JSON { prestataireNom: { avis: [] } }
        ;(Array.isArray(list) ? list : []).forEach(a => {
          const nom = a.prestataire?.nom
          if (!nom) return
          if (!avisDataRaw[nom]) avisDataRaw[nom] = { avis: [] }
          avisDataRaw[nom].avis.push({ id: a.id_avis, note: a.note, commentaire: a.commentaire, date: a.date_avis })
        })
      }
    } catch (e) {
      console.error('Erreur chargement données API:', e)
    }

    zones.value = zonesData.zones || []
    emplacementsForMap.value = emplacementsData.emplacements || []

    // Utiliser TOUS les prestataires de l'API
    const prestatairesFiltered = (prestataireData.prestataires || [])
      .map(p => {
        let description = p.description
        if (typeof description === 'string') {
          description = { fr: description, en: '' }
        } else if (!description || typeof description !== 'object') {
          description = { fr: p.description_fr || '', en: p.description_en || '' }
        } else {
          description = {
            fr: description.fr || '',
            en: description.en || ''
          }
        }
        
        return {
          ...p,
          description: description
        }
      })

    prestatairesOriginaux.value = JSON.parse(JSON.stringify(prestatairesFiltered))
    prestataires.value = prestatairesFiltered

    const totalServices = prestataires.value.reduce((acc, p) => acc + (p.services?.length || 0), 0)

    // Charger les réservations depuis l'API
    let reservations = []
    try {
      const billetsResp = await fetch('/api/billets', { headers })
      if (billetsResp.ok) {
        const billetsData = await billetsResp.json()
        reservations = Array.isArray(billetsData) ? billetsData : []
      }
    } catch (e) {
      console.error('Erreur chargement réservations:', e)
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
    let allAvis = { ...avisDataRaw }


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

    // Avis festival — chargés depuis l'API (pas de localStorage)
    const avisFestivalList = []
    const totalAvisFestival = 0
    const avisFestivalMoyenne = 0
    const repartitionNotesFestival = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const dernierAvisFestival = []

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
      dernierAvisFestival
    }

    // Charger présentation depuis l'API (BDD)
    try {
      let festivalData = null

      try {
        const resp = await fetch('/api/manifestations', { headers })
        if (resp.ok) {
          const list = await resp.json()
          const festival = Array.isArray(list) ? (list.find(f => f.actif) || list[0]) : null
          if (festival) {
            const presFr = festival.presentation_fr || {}
            const presEn = festival.presentation_en || {}
            festivalData = {
              presentation: {
                fr: Object.keys(presFr).length > 0 ? presFr : { ...defaultPresentationFR, description: festival.description_fr || '' },
                en: Object.keys(presEn).length > 0 ? presEn : { ...defaultPresentationEN, description: festival.description_en || '' }
              }
            }
          }
        }
      } catch (e) {
        console.error('Erreur chargement festival API:', e)
      }

      if (festivalData?.presentation) {
        festivalPresentation.value = festivalData.presentation
      } else {
        festivalPresentation.value = { fr: { ...defaultPresentationFR }, en: { ...defaultPresentationEN } }
      }
    } catch (e) {
      console.error('Erreur chargement présentation festival:', e)
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
    const token = localStorage.getItem('authToken')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    try {
      const resp = await fetch('/api/emplacements', { headers })
      if (resp.ok) {
        const list = await resp.json()
        emplacements.value = (Array.isArray(list) ? list : []).map(e => ({
          ...e, coordonnees: e.coordonnees_completes || e.coordonnees, id: e.id_emplacement
        }))
      }
    } catch (e) {
      console.error('Erreur chargement emplacements:', e)
    }
  } catch (e) {
    emplacements.value = []
  }
}

const loadProgrammation = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    let data = null

    // Essayer l'API
    try {
      const resp = await fetch('/api/programmation', { headers })
      if (resp.ok) {
        const apiData = await resp.json()
        if (apiData.stages && apiData.schedules) {
          data = apiData
        }
      }
    } catch (e) {
      console.error('Erreur chargement programmation:', e)
    }

    if (!data) {
      data = { stages: [], schedules: [] }
    }

    programmationOriginaux.value = JSON.parse(JSON.stringify(data))
    programmation.value = { stages: data.stages || [], schedules: data.schedules || [] }

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
    const token = localStorage.getItem('authToken')
    const resp = await fetch('/api/manifestations', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (resp.ok) {
      const list = await resp.json()
      const festival = Array.isArray(list) ? (list.find(f => f.actif) || list[0]) : null
      if (festival) {
        await fetch(`/api/manifestations/${festival.id_festival}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            description_fr: presentationToSave.fr?.description || presentationToSave.fr?.footerDescription || '',
            description_en: presentationToSave.en?.description || presentationToSave.en?.footerDescription || '',
            presentation_fr: presentationToSave.fr || {},
            presentation_en: presentationToSave.en || {}
          })
        })
      }
    }
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
}

// AJOUT: Fonction selectPrestataire manquante
const selectPrestataire = (prestataire) => {
  // Normaliser la description en objet bilingue
  let description = prestataire.description
  if (typeof description === 'string') {
    // Convertir l'ancien format string en bilingue
    description = { fr: description, en: '' }
  } else if (!description || typeof description !== 'object') {
    description = { fr: '', en: '' }
  } else {
    // S'assurer que les deux langues existent
    description = {
      fr: description.fr || '',
      en: description.en || ''
    }
  }
  
  const normalized = {
    ...prestataire,
    description: description
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
const resetPrestataire = async () => {
  if (!selectedPrestataire.value) return

  const nom = selectedPrestataire.value.nom
  const original = prestatairesOriginaux.value.find(p => p.nom === nom)

  if (original) {
    selectedPrestataire.value = JSON.parse(JSON.stringify(original))
    delete customPrestataires.value[nom]

    // Réinitialiser via l'API
    const id = original.id_prestataire
    if (id) {
      try {
        const token = localStorage.getItem('authToken')
        await fetch(`/api/prestataires/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            description_fr: original.description?.fr || original.description_fr || '',
            description_en: original.description?.en || original.description_en || '',
            contact_email: original.email || original.contact_email || '',
            contact_tel: original.tel || original.contact_tel || '',
            site_web: original.site || original.site_web || ''
          })
        })
      } catch (e) { console.error('Erreur reset prestataire API:', e) }
    }

    const index = prestataires.value.findIndex(p => p.nom === nom)
    if (index !== -1) {
      prestataires.value[index] = JSON.parse(JSON.stringify(original))
    }

    alert('Prestataire réinitialisé avec succès!')
  }
}

// AJOUT: Fonction savePrestataireChanges manquante
const savePrestataireChanges = async (updatedPrestataire) => {
  const prestataireToSave = updatedPrestataire || selectedPrestataire.value
  if (!prestataireToSave) return

  const nom = prestataireToSave.nom

  const dataToSave = {
    description: JSON.parse(JSON.stringify(prestataireToSave.description)),
    services: JSON.parse(JSON.stringify(prestataireToSave.services || [])),
    email: prestataireToSave.email || '',
    tel: prestataireToSave.tel || '',
    site: prestataireToSave.site || ''
  }

  if (typeof dataToSave.description === 'string') {
    dataToSave.description = { fr: dataToSave.description, en: '' }
  } else if (!dataToSave.description || typeof dataToSave.description !== 'object') {
    dataToSave.description = { fr: '', en: '' }
  } else {
    dataToSave.description = { fr: dataToSave.description.fr || '', en: dataToSave.description.en || '' }
  }

  // Sauvegarder via l'API
  const id = prestataireToSave.id_prestataire
  if (id) {
    try {
      const token = localStorage.getItem('authToken')
      await fetch(`/api/prestataires/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          description_fr: dataToSave.description.fr,
          description_en: dataToSave.description.en,
          contact_email: dataToSave.email,
          contact_tel: dataToSave.tel,
          site_web: dataToSave.site
        })
      })
    } catch (e) { console.error('Erreur sauvegarde prestataire API:', e) }
  }

  // Mettre à jour la liste en mémoire
  const index = prestataires.value.findIndex(p => p.nom === nom)
  if (index !== -1) {
    const base = prestatairesOriginaux.value.find(p => p.nom === nom) || prestataires.value[index]
    prestataires.value[index] = { ...base, ...dataToSave }
  }

  const base = prestatairesOriginaux.value.find(p => p.nom === nom)
  if (base) {
    selectedPrestataire.value = { ...base, ...dataToSave }
  }

  window.dispatchEvent(new Event('prestataire-updated'))
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
const resetPresentation = async () => {
  if (!confirm('Êtes-vous sûr de vouloir réinitialiser la présentation ? Toutes les modifications seront perdues.')) return

  festivalPresentation.value = {
    fr: { ...defaultPresentationFR },
    en: { ...defaultPresentationEN }
  }

  await savePresentation()
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
const saveProgrammation = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const resp = await fetch('/api/programmation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(programmation.value)
    })
    if (!resp.ok) throw new Error('Erreur sauvegarde')
    window.dispatchEvent(new Event('programmation-updated'))
    alert('Programmation sauvegardée avec succès!')
  } catch (e) {
    console.error('Erreur sauvegarde programmation:', e)
    alert('Erreur lors de la sauvegarde de la programmation')
  }
}

// AJOUT: Fonction computeAvisStatsForPrestataires manquante
const computeAvisStatsForPrestataires = async () => {
  const statsArray = []
  const token = localStorage.getItem('authToken')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Charger tous les avis depuis l'API
  let allAvisMap = {}
  try {
    const resp = await fetch('/api/avis', { headers })
    if (resp.ok) {
      const list = await resp.json()
      ;(Array.isArray(list) ? list : []).forEach(a => {
        const nom = a.prestataire?.nom
        if (!nom) return
        if (!allAvisMap[nom]) allAvisMap[nom] = []
        allAvisMap[nom].push({ note: a.note, commentaire: a.commentaire, date: a.date_avis })
      })
    }
  } catch (e) {
    console.error('Erreur chargement avis:', e)
  }

  for (const prestataire of prestataires.value) {
    let avisArray = [...(allAvisMap[prestataire.nom] || [])]


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
          :key="`${selectedPrestataire.nom}-${prestataireDetailKey}`"
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
