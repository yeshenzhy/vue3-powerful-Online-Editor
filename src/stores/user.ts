import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { loginApi, type LoginPayload } from '@/api/auth'
import { fetchUserInfoApi } from '@/api/user'
import { STORAGE_TOKEN_KEY } from '@/constants/storage'
import { cancelAllPendingRequests } from '@/utils/request'

/**
 * 用户与登录态
 */
export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(STORAGE_TOKEN_KEY) ?? '')
  const name = ref('')
  const avatar = ref('')
  const username = ref('')
  const permissions = ref<string[]>([])
  /** 是否已拉取过用户信息（刷新页后需重新拉取） */
  const profileLoaded = ref(false)

  const isLoggedIn = computed(() => Boolean(token.value))

  /**
   * 持久化 token
   * @param raw 登录接口返回的 token
   */
  function setToken(raw: string) {
    token.value = raw
    localStorage.setItem(STORAGE_TOKEN_KEY, raw)
  }

  /**
   * 清空登录态与本地缓存
   */
  function clearSession() {
    token.value = ''
    name.value = ''
    avatar.value = ''
    username.value = ''
    permissions.value = []
    profileLoaded.value = false
    localStorage.removeItem(STORAGE_TOKEN_KEY)
  }

  /**
   * 登录
   * @param payload 表单
   */
  async function login(payload: LoginPayload) {
    const data = await loginApi(payload)
    setToken(data.token)
    username.value = data.username
    await fetchUserInfo()
  }

  /**
   * 拉取用户权限等信息
   */
  async function fetchUserInfo() {
    if (!token.value) return
    const data = await fetchUserInfoApi()
    name.value = data.name
    avatar.value = data.avatar
    username.value = data.username
    permissions.value = data.permissions
    profileLoaded.value = true
  }

  /**
   * 退出并取消未完成请求
   */
  function logout() {
    cancelAllPendingRequests()
    clearSession()
  }

  return {
    token,
    name,
    avatar,
    username,
    permissions,
    profileLoaded,
    isLoggedIn,
    setToken,
    clearSession,
    login,
    fetchUserInfo,
    logout,
  }
})
