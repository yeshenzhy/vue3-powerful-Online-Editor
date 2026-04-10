import { http } from '@/utils/request'

export interface RoleRow {
  id: number
  name: string
  code: string
}

export interface RoleFormPayload {
  name: string
  code: string
}

/**
 * 角色列表（mock）
 */
export function fetchRoleListApi() {
  return http.get<RoleRow[]>('/system/roles')
}

/**
 * 新增角色
 * @param data 表单
 */
export function createRoleApi(data: RoleFormPayload) {
  return http.post<RoleRow>('/system/roles', data)
}

/**
 * 更新角色
 * @param id 主键
 * @param data 表单
 */
export function updateRoleApi(id: number, data: RoleFormPayload) {
  return http.put<RoleRow>(`/system/roles/${id}`, data)
}

/**
 * 删除角色
 * @param id 主键
 */
export function deleteRoleApi(id: number) {
  return http.delete<RoleRow[]>(`/system/roles/${id}`)
}
