import { useRouter } from 'vue-router'

import type { LoginPayload } from '@/api/auth'
import { useUserStore } from '@/stores/user'

/**
 * 登录、退出等与身份相关的组合式函数
 */
export function useAuth() {
  const router = useRouter()
  const user = useUserStore()

  /**
   * 登录后整页跳转，避免动态路由重复 addRoute
   * @param payload 表单
   */
  async function signIn(payload: LoginPayload) {
    await user.login(payload)
    const q = router.currentRoute.value.query.redirect as string | undefined
    const target = q && q.startsWith('/') ? q : '/'
    window.location.replace(target)
  }

  /**
   * 退出并跳转登录页
   */
  function signOut() {
    user.logout()
    window.location.replace('/login')
  }

  return {
    signIn,
    signOut,
  }
}
