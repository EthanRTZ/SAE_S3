import { createRouter, createWebHistory } from 'vue-router'
import HomeView from "@/views/HomeView.vue";
import InformationView from "@/views/InformationView.vue";
import PrestataireView from "@/views/PrestataireView.vue";
//import ProgrammationView from "@/views/ProgrammationView.vue";
import CarteView from "@/views/CarteView.vue";
import ReservationView from "@/views/ReservationView.vue";

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
    },
    /*{
        path: '/programmation',
        name: 'programmation',
        component: ProgrammationView,
    },*/
    {
        path: '/information',
        name: 'information',
        component: InformationView,
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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
