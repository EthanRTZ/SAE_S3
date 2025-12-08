<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authUser = ref(null)
const prestataireInfo = ref(null)
const loading = ref(true)
const selectedSection = ref('presentation') // 'presentation' | 'services' | 'config' | 'user'
const presentationHtml = ref('') // contenu WYSIWYG
const images = ref([]) // images uploadées (base64)
const services = ref([]) // services modifiables
const userFields = ref({ email: '', tel: '', site: '' })

const loadAuthFromStorage = () => {
  try {
    const raw = localStorage.getItem('authUser')
    authUser.value = raw ? JSON.parse(raw) : null
  } catch (e) {
    authUser.value = null
  }
}

const isPrestataire = computed(() => authUser.value?.role === 'prestataire')
const prestataireNom = computed(() => authUser.value?.prestataireNom || '')

const loadPrestataireInfo = async () => {
  if (!isPrestataire.value || !prestataireNom.value) {
    prestataireInfo.value = null
    loading.value = false
    return
  }

  try {
    const customRaw = localStorage.getItem('customPrestataires')
    let customPrestataires = null
    if (customRaw) {
      try {
        customPrestataires = JSON.parse(customRaw)
      } catch (e) {
        // ignore
      }
    }

    const resp = await fetch('/data/prestataires.json', { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    const prestataires = data.prestataires || []

    let prestataire = prestataires.find(p => p.nom === prestataireNom.value) || null

    // Appliquer les modifications locales si elles existent
    if (prestataire) {
      const local = customPrestataires && customPrestataires[prestataireNom.value] ? customPrestataires[prestataireNom.value] : {}
      // merge shallow
      prestataire = { ...prestataire, ...local }
    }

    prestataireInfo.value = prestataire

    // initialiser les éditeurs/structures
    presentationHtml.value = prestataire?.presentationHtml || prestataire?.description || ''
    images.value = prestataire?.images || prestataire?.images || []
    // services: enrichir avec flags si absent
    services.value = (prestataire?.services || []).map(s => ({
      nom: s.nom || '',
      description: s.description || '',
      enabled: s.enabled !== undefined ? s.enabled : true,
      public: s.public !== undefined ? s.public : true,
    }))
    userFields.value = {
      email: prestataire?.email || '',
      tel: prestataire?.tel || '',
      site: prestataire?.site || ''
    }
  } catch (e) {
    prestataireInfo.value = null
  } finally {
    loading.value = false
  }
}

const saveCustomPrestataire = () => {
  if (!prestataireNom.value) return
  let custom = {}
  try {
    const raw = localStorage.getItem('customPrestataires')
    custom = raw ? JSON.parse(raw) : {}
  } catch (e) {
    custom = {}
  }
  custom[prestataireNom.value] = {
    presentationHtml: presentationHtml.value,
    images: images.value,
    services: services.value,
    email: userFields.value.email,
    tel: userFields.value.tel,
    site: userFields.value.site
  }
  localStorage.setItem('customPrestataires', JSON.stringify(custom))
  window.dispatchEvent(new Event('prestataire-updated'))
}

const onImageUpload = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    images.value.unshift({ name: file.name, data: reader.result })
    // Insérer la balise img dans le contenu WYSIWYG à la première position
    presentationHtml.value = `<p><img src="${reader.result}" alt="${file.name}" style="max-width:100%;height:auto"/></p>` + presentationHtml.value
    saveCustomPrestataire()
  }
  reader.readAsDataURL(file)
  // reset input
  e.target.value = ''
}

const removeImage = (index) => {
  images.value.splice(index, 1)
  saveCustomPrestataire()
}

const addService = () => {
  services.value.push({ nom: 'Nouvelle offre', description: '', enabled: true, public: true })
  saveCustomPrestataire()
}

const deleteService = (index) => {
  services.value.splice(index, 1)
  saveCustomPrestataire()
}

const toggleServiceEnabled = (s) => {
  s.enabled = !s.enabled
  saveCustomPrestataire()
}

const toggleServicePublic = (s) => {
  s.public = !s.public
  saveCustomPrestataire()
}

const updateServiceField = () => {
  // appelé via @input sur champs : autosave
  saveCustomPrestataire()
}

