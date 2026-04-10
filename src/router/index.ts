import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/** 无权限动态注入前的静态路由（登录页等） */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
})
