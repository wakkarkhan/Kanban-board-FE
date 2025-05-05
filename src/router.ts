import { createRouter, createWebHistory } from 'vue-router'

const Tasks = () => import('./pages/Tasks.vue')
const Notifications = () => import('./pages/Notifications.vue')
const Settings = () => import('./pages/Settings.vue')

const routes = [
  { path: '/', redirect: '/tasks' },
  { path: '/tasks', component: Tasks },
  { path: '/notifications', component: Notifications },
  { path: '/settings', component: Settings },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router 