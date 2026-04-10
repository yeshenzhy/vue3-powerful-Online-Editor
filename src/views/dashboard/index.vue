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

onMounted(refresh)
</script>

<template>
  <div class="dashboard">
    <el-card shadow="never" class="welcome">
      <template #header>
        <span>工作台</span>
      </template>
      <p>你好，{{ user.name }}。</p>
      <p class="sub">当前权限码数量：{{ user.permissions.length }}（菜单 / 页面 / 按钮共用同一套标识）</p>
      <div class="quick">
        <el-button type="primary" :icon="User" @click="goUsers">进入用户管理</el-button>
        <el-button :icon="Key" @click="goRoles">进入角色管理</el-button>
        <el-button :loading="loading" :icon="Refresh" @click="refresh">刷新统计数据</el-button>
      </div>
    </el-card>

    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats?.userCount ?? '—' }}</div>
          <div class="stat-label">用户数量（mock）</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats?.roleCount ?? '—' }}</div>
          <div class="stat-label">角色数量（mock）</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value stat-time">{{ stats?.updatedAt ?? '—' }}</div>
          <div class="stat-label">最近统计时间</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="activity-card">
      <template #header>
        <div class="activity-head">
          <span>最近操作（mock 内存）</span>
          <el-button text type="primary" :loading="loading" @click="refresh">刷新</el-button>
        </div>
      </template>
      <el-empty v-if="!activities.length" description="暂无记录，去用户/角色页操作后会出现在这里" />
      <el-timeline v-else>
        <el-timeline-item v-for="(item, i) in activities" :key="i" :timestamp="item.time" placement="top">
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
  gap: 16px;
}

.sub {
  margin-top: 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.quick {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stats-row {
  width: 100%;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.stat-value.stat-time {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.stat-label {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.activity-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-card :deep(.el-timeline) {
  padding-left: 4px;
}
</style>
