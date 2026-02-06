<script setup>
const props = defineProps({
  currentSection: { type: String, default: 'dashboard' },
  adminEmail: { type: String, default: '' }
})
const emit = defineEmits(['change-section'])

const sections = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { id: 'presentation', label: 'Présentation festival', icon: '🎭' },
  { id: 'prestataires', label: 'Gestion prestataires', icon: '🏪' },
  { id: 'programmation', label: 'Programmation', icon: '🎵' },
  { id: 'carte', label: 'Carte interactive', icon: '🗺️' },
  { id: 'statistiques', label: 'Statistiques', icon: '📈' },
  { id: 'users', label: 'Gestion utilisateurs', icon: '👥' },
]
</script>

<template>
  <aside class="admin-sidebar">
    <div class="sidebar-header">
      <div class="logo">⚡ GCF Admin</div>
    </div>

    <div class="admin-info">
      <div class="admin-avatar">👤</div>
      <div class="admin-details">
        <strong>Administrateur</strong>
        <small>{{ adminEmail }}</small>
      </div>
    </div>

    <nav class="sidebar-nav">
      <ul>
        <li v-for="s in sections" :key="s.id">
          <button
            :class="{ active: s.id === currentSection }"
            @click="$emit('change-section', s.id)"
          >
            <span class="icon">{{ s.icon }}</span>
            <span class="label">{{ s.label }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
/* MODIFICATION: Sidebar fixe avec scroll interne */
.admin-sidebar {
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(252, 220, 30, 0.15);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  width: 280px;
  height: 100vh;
  overflow-y: auto;
  z-index: 100;
}

/* AJOUT: Personnaliser la scrollbar de la sidebar */
.admin-sidebar::-webkit-scrollbar {
  width: 6px;
}

.admin-sidebar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.admin-sidebar::-webkit-scrollbar-thumb {
  background: rgba(252, 220, 30, 0.3);
  border-radius: 3px;
}

.admin-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(252, 220, 30, 0.5);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(252, 220, 30, 0.2);
  flex-shrink: 0;
}

.logo {
  color: #FCDC1E;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 1px;
}

.admin-info {
  padding: 20px;
  border-bottom: 1px solid rgba(252, 220, 30, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.admin-avatar {
  width: 48px;
  height: 48px;
  background: rgba(252, 220, 30, 0.15);
  border: 2px solid rgba(252, 220, 30, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.admin-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  min-width: 0;
}

.admin-details strong {
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.95rem;
  font-weight: 700;
}

.admin-details small {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-nav button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: left;
}

.sidebar-nav button:hover {
  background: rgba(252, 220, 30, 0.08);
  color: rgba(255, 255, 255, 0.95);
}

.sidebar-nav button.active {
  background: rgba(252, 220, 30, 0.15);
  color: #FCDC1E;
  border-left: 3px solid #FCDC1E;
}

.sidebar-nav button .icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.sidebar-nav button .label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
