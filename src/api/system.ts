import { http } from '@/utils/request'

export interface SystemUserRow {
  id: number
  name: string
  role: string
}

export interface UserFormPayload {
  name: string
  role: string
}

/**
 * 用户列表（mock）
 */
export function fetchUserListApi() {
  return http.get<SystemUserRow[]>('/system/users')
}

/**
 * 新增用户
 * @param data 表单
 */
export function createUserApi(data: UserFormPayload) {
  return http.post<SystemUserRow>('/system/users', data)
}

/**
 * 更新用户
 * @param id 主键
 * @param data 表单
 */
export function updateUserApi(id: number, data: UserFormPayload) {
  return http.put<SystemUserRow>(`/system/users/${id}`, data)
}

/**
 * 删除用户
 * @param id 主键
 */
export function deleteUserApi(id: number) {
  return http.delete<SystemUserRow[]>(`/system/users/${id}`)
}

/**
 * 批量修改角色
 * @param payload ids 与目标角色名
 */
export function batchUpdateUserRoleApi(payload: { ids: number[]; role: string }) {
  return http.post<SystemUserRow[]>('/system/users/batch', payload)
}

/**
 * 批量删除用户
 * @param payload 选中 id
 */
export function batchDeleteUsersApi(payload: { ids: number[] }) {
  return http.post<SystemUserRow[]>('/system/users/delete-batch', payload)
}
