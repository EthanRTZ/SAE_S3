<script setup>
const props = defineProps({
  users: { type: Array, default: () => [] }
})

const emit = defineEmits(['select', 'create'])

const selectUser = (user) => {
  emit('select', user)
}

const startCreateUser = () => {
  emit('create')
}
</script>

<template>
  <div class="section-content">
    <div class="section-header">
      <h1 class="section-title">Gestion des utilisateurs</h1>
      <button @click="startCreateUser" class="btn-add-user">
        ➕ Créer un utilisateur
      </button>
    </div>

    <div class="users-config-wrapper">
      <div class="users-intro-card">
        <div class="users-intro-icon">👥</div>
        <div class="users-intro-content">
          <h3>Gérez vos utilisateurs</h3>
          <p>Créez, modifiez et supprimez les comptes utilisateurs du festival. Attribuez les rôles appropriés (Admin, Prestataire, Utilisateur) pour contrôler les accès.</p>
        </div>
      </div>

      <div class="users-stats-row">
        <div class="users-stat-box">
          <div class="users-stat-icon">👥</div>
          <div class="users-stat-details">
            <div class="users-stat-number">{{ users.length }}</div>
            <div class="users-stat-label">Total</div>
          </div>
        </div>
        <div class="users-stat-box">
          <div class="users-stat-icon">👑</div>
          <div class="users-stat-details">
            <div class="users-stat-number">{{ users.filter(u => u.role === 'admin').length }}</div>
            <div class="users-stat-label">Admins</div>
          </div>
        </div>
        <div class="users-stat-box">
          <div class="users-stat-icon">🏢</div>
          <div class="users-stat-details">
            <div class="users-stat-number">{{ users.filter(u => u.role === 'prestataire').length }}</div>
            <div class="users-stat-label">Prestataires</div>
          </div>
        </div>
        <div class="users-stat-box">
          <div class="users-stat-icon">👤</div>
          <div class="users-stat-details">
            <div class="users-stat-number">{{ users.filter(u => u.role === 'user').length }}</div>
            <div class="users-stat-label">Utilisateurs</div>
          </div>
        </div>
      </div>

      <div v-if="users.length > 0" class="users-list-container">
        <h3 class="users-list-title">Liste des utilisateurs</h3>
        <div class="users-list">
          <div
            v-for="(user, index) in users"
            :key="`user-${user.email || index}`"
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

      <div v-else class="no-users-message">
        <div class="no-users-icon">⚠️</div>
        <h3>Aucun utilisateur trouvé</h3>
        <p>Aucun utilisateur n'est enregistré dans le système.</p>
        <button @click="startCreateUser" class="btn-add-first-user">
          ➕ Créer le premier utilisateur
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-config-wrapper {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.users-intro-card {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.users-intro-icon {
  font-size: 3.5rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.2));
  border-radius: 20px;
  border: 2px solid rgba(59, 130, 246, 0.4);
  flex-shrink: 0;
}

.users-intro-content {
  flex: 1;
}

.users-intro-content h3 {
  color: var(--blue);
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.users-intro-content p {
  color: var(--text);
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
}

.users-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.users-stat-box {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.users-stat-box:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--blue);
}

.users-stat-icon {
  font-size: 2.5rem;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.15));
  border-radius: 16px;
  border: 2px solid rgba(59, 130, 246, 0.35);
  flex-shrink: 0;
}

.users-stat-details {
  flex: 1;
}

.users-stat-number {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--blue);
  line-height: 1;
  margin-bottom: 6px;
}

.users-stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.users-list-container {
  margin-top: 12px;
}

.users-list-title {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.user-item:hover {
  transform: translateY(-4px);
  border-color: var(--blue);
  box-shadow: var(--shadow-lg);
}

.user-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.15));
  border-radius: 16px;
  border: 2px solid rgba(59, 130, 246, 0.35);
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-email {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.user-role-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.user-prestataire {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
}

.arrow {
  font-size: 1.5rem;
  color: var(--blue);
  font-weight: 700;
  transition: transform 0.3s ease;
}

.user-item:hover .arrow {
  transform: translateX(6px);
}

.no-users-message {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
}

.no-users-icon {
  font-size: 5rem;
  opacity: 0.5;
  display: block;
  margin-bottom: 20px;
}

.no-users-message h3 {
  color: #ef4444;
  margin: 0 0 12px 0;
  font-size: 1.5rem;
  font-weight: 800;
}

.no-users-message p {
  color: rgba(226, 232, 240, 0.8);
  margin: 0 0 24px 0;
  font-size: 1rem;
}

.btn-add-first-user {
  background: linear-gradient(135deg, var(--blue) 0%, #2563eb 100%);
  border: none;
  color: #fff;
  padding: 14px 32px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.btn-add-first-user:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);
}
</style>
