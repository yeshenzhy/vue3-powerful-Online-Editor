/** 与 mock 统一的业务响应结构 */
export interface ApiResponse<T = unknown> {
  /** 0 表示成功 */
  code: number
  data: T
  message: string
}

/** 后端返回的菜单节点（用于动态路由与侧边栏） */
export interface MenuVO {
  /** 路由 path：根布局为 `/`，子路由为相对片段如 `dashboard` */
  path: string
  /** 唯一路由 name，用于 addRoute */
  name: string
  /** 对应 `src/layout` 或 `src/views` 下的组件路径（不含 .vue） */
  component?: string
  redirect?: string
  meta?: import('vue-router').RouteMeta
  children?: MenuVO[]
}
