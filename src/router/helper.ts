import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

import type { MenuVO } from '@/types/api'

const layoutGlobs = import.meta.glob<{ default: Component }>('../layout/**/*.vue')
const viewGlobs = import.meta.glob<{ default: Component }>('../views/**/*.vue')

const allComponentLoaders: Record<string, () => Promise<{ default: Component }>> = {}

for (const [fullPath, loader] of Object.entries({ ...layoutGlobs, ...viewGlobs })) {
  /**
   * glob 得到 `../views/dashboard/index.vue` → `views/dashboard/index`
   * 菜单里写的是 `dashboard/index`，需同时注册去掉 `views/` 的别名
   */
  const key = fullPath
    .replace(/^\.\.\//, '')
    .replace(/\\/g, '/')
    .replace(/\.vue$/, '')
  const load = loader as () => Promise<{ default: Component }>
  allComponentLoaders[key] = load
  if (key.startsWith('views/')) {
    allComponentLoaders[key.slice('views/'.length)] = load
  }
}

/**
 * 按菜单中的 component 路径解析异步组件
 * @param componentPath layout或 views 下相对路径（不含 .vue）
 */
export function resolveAsyncComponent(componentPath: string) {
  const loader = allComponentLoaders[componentPath]
  if (!loader) {
    console.error('[router] 未注册组件路径:', componentPath)
    return () => import('@/views/error/404.vue')
  }
  return loader
}

/**
 * 将后端菜单转为 vue-router 配置（配合 addRoute）
 * @param menus 已按权限过滤后的菜单树
 */
export function menusToRoutes(menus: MenuVO[]): RouteRecordRaw[] {
  return menus.map((m) => toRouteRecord(m))
}

function toRouteRecord(menu: MenuVO): RouteRecordRaw {
  const path =
    menu.path === '/' ? '/' : menu.path.startsWith('/') ? menu.path.slice(1) : menu.path

  const record = {
    path,
    name: menu.name,
    meta: menu.meta ?? {},
  } as RouteRecordRaw

  if (menu.redirect) {
    record.redirect = menu.redirect
  }
  if (menu.component) {
    record.component = resolveAsyncComponent(menu.component)
  }
  if (menu.children?.length) {
    record.children = menu.children.map(toRouteRecord)
  }

  return record
}

/**
 * 按权限码递归过滤菜单（菜单级 + 页面级：无权限的节点不出现在侧栏与路由中）
 * @param menus 原始菜单
 * @param permSet 用户权限集合
 */
export function filterMenusByPermission(menus: MenuVO[], permSet: Set<string>): MenuVO[] {
  const out: MenuVO[] = []
  for (const item of menus) {
    const need = item.meta?.permission
    const passSelf = !need || permSet.has(need)
    const children = item.children?.length
      ? filterMenusByPermission(item.children, permSet)
      : undefined

    if (children?.length) {
      out.push({ ...item, children })
    } else if (passSelf && (!item.children || item.children.length === 0)) {
      out.push({ ...item })
    }
  }
  return out
}
