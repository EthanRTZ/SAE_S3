import { createRouter, createWebHistory } from 'vue-router'
import HomeView from "@/views/HomeView.vue";
import PrestataireView from "@/views/PrestataireView.vue";
import ProgrammationView from "@/views/ProgrammationView.vue";
import CarteView from "@/views/CarteView.vue";
import ReservationView from "@/views/ReservationView.vue";
import RegisterView from "@/views/RegisterView.vue";

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
