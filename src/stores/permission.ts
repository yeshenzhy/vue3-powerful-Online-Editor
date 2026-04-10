import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

import { fetchMenuTreeApi } from '@/api/user'
import type { MenuVO } from '@/types/api'
import { filterMenusByPermission, menusToRoutes } from '@/router/helper'
import { router } from '@/router/index'
import { useUserStore } from '@/stores/user'
import type { RouteRecordRaw } from 'vue-router'

const NOT_FOUND_ROUTE: RouteRecordRaw = {
  path: '/404',
  name: 'NotFoundPage',
  component: () => import('@/views/error/404.vue'),
  meta: { title: '404', hidden: true },
}

/**
 * 动态路由与侧栏菜单数据
 */
export const usePermissionStore = defineStore('permission', () => {
  /** 是否已将接口菜单转为 addRoute */
  const dynamicRouteReady = ref(false)
  /** 过滤后的菜单（侧栏用） */
  const sidebarMenus = shallowRef<MenuVO[]>([])

  /**
   * 拉取菜单、按权限裁剪、addRoute 注册动态路由
   */
  async function generateRoutes() {
    const user = useUserStore()
    const permSet = new Set(user.permissions)
    const raw = await fetchMenuTreeApi()
    const filtered = filterMenusByPermission(raw, permSet)
    sidebarMenus.value = filtered

    const routeList = menusToRoutes(filtered)
    for (const r of routeList) {
      router.addRoute(r)
    }

    router.addRoute(NOT_FOUND_ROUTE)
    router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'CatchAll',
      redirect: '/404',
    })

    dynamicRouteReady.value = true
  }

  /**
   * 退出登录时重置动态路由状态（配合整页刷新可省略，此处保留给扩展）
   */
  function resetDynamicRoutes() {
    dynamicRouteReady.value = false
    sidebarMenus.value = []
  }

  return {
    dynamicRouteReady,
    sidebarMenus,
    generateRoutes,
    resetDynamicRoutes,
  }
})
