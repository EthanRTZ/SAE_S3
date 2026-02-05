<script setup>
// Props: liste d'utilisateurs
const props = defineProps({
  users: { type: Array, default: () => [] }
})

// Emits: select(email), create()
const emit = defineEmits(['select', 'create'])

const onSelect = (user) => emit('select', user?.email)
const onCreate = () => emit('create')
</script>

<template>
  <section class="admin-users">
    <header class="section-header">
      <div>
        <h2>👥 Utilisateurs</h2>
        <p class="section-description">{{ users.length }} utilisateur(s)</p>
      </div>
      <button class="btn-primary" @click="onCreate">➕ Créer un utilisateur</button>
    </header>
    <ul class="list">
      <li v-for="u in users" :key="u.email" @click="onSelect(u)" class="list-item">
        <div class="user-info">
          <strong class="user-email">{{ u.email }}</strong>
          <small class="user-role">{{ u.role }}</small>
        </div>
        <div class="user-badge" :class="`badge-${u.role}`">{{ u.role }}</div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.admin-users {
  padding: 28px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(252, 220, 30, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(252, 220, 30, 0.2);
}

.section-header h2 {
  color: #FCDC1E;
  font-size: 1.8rem;
  margin: 0 0 8px 0;
  font-weight: 800;
}

.section-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  margin: 0;
}

.btn-primary {
  background: linear-gradient(135deg, #FCDC1E 0%, #ffe676 100%);
  color: #0a0a0a;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #ffe676;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(252, 220, 30, 0.4);
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.list-item:hover {
  background: rgba(252, 220, 30, 0.08);
  border-color: rgba(252, 220, 30, 0.3);
  transform: translateX(4px);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-email {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  font-weight: 700;
}

.user-role {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.user-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-admin {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.4);
}

.badge-user {
  background: rgba(33, 150, 243, 0.15);
  color: #2196F3;
  border: 1px solid rgba(33, 150, 243, 0.4);
}

.badge-prestataire {
  background: rgba(156, 39, 176, 0.15);
  color: #9C27B0;
  border: 1px solid rgba(156, 39, 176, 0.4);
}
</style>
