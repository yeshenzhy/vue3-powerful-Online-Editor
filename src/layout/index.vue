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
    <el-aside width="240px" class="layout-aside">
      <!-- Logo 区域 -->
      <div class="logo">
        <svg viewBox="0 0 128 128" class="logo-icon">
          <path fill="#42b883" d="M78.8,10L64,35.4L49.2,10H0l64,110l64-110C128,10,78.8,10,78.8,10z" />
          <path fill="#35495e" d="M78.8,10L64,35.4L49.2,10H25.6L64,76l38.4-66H78.8z" />
        </svg>
        <span class="logo-text">Vue3 知识点</span>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        router
        class="layout-menu"
        :background-color="'transparent'"
        :text-color="'var(--sidebar-text)'"
        :active-text-color="'var(--sidebar-text-active)'"
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

      <!-- 侧边栏底部用户信息 -->
      <div class="sidebar-footer">
        <div class="user-avatar">
          {{ (user.name || user.username || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="user-info">
          <span class="user-name">{{ user.name || user.username }}</span>
          <span class="user-role">{{ user.permissions.length }} 项权限</span>
        </div>
      </div>
    </el-aside>

    <el-container class="layout-body">
      <!-- 顶部导航栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <h1 class="header-title">{{ route.meta.title ?? '' }}</h1>
        </div>
        <div class="header-actions">
          <el-tooltip content="刷新当前页面" placement="bottom">
            <el-button class="action-btn" text @click="refreshView">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </el-button>
          </el-tooltip>
          <el-divider direction="vertical" />
          <el-button class="logout-btn" text @click="handleLogout">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>退出登录</span>
          </el-button>
        </div>
      </el-header>

      <!-- 主内容区 -->
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
/* 整页布局 */
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

/* 侧边栏 */
.layout-aside {
  background: var(--sidebar-bg);
  color: #fff;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--sidebar-border);
}

/* Logo 区域 */
.logo {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.01em;
}

/* 导航菜单 */
.layout-menu {
  flex: 1;
  border-right: none;
  padding: 12px 8px;
  overflow-y: auto;
}

/* 菜单项样式 */
.layout-menu :deep(.el-menu-item),
.layout-menu :deep(.el-sub-menu__title) {
  height: 44px;
  line-height: 44px;
  margin: 2px 0;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.layout-menu :deep(.el-menu-item:hover),
.layout-menu :deep(.el-sub-menu__title:hover) {
  background: var(--sidebar-bg-hover) !important;
}

.layout-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(8, 145, 178, 0.1) 100%) !important;
  color: var(--sidebar-text-active) !important;
  font-weight: 500;
}

.layout-menu :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--color-primary-light);
  border-radius: 0 2px 2px 0;
}

.layout-menu :deep(.el-sub-menu .el-menu) {
  background: transparent !important;
}

.layout-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 52px !important;
}

/* 侧边栏底部用户信息 */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--sidebar-border);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: var(--sidebar-text);
}

/* 顶部导航栏 */
.layout-header {
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  height: 36px;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.logout-btn:hover {
  color: #EF4444;
  background: #FEF2F2;
}

.logout-btn span {
  font-size: 13px;
}

/* Element Plus Divider */
:deep(.el-divider--vertical) {
  height: 20px;
  margin: 0 8px;
  border-color: var(--color-border);
}

/* 主内容区 */
.layout-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  overflow: hidden;
  background: var(--color-bg);
}

.layout-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
