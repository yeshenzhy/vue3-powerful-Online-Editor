import { http } from '@/utils/request'

export interface DashboardStats {
  /** 用户表行数 */
  userCount: number
  /** 角色表行数 */
  roleCount: number
  /** 服务端统计时间（mock） */
  updatedAt: string
}

export interface DashboardActivity {
  time: string
  text: string
}

/**
 * 工作台统计卡片数据
 */
export function fetchDashboardStatsApi() {
  return http.get<DashboardStats>('/dashboard/stats')
}

/**
 * 最近操作记录（mock 内存）
 */
export function fetchDashboardActivitiesApi() {
  return http.get<DashboardActivity[]>('/dashboard/activities')
}
