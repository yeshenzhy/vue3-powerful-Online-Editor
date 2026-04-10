<script setup lang="ts">
import { Key, Odometer, Reading, Setting, User } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'
import type { MenuVO } from '@/types/api'

const route = useRoute()
/** 与 fullPath 组合，用于强制重挂载当前页以重新请求数据 */
const viewKey = ref(0)
const user = useUserStore()
const permission = usePermissionStore()

/** 图标名与 Element Plus 图标组件映射 */
const iconMap: Record<string, typeof Odometer> = {
  Odometer,
  Reading,
  Setting,
  User,
  Key,
}

const activeMenu = computed(() => route.path)

const sidebarMenus = computed(() => permission.sidebarMenus)

/**
 * 侧栏展示的菜单（根布局下的子节点）
 */
const rootChildren = computed(() => {
  const roots = sidebarMenus.value
  if (!roots.length) return []
  const first = roots[0]
  return first?.children ?? []
})

/**
 * 退出登录：清空状态并整页进入登录页，避免动态路由残留
 */
function handleLogout() {
  user.logout()
  permission.resetDynamicRoutes()
  window.location.replace('/login')
}

/**
 * 重新加载当前路由视图（刷新业务数据）
 */
function refreshView() {
  viewKey.value += 1
}

/**
 * 递归渲染子菜单
 * @param items 菜单项
 */
function menuChildrenOf(items: MenuVO[]): MenuVO[] {
  return items
}

/**
 * 解析菜单项是否有可见子级
 * @param item 节点
 */
function hasVisibleChildren(item: MenuVO) {
  return Boolean(item.children?.length)
}

/**
 * 将片段转为绝对路径（与 vue-router 一致）
 * @param segment 菜单 path 字段
 */
function fullPath(segment: string) {
  if (segment === '/' || segment.startsWith('/')) return segment || '/'
  return `/${segment}`
}

/**
 * 拼接父级与子级 path
 * @param parent 父 path
 * @param child 子 path
 */
function joinPath(parent: string, child: string) {
  const base = parent === '/' ? '' : fullPath(parent)
  const c = child.startsWith('/') ? child : `/${child}`
  return `${base}${c}`
}
</script>

<template>
  <el-container class="layout-root">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">Vue3 Admin</div>
      <el-menu
        :default-active="activeMenu"
        router
        class="layout-menu"
        background-color="#1d1e1f"
        text-color="#cfd3dc"
        active-text-color="#409eff"
      >
        <template v-for="item in rootChildren" :key="item.name">
          <el-sub-menu v-if="hasVisibleChildren(item)" :index="fullPath(item.path)">
            <template #title>
              <el-icon v-if="item.meta?.icon && iconMap[item.meta.icon]">
                <component :is="iconMap[item.meta.icon]" />
              </el-icon>
              <span>{{ item.meta?.title ?? item.name }}</span>
            </template>
            <el-menu-item
              v-for="child in menuChildrenOf(item.children!)"
              :key="child.name"
              :index="joinPath(item.path, child.path)"
            >
              <el-icon v-if="child.meta?.icon && iconMap[child.meta.icon]">
                <component :is="iconMap[child.meta.icon]" />
              </el-icon>
              <template #title>{{ child.meta?.title ?? child.name }}</template>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="fullPath(item.path)">
            <el-icon v-if="item.meta?.icon && iconMap[item.meta.icon]">
              <component :is="iconMap[item.meta.icon]" />
            </el-icon>
            <template #title>{{ item.meta?.title ?? item.name }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container class="layout-body">
      <el-header class="layout-header">
        <span class="header-title">{{ route.meta.title ?? '' }}</span>
        <div class="header-actions">
          <el-button type="primary" link @click="refreshView">刷新页面</el-button>
          <span class="user-name">{{ user.name || user.username }}</span>
          <el-button type="primary" link @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <div class="layout-view">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="`${route.fullPath}-${viewKey}`" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
/** 整页一屏高度，超出在 .layout-view 内纵向滚动 */
.layout-root {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.layout-body {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.layout-aside {
  background: #1d1e1f;
  color: #fff;
  overflow-y: auto;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.layout-menu {
  border-right: none;
  background: transparent;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-title {
  font-size: 16px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  color: var(--el-text-color-secondary);
}

.layout-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.layout-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
