<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const fallbackProducts = [
  {
    id: 'tee-classic',
    name: 'T-shirt logo',
    price: 25,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 32,
    badge: 'Best-seller',
    accent: '#fcdc1e',
    image: '/media/merch/tshirt.jpeg'
  },
  {
    id: 'tee-oversize',
    name: 'T-shirt oversize',
    price: 29,
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 12,
    badge: 'Nouveauté',
    accent: '#a855f7',
    image: '/media/merch/tshirt.jpeg'
  },
  {
    id: 'hoodie',
    name: 'Hoodie premium',
    price: 55,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: 7,
    badge: 'Edition limitée',
    accent: '#0ea5e9',
    image: '/media/merch/hoodie.jpeg'
  },
  {
    id: 'windbreaker',
    name: 'Veste coupe-vent',
    price: 65,
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 18,
    badge: 'Outdoor',
    accent: '#f97316',
    image: '/media/merch/hoodie.jpeg'
  },
  {
    id: 'cap',
    name: 'Casquette 5 panels',
    price: 22,
    sizes: ['Taille unique'],
    stock: 0,
    badge: 'Sold out',
    accent: '#22c55e',
    image: '/media/merch/casquette.jpeg'
  },
  {
    id: 'tote',
    name: 'Tote bag renforcé',
    price: 15,
    sizes: ['38x42 cm'],
    stock: 44,
    badge: 'Essentiel',
    accent: '#eab308',
    image: '/media/merch/tshirt.jpeg'
  }
]

const products = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const displayedProducts = computed(() => products.value)

