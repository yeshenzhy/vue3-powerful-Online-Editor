import type { Router } from 'vue-router'

import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'

const WHITE_LIST = new Set(['/login'])

/**
 * 注册全局路由守卫：白名单、登录、动态路由、页面级权限
 * @param router 根路由实例
 */
export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const user = useUserStore()
    const permission = usePermissionStore()

    if (WHITE_LIST.has(to.path)) {
      if (user.isLoggedIn && to.path === '/login') {
        next({ path: '/' })
        return
      }
      next()
      return
    }

    if (!user.isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
      return
    }

    if (!user.profileLoaded) {
      try {
        await user.fetchUserInfo()
      } catch {
        user.logout()
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    }

    if (!permission.dynamicRouteReady) {
      try {
        await permission.generateRoutes()
      } catch {
        user.logout()
        permission.resetDynamicRoutes()
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
      next({ ...to, replace: true })
      return
    }

    const needPerm = to.meta.permission as string | undefined
    if (needPerm && !user.permissions.includes(needPerm)) {
      next({ path: '/404' })
      return
    }

    next()
  })
}
