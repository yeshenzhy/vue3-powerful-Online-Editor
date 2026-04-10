import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 菜单与页签标题 */
    title?: string
    /** 侧边栏图标名，对应 @element-plus/icons-vue 导出名称 */
    icon?: string
    /** 为 true 时不显示在侧边菜单 */
    hidden?: boolean
    /** 页面级权限：无该权限不可访问路由 */
    permission?: string
    /** 按钮级权限码说明（由后端/菜单返回，实际校验用用户 permissions 列表） */
    buttons?: string[]
  }
}

export {}
