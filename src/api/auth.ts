import { http } from '@/utils/request'

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResult {
  /** 访问令牌，后续请求放在 Authorization */
  token: string
  username: string
}

/**
 * 登录并获取令牌
 * @param payload 账号密码
 */
export function loginApi(payload: LoginPayload) {
  return http.post<LoginResult>('/auth/login', payload)
}