const savePresentation = async () => {
  // récupération du HTML depuis contenteditable si présent
  const el = document.getElementById('wysiwyg')
  if (el) presentationHtml.value = el.innerHTML
  saveCustomPrestataire()
  // petite confirmation visuelle (peut être remplacée par toast)
  alert('Présentation sauvegardée.')
}

const saveUserFields = () => {
  saveCustomPrestataire()
  alert('Informations utilisateur sauvegardées.')
}

onMounted(() => {
  loadAuthFromStorage()

  if (!isPrestataire.value) {
    router.push('/login')
    return
  }

  loadPrestataireInfo()
  // notifier parent/sidebar que prestataire chargé (optionnel)
})
</script>

<template>
  <div class="prestataire-page">
    <div v-if="loading" class="loading">
      Chargement...
    </div>

    <div v-else-if="!isPrestataire" class="access-denied">
      <h2>Accès restreint</h2>
      <p>Vous devez être connecté en tant que prestataire pour accéder à cette page.</p>
      <router-link to="/login" class="btn-primary">Se connecter</router-link>
    </div>

    <div v-else-if="prestataireInfo" class="prestataire-content">
      <div class="prestataire-header">
        <h1>Espace Prestataire</h1>
        <p class="welcome">Bienvenue, {{ prestataireNom }}</p>
      </div>

      <!-- two-column layout: menu + content -->
      <div class="admin-layout">
        <aside class="side-menu">
          <ul>
            <li :class="{ active: selectedSection === 'presentation' }" @click="selectedSection = 'presentation'">Présentation (WYSIWYG)</li>
            <li :class="{ active: selectedSection === 'services' }" @click="selectedSection = 'services'">Services (activer / désactiver / supprimer)</li>
            <li :class="{ active: selectedSection === 'config' }" @click="selectedSection = 'config'">Configuration des services</li>
            <li :class="{ active: selectedSection === 'user' }" @click="selectedSection = 'user'">Informations utilisateur</li>
          </ul>
        </aside>

        <section class="main-panel">
          <!-- Présentation WYSIWYG -->
          <div v-if="selectedSection === 'presentation'">
            <h2>Présentation</h2>
            <div class="editor-toolbar">
              <label class="btn small">
                Inserer image
                <input type="file" accept="image/*" @change="onImageUpload" style="display:none" />
              </label>
              <button class="btn small" type="button" @click="() => document.execCommand('bold')">Gras</button>
              <button class="btn small" type="button" @click="() => document.execCommand('italic')">Italic</button>
              <button class="btn small" type="button" @click="() => document.execCommand('insertUnorderedList')">Liste</button>
              <button class="btn small" type="button" @click="savePresentation">Sauvegarder</button>
            </div>

            <div id="wysiwyg" class="wysiwyg" contenteditable="true" v-html="presentationHtml"></div>

            <div class="images-list" v-if="images.length">
              <h3>Images uploadées</h3>
              <div class="thumbs">
                <div class="thumb" v-for="(img, idx) in images" :key="idx">
                  <img :src="img.data" :alt="img.name" />
                  <div class="thumb-meta">
                    <span>{{ img.name }}</span>
                    <button class="btn tiny danger" @click="removeImage(idx)">Supprimer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Services -->
          <div v-if="selectedSection === 'services'">
            <h2>Services</h2>
            <div class="services-actions">
              <button class="btn" @click="addService">Ajouter un service</button>
            </div>
            <div class="service-item" v-for="(s, idx) in services" :key="idx">
              <div class="service-header">
                <input class="input" v-model="s.nom" @input="updateServiceField" />
                <div class="toggles">
                  <label><input type="checkbox" v-model="s.enabled" @change="toggleServiceEnabled(s)" /> Activé</label>
                  <label><input type="checkbox" v-model="s.public" @change="toggleServicePublic(s)" /> Public</label>
                  <button class="btn tiny danger" @click="deleteService(idx)">Supprimer</button>
                </div>
              </div>
              <textarea class="textarea" v-model="s.description" @input="updateServiceField" placeholder="Description du service"></textarea>
            </div>
            <div v-if="!services.length" class="empty">Aucun service défini.</div>
          </div>

          <!-- Configuration -->
          <div v-if="selectedSection === 'config'">
            <h2>Configuration des services</h2>
            <p>Paramètres globaux pour la configuration automatique d'emplacements ou règles de visibilité.</p>
            <div class="config-grid">
              <label>Assignation automatique d'emplacement :
                <select class="input">
                  <option>Non</option>
                  <option>Basée sur nom</option>
                  <option>Basée sur catégorie</option>
                </select>
              </label>
              <label>Visibilité par défaut :
                <select class="input">
                  <option>Public</option>
                  <option>Privé (prestataire seulement)</option>
                </select>
              </label>
              <button class="btn" @click="() => alert('Paramètres sauvegardés (simulation)')">Sauvegarder la configuration</button>
            </div>
          </div>

          <!-- Informations utilisateur -->
          <div v-if="selectedSection === 'user'">
            <h2>Informations utilisateur</h2>
            <div class="form-row">
              <label>Email</label>
              <input class="input" v-model="userFields.email" />
            </div>
            <div class="form-row">
              <label>Téléphone</label>
              <input class="input" v-model="userFields.tel" />
            </div>
            <div class="form-row">
              <label>Site</label>
              <input class="input" v-model="userFields.site" />
            </div>
            <div class="form-actions">
              <button class="btn" @click="saveUserFields">Sauvegarder</button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="no-info">
      <h2>Informations indisponibles</h2>
      <p>Impossible de charger vos informations de prestataire.</p>
    </div>
  </div>
