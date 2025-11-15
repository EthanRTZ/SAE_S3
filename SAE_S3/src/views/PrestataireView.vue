<template>
  <div class="prestataire">
    <div class="container">
      <h1 class="title">Prestataires</h1>

      <div class="cards">
        <div v-for="p in prestataires" :key="p.nom" class="card">
          <div class="card-header">
            <h2 class="card-title">{{ p.nom }}</h2>
            <span class="badge">{{ p.type }}</span>
          </div>
          <p class="description">{{ p.description }}</p>

          <div v-if="p.services && p.services.length" class="services">
            <h3>Services</h3>
            <ul>
              <li v-for="s in p.services" :key="s.nom">
                <span class="service-name">{{ s.nom }}</span>
                <span v-if="s.description" class="service-desc">— {{ s.description }}</span>
                <span v-if="s.prix !== null && s.prix !== undefined" class="service-price"> ({{ formatPrix(s.prix) }})</span>
              </li>
            </ul>
          </div>

          <div class="contacts">
            <a v-if="p.site" :href="p.site" target="_blank" rel="noopener" class="link">Site web</a>
            <a v-if="p.email" :href="`mailto:${p.email}`" class="link">{{ p.email }}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script>
export default {
  name: 'PrestataireView',
  data() {
    return {
      prestataires: [
        {
          nom: 'OTacos',
          type: 'Restauration rapide / Street-food',
          description: 'Enseigne française présente parmi les stands food & beverage du festival.',
          email: 'contact@otacos.com',
          tel: '+33 1 23 45 67 89',
          site: 'https://o-tacos.com',
          services: [
            { nom: 'Tacos & Burgers', description: 'Restauration rapide pour festivaliers', prix: 10.00 }
          ]
        },
        {
          nom: 'Free',
          type: 'Télécommunications',
          description: 'Opérateur télécom partenaire du festival pour la couverture réseau.',
          email: 'partenariat@free.fr',
          tel: '+33 1 98 76 54 32',
          site: 'https://free.fr',
          services: [
            { nom: 'Réseau 5G', description: 'Connexion mobile et Wi-Fi sur site', prix: 0.00 }
          ]
        },
        {
          nom: 'Allianz',
          type: 'Assurance / Prévention',
          description: 'Partenaire prévention et sécurité du festival.',
          email: 'contact@allianz.fr',
          tel: '+33 1 45 67 89 10',
          site: 'https://allianz.fr',
          services: [
            { nom: 'Sécurité & prévention', description: 'Sensibilisation sécurité routière et alcool', prix: 0.00 }
          ]
        },
        {
          nom: 'Poliakov',
          type: 'Boissons / Spiritueux',
          description: 'Sponsor officiel du bar principal du Golden Coast.',
          email: 'contact@poliakov.fr',
          tel: '+33 1 56 98 45 32',
          site: 'https://poliakov.fr',
          services: [
            { nom: 'Bar principal', description: 'Espace boisson et cocktails', prix: 12.00 }
          ]
        },
        {
          nom: 'Jack Daniel’s',
          type: 'Boissons / Spiritueux',
          description: 'Partenaire officiel du Golden Coast avec un bar éphémère.',
          email: 'contact@jackdaniels.com',
          tel: '+33 1 87 65 43 21',
          site: 'https://jackdaniels.com',
          services: [
            { nom: 'Dégustation whisky', description: 'Espace promotion Jack Daniel’s', prix: 15.00 }
          ]
        },
        {
          nom: 'Red Bull',
          type: 'Boissons énergisantes',
          description: 'Partenaire énergie et animation du festival.',
          email: 'info@redbull.com',
          tel: '+43 1 87 65 90 12',
          site: 'https://redbull.com',
          services: [
            { nom: 'Bar Red Bull', description: 'Boissons énergisantes et espace détente', prix: 8.00 }
          ]
        }
      ]
    }
  },
  methods: {
    formatPrix(val) {
      if (val === 0) return 'gratuit';
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
    }
  }
}
</script>

<style scoped>
.prestataire {
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0011E2 0%, #000428 100%);
  padding: 88px 16px 24px; /* espace sous la navbar fixe */
}

.container {
  max-width: 1100px;
  margin: 0 auto;
}

.title {
  color: #FCDC1E;
  font-size: 2.4rem;
  margin-bottom: 18px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media screen and (max-width: 980px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}
@media screen and (max-width: 640px) {
  .cards { grid-template-columns: 1fr; }
}

.card {
  border: 2px solid #FCDC1E;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  box-shadow: 0 6px 12px rgba(32, 70, 179, 0.06);
}

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.card-title {
  color: #2046b3;
  font-size: 1.25rem;
}

.badge {
  background: #FCDC1E;
  color: #2046b3;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.description {
  color: #333;
  margin-bottom: 10px;
}

.services h3 {
  font-size: 1rem;
  color: #2046b3;
  margin: 8px 0 6px;
}

.services ul {
  list-style: none;
}

.services li {
  margin: 4px 0;
}

.service-name { font-weight: 600; }
.service-desc { color: #555; }
.service-price { color: #2046b3; font-weight: 600; }

.contacts {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.link {
  color: #2046b3;
  text-decoration: none;
  font-weight: 700;
  border: 2px solid #2046b3;
  padding: 6px 10px;
  border-radius: 10px;
  transition: all 0.12s ease;
}
.link:hover {
  color: #2046b3;
  background: #FCDC1E;
  border-color: #FCDC1E;
}
</style>
