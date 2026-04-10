import { useUserStore } from '@/stores/user'

/**
 * 权限判断（按钮/表格操作等可在脚本中使用）
 */
export function usePermission() {
  const user = useUserStore()

  /**
   * 是否拥有任一权限码
   * @param codes 权限码或列表
   */
  function hasAuth(codes: string | string[]) {
    const list = Array.isArray(codes) ? codes : [codes]
    return list.some((c) => user.permissions.includes(c))
  }

  return { hasAuth }
}