</template>

<style scoped>
.prestataire-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: linear-gradient(180deg, #0b122a 0%, #07103a 100%);
  color: #fff;
}

/* header */
.prestataire-header {
  text-align: center;
  margin-bottom: 20px;
}
.prestataire-header h1 { color: #FCDC1E; margin-bottom: 6px; }
.welcome { color: rgba(255,255,255,0.9) }

/* layout */
.admin-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* side menu */
.side-menu {
  background: rgba(255,255,255,0.03);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(252,220,30,0.08);
}
.side-menu ul { list-style: none; }
.side-menu li {
  padding: 12px 10px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  color: #fff;
  transition: background 0.12s;
}
.side-menu li.active {
  background: #FCDC1E;
  color: #2046b3;
  font-weight: 700;
}

/* main panel */
.main-panel {
  background: rgba(255,255,255,0.03);
  padding: 18px;
  border-radius: 12px;
  border: 1px solid rgba(252,220,30,0.06);
}

/* editor */
.editor-toolbar { display:flex; gap:8px; margin-bottom:12px; align-items:center; flex-wrap:wrap; }
.btn { background:#FCDC1E; color:#2046b3; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; }
.btn.small { padding:6px 8px; font-size:0.9rem; }
.btn.tiny { padding:4px 6px; font-size:0.8rem; }
.btn.danger { background:#d32f2f; color:#fff; }
input.input, textarea.textarea, select.input { width:100%; padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.04); color:#fff; margin-top:6px; }

.wysiwyg {
  min-height: 220px;
  background: #fff;
  color: #000;
  padding: 12px;
  border-radius: 8px;
  overflow:auto;
}

/* images list */
.images-list { margin-top:12px; }
.thumbs { display:flex; gap:12px; flex-wrap:wrap; margin-top:8px; }
.thumb { width:140px; background:#fff; color:#000; border-radius:8px; overflow:hidden; padding:6px; }
.thumb img { width:100%; height:90px; object-fit:cover; display:block; border-radius:6px; }
.thumb-meta { display:flex; justify-content:space-between; align-items:center; margin-top:6px; gap:8px; }

/* services */
.service-item { background: rgba(0,0,0,0.04); padding:12px; border-radius:8px; margin-top:12px; }
.service-header { display:flex; justify-content:space-between; gap:12px; align-items:center; }
.toggles label { margin-left:8px; font-size:0.9rem; color:rgba(255,255,255,0.85); }
.empty { color:rgba(255,255,255,0.7); margin-top:12px; }

/* form */
.form-row { margin-bottom:12px; }
.form-actions { margin-top:12px; }

/* responsive */
@media (max-width: 900px) {
  .admin-layout { grid-template-columns: 1fr; }
  .side-menu { order: 2; }
  .main-panel { order: 1; margin-bottom:12px; }
}
</style>