const formatPrice = (value) => {
  const lang = locale.value === 'en' ? 'en-US' : 'fr-FR'
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

const stockText = (stock) => {
  if (stock === 0) return t('merch.soldOut')
  if (stock <= 5) return t('merch.lowStock', { count: stock })
  return t('merch.inStock')
}

const stockClass = (stock) => {
  if (stock === 0) return 'stock stock-out'
  if (stock <= 5) return 'stock stock-low'
  return 'stock stock-ok'
}

const mediaStyle = (product) => {
  const hasImage = product.image && String(product.image).trim().length > 0
  const accent = product.accent || '#2046b3'
  if (hasImage) {
    return {
      backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%), url(${product.image})`
    }
  }
  return {
    backgroundImage: `linear-gradient(135deg, ${accent} 0%, #2046b3 100%)`
  }
}

const normalizeProducts = (items) => {
  return (items || []).map((item, idx) => {
    const fallback = fallbackProducts[idx] || {}
    return {
      ...fallback,
      ...item,
      accent: item?.accent || fallback.accent || '#2046b3'
    }
  })
}

const fetchProducts = async () => {
  isLoading.value = true
  try {
    const resp = await fetch('/data/merch.json', { cache: 'no-store' })
    if (!resp.ok) throw new Error('fetch failed')
    const data = await resp.json()
    const items = Array.isArray(data.items) ? data.items : []
    const list = items.length ? items : fallbackProducts
    products.value = normalizeProducts(list)
    if (!items.length) {
      errorMessage.value = t('merch.loadError')
    }
  } catch (err) {
    products.value = normalizeProducts(fallbackProducts)
    errorMessage.value = t('merch.loadError')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="merch-page">
    <section class="merch-hero">
      <div class="hero-chip">MERCH</div>
      <h1>{{ t('merch.title') }}</h1>
      <p class="hero-subtitle">{{ t('merch.subtitle') }}</p>
      <div class="hero-meta">
        <span>Click & Collect sur le village</span>
        <span>Textiles responsables</span>
        <span>Quantités limitées</span>
      </div>
      <small v-if="errorMessage" class="hero-error">{{ errorMessage }}</small>
    </section>

    <section class="merch-grid">
      <div v-if="isLoading" class="skeleton-grid">
        <div v-for="n in 6" :key="n" class="merch-card skeleton">
          <div class="skeleton-media"></div>
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-footer">
            <div class="skeleton-pill"></div>
            <div class="skeleton-btn"></div>
          </div>
        </div>
      </div>

      <div v-else-if="displayedProducts.length === 0" class="empty-state">
        <p>{{ t('merch.empty') }}</p>
      </div>

      <div v-else class="grid">
        <article v-for="product in displayedProducts" :key="product.id" class="merch-card">
          <div class="merch-card-media" :style="mediaStyle(product)">
            <span v-if="product.badge" class="badge">{{ product.badge }}</span>
          </div>
          <div class="merch-card-body">
            <header class="card-header">
              <div>
                <h3>{{ product.name }}</h3>
              </div>
              <div class="price-block">
                <small>{{ t('merch.from') }}</small>
                <div class="price">{{ formatPrice(product.price) }}</div>
              </div>
            </header>

            <footer class="card-footer">
              <span :class="stockClass(product.stock)">{{ stockText(product.stock) }}</span>
              <button
                type="button"
                class="cta"
                :disabled="product.stock === 0"
              >
                {{ product.stock === 0 ? t('merch.ctaDisabled') : t('merch.cta') }}
              </button>
            </footer>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.merch-page {
  background: linear-gradient(180deg, #0b1c48 0%, #0c1a3f 16%, #0e1230 100%);
  min-height: 100vh;
  color: #e8ecff;
  padding: 104px 18px 48px;
}

.merch-hero {
  max-width: 1080px;
  margin: 0 auto;
  text-align: center;
  padding: 28px 18px 10px;
}

.hero-chip {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(252, 220, 30, 0.18);
  color: #fcdc1e;
  font-weight: 800;
  letter-spacing: 0.5px;
  font-size: 0.9rem;
}

.merch-hero h1 {
  margin-top: 14px;
  font-size: clamp(2.2rem, 4vw, 2.8rem);
  letter-spacing: -0.5px;
}

.hero-subtitle {
  margin-top: 8px;
  color: #c8d1ff;
  font-size: 1.05rem;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.hero-meta span {
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(252, 220, 30, 0.18);
  color: #f6f7ff;
  font-weight: 600;
  font-size: 0.9rem;
}

.hero-error {
  display: block;
  margin-top: 12px;
  color: #fca5a5;
  font-weight: 700;
}

.merch-grid {
  max-width: 1180px;
  margin: 18px auto 0;
  padding: 0 6px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.merch-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(252, 220, 30, 0.16);
  border-radius: 18px;
  overflow: hidden;
  backdrop-filter: blur(6px);
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.28);
  display: flex;
  flex-direction: column;
}

.merch-card-media {
  height: 150px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(252, 220, 30, 0.6);
  color: #fcdc1e;
  padding: 8px 12px;
  border-radius: 14px;
  font-weight: 800;
  letter-spacing: 0.3px;
  backdrop-filter: blur(6px);
}

.merch-card-body {
  padding: 16px 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.card-header h3 {
  font-size: 1.15rem;
  letter-spacing: -0.2px;
}

.price-block {
  min-width: 110px;
  text-align: right;
}

.price-block small {
  color: #cbd5ff;
  font-weight: 700;
}

.price {
  color: #fcdc1e;
  font-weight: 800;
  font-size: 1.2rem;
}


.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.stock {
  font-weight: 800;
}

.stock-ok {
  color: #86efac;
}

.stock-low {
  color: #fbbf24;
}

.stock-out {
  color: #f87171;
}

.cta {
  border: none;
  background: #fcdc1e;
  color: #0b0f29;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.cta:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(252, 220, 30, 0.22);
}

.cta:disabled {
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.2);
  color: #dbeafe;
  box-shadow: none;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.skeleton {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 14px;
  min-height: 240px;
}

.skeleton::after {
  content: '';
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
  animation: shimmer 1.2s infinite;
}

.skeleton-media {
  height: 120px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
}

.skeleton-line {
  height: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  margin-bottom: 10px;
}

.skeleton-line.wide {
  width: 80%;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.skeleton-pill {
  width: 120px;
  height: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
}

.skeleton-btn {
  width: 100px;
  height: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
}

@keyframes shimmer {
  0% { transform: translateX(0); }
  100% { transform: translateX(250%); }
}

.empty-state {
  text-align: center;
  color: #cbd5ff;
  padding: 40px 0;
  font-weight: 700;
}

@media (max-width: 640px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .price-block {
    text-align: left;
  }
}
</style>
