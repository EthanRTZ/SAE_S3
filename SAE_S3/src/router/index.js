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
import AvisView from "@/views/AvisView.vue";
import TestBackendView from "@/views/TestBackendView.vue";

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
    },
    {
        path: '/test-backend',
        name: 'test-backend',
        component: TestBackendView,
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
    },
    {
        path: '/avis',
        name: 'avis',
        component: AvisView
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

export default router
