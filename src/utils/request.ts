import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'

import { STORAGE_TOKEN_KEY } from '@/constants/storage'

/** 业务层 axios：拦截器已解包为 `data` 字段类型 */
export interface AppHttp {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
}

/** 等待中请求：同 method+url 的新请求会取消上一次（可改为仅记录不取消） */
const pendingControllers = new Map<string, AbortController>()

/**
 * 生成请求唯一键，用于合并取消逻辑
 * @param config axios 配置
 */
function getPendingKey(config: InternalAxiosRequestConfig): string {
  return `${(config.method ?? 'get').toUpperCase()}:${config.url ?? ''}`
}

/**
 * 移除并中止可能存在的同键请求
 * @param config 当前请求配置
 * @param cancelPrevious 是否取消上一次相同请求
 */
function removePending(
  config: InternalAxiosRequestConfig,
  cancelPrevious: boolean,
): void {
  const key = getPendingKey(config)
  const prev = pendingControllers.get(key)
  if (prev && cancelPrevious) {
    prev.abort()
    pendingControllers.delete(key)
  }
}

/**
 * 创建 axios 实例（含拦截器与取消能力）
 * @param options 可选 axios 配置覆盖
 */
function createHttp(options?: Partial<InternalAxiosRequestConfig>): AppHttp {
  const instance = axios.create({
    baseURL: '/api',
    timeout: 15_000,
    ...options,
  })

  instance.interceptors.request.use(
    (config) => {
      /** 默认对重复地址取消上一次；单个请求可 `config.cancelPrevious = false` 关闭 */
      const cancelPrevious = config.cancelPrevious !== false
      removePending(config, cancelPrevious)

      const controller = new AbortController()
      config.signal = controller.signal
      pendingControllers.set(getPendingKey(config), controller)

      const token = localStorage.getItem(STORAGE_TOKEN_KEY)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      pendingControllers.delete(getPendingKey(response.config))
      const payload = response.data as { code: number; data: unknown; message: string }
      if (payload.code !== 0) {
        ElMessage.error(payload.message || '请求失败')
        return Promise.reject(new Error(payload.message))
      }
      // 运行时已解包业务 data；与 Axios默认拦截器签名不一致，故断言
      return payload.data as never
    },
    (error) => {
      if (error.config) {
        pendingControllers.delete(getPendingKey(error.config))
      }
      if (axios.isCancel(error) || error.name === 'CanceledError') {
        return Promise.reject(error)
      }
      const msg =
        error.response?.data?.message ??
        error.message ??
        '网络异常'
      if (error.response?.status === 401) {
        localStorage.removeItem(STORAGE_TOKEN_KEY)
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      } else {
        ElMessage.error(msg)
      }
      return Promise.reject(error)
    },
  )

  return instance as unknown as AppHttp
}

export const http = createHttp()

/**
 * 取消所有进行中的请求（如退出登录时）
 */
export function cancelAllPendingRequests(): void {
  pendingControllers.forEach((c) => c.abort())
  pendingControllers.clear()
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * 为 false 时不取消同 URL 上一请求；默认 true
     */
    cancelPrevious?: boolean
  }
}
