import { createRouter, createWebHistory } from 'vue-router'
import HomeView from "@/views/HomeView.vue";
import PrestataireView from "@/views/PrestataireView.vue";
import EspacePrestataireView from "@/views/prestataire/PrestataireView.vue";
import ProgrammationView from "@/views/ProgrammationView.vue";
import CarteView from "@/views/CarteView.vue";
import ReservationView from "@/views/ReservationView.vue";
import MesReservationsView from "@/views/MesReservationsView.vue";
import RegisterView from "@/views/RegisterView.vue";
import AdminView from "@/views/admin/AdminView.vue";
import PanierView from "@/views/PanierView.vue";
import PaymentView from "@/views/PaymentView.vue";
import MerchView from "@/views/MerchView.vue";
import AvisView from "@/views/AvisView.vue";
import { useAuthStore } from '@/stores/auth.js';

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
    },
    {
        path: '/programmation',
        name: 'programmation',
        component: ProgrammationView,
    },
    {
        path: '/prestataire',
        name: 'prestataire',
        component: PrestataireView,
    },
    {
        path: '/prestataire-espace',
        name: 'prestataire-espace',
        component: EspacePrestataireView,
    },
    {
        path: '/prestataire/:nom',
        name: 'prestataire-detail',
        component: () => import('@/views/PrestataireDetailView.vue')
    },
    {
        path: '/carte',
        name: 'carte',
        component: CarteView,
    },
    {
        path: '/reservation',
        name: 'reservation',
        component: ReservationView,
    },
    {
        path: '/mes-reservations',
        name: 'mes-reservations',
        component: MesReservationsView,
    },
    {
        path: '/panier',
        name: 'panier',
        component: PanierView,
    },
    {
        path: '/payment',
        name: 'payment',
        component: PaymentView,
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue')
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterView
    },
    {
        path: '/profile',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue')
    },
    {
        path: '/admin',
        name: 'admin',
        component: AdminView,
        meta: { requiresAdmin: true },
    },
    {
        path: '/avis',
        name: 'avis',
        component: AvisView
    },
    {
        path: '/merch',
        name: 'merch',
        component: MerchView,
    },
    {
        path: '/services/:type',
        name: 'services-by-type',
        component: () => import('@/views/ServicesByTypeView.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        redirect: '/'
    }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAdmin) {
    const auth = useAuthStore()
    // Toujours recharger depuis le localStorage pour avoir les données les plus récentes
    auth.loadFromStorage()
    if (!auth.isAdmin) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }
  }
  next()
})

export default router
