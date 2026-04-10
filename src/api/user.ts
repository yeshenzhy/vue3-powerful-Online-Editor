import type { MenuVO } from '@/types/api'
import { http } from '@/utils/request'

export interface UserInfo {
  /** 展示名称 */
  name: string
  /** 头像地址（mock 可为空） */
  avatar: string
  /** 账号 */
  username: string
  /** 权限码：菜单 + 页面 + 按钮统一使用字符串 */
  permissions: string[]
}

/**
 * 当前用户信息与权限列表
 */
export function fetchUserInfoApi() {
  return http.get<UserInfo>('/user/info')
}

/**
 * 服务端菜单树（动态路由与侧边栏数据源）
 */
export function fetchMenuTreeApi() {
  return http.get<MenuVO[]>('/user/menus')
}
