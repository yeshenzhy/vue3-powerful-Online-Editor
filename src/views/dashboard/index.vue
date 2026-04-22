<script setup lang="ts">
import { User, Key, Refresh } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { fetchDashboardActivitiesApi, fetchDashboardStatsApi, type DashboardActivity, type DashboardStats } from '@/api/dashboard'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const user = useUserStore()

const stats = ref<DashboardStats | null>(null)
const activities = ref<DashboardActivity[]>([])
const loading = ref(false)

/** 根据时间返回问候语 */
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

async function refresh() {
  loading.value = true
  try {
    const [s, a] = await Promise.all([fetchDashboardStatsApi(), fetchDashboardActivitiesApi()])
    stats.value = s
    activities.value = a
  } finally {
    loading.value = false
  }
}

function goUsers() {
  router.push('/system/user')
}

function goRoles() {
  router.push('/system/role')
}

function goPlayground() {
  router.push('/vue3-knowledge')
}

onMounted(refresh)
</script>

<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <span class="welcome-greeting">{{ getGreeting() }}，</span>
          <span class="welcome-name">{{ user.name || user.username }}</span>
        </div>
        <p class="welcome-desc">
          欢迎回到 Vue3 知识点学习平台，继续你的学习之旅吧！
        </p>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" size="large" class="action-primary" @click="goPlayground">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          进入代码演练场
        </el-button>
        <el-button size="large" :loading="loading" @click="refresh">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-card--users">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.userCount ?? '—' }}</div>
          <div class="stat-label">用户数量</div>
        </div>
        <div class="stat-action" @click="goUsers">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      </div>

      <div class="stat-card stat-card--roles">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.roleCount ?? '—' }}</div>
          <div class="stat-label">角色数量</div>
        </div>
        <div class="stat-action" @click="goRoles">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      </div>

      <div class="stat-card stat-card--perms">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ user.permissions.length }}</div>
          <div class="stat-label">当前权限数</div>
        </div>
      </div>

      <div class="stat-card stat-card--time">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value stat-value--small">{{ stats?.updatedAt ?? '—' }}</div>
          <div class="stat-label">最近更新时间</div>
        </div>
      </div>
    </div>

    <!-- 最近操作 -->
    <el-card class="activity-card" shadow="never">
      <template #header>
        <div class="activity-header">
          <div class="activity-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>最近操作</span>
          </div>
          <el-button text type="primary" size="small" :loading="loading" @click="refresh">
            刷新
          </el-button>
        </div>
      </template>
      <el-empty v-if="!activities.length" description="暂无记录，去用户/角色页操作后会出现在这里" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="(item, i) in activities"
          :key="i"
          :timestamp="item.time"
          placement="top"
          :hollow="true"
          color="var(--color-primary)"
        >
          {{ item.text }}
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 欢迎区域 */
.welcome-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  padding: 28px 32px;
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-primary-bg) 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}

.welcome-content {
  flex: 1;
  min-width: 280px;
}

.welcome-text {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.welcome-greeting {
  color: var(--color-text-secondary);
  font-weight: 400;
}

.welcome-name {
  color: var(--color-primary);
}

.welcome-desc {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.welcome-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-primary {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  border-color: var(--color-border);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card--users .stat-icon {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  color: #2563EB;
}

.stat-card--roles .stat-icon {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  color: #D97706;
}

.stat-card--perms .stat-icon {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #059669;
}

.stat-card--time .stat-icon {
  background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%);
  color: #4F46E5;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  font-family: 'JetBrains Mono', monospace;
}

.stat-value--small {
  font-size: 14px;
  font-weight: 500;
}

.stat-label {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.stat-action {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.stat-action:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

/* 最近操作 */
.activity-card {
  background: var(--color-bg-elevated);
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--color-text);
}

.activity-title svg {
  color: var(--color-primary);
}

.activity-card :deep(.el-timeline) {
  padding-left: 4px;
}

.activity-card :deep(.el-timeline-item__content) {
  color: var(--color-text);
}

.activity-card :deep(.el-timeline-item__timestamp) {
  color: var(--color-text-muted);
}

/* 响应式 */
@media (max-width: 640px) {
  .welcome-section {
    padding: 20px;
  }

  .welcome-text {
    font-size: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
