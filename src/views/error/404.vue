<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.replace('/')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-illustration">
        <svg viewBox="0 0 200 200" class="error-svg">
          <circle cx="100" cy="100" r="90" fill="var(--color-primary-bg)" />
          <text x="100" y="115" text-anchor="middle" class="error-code">404</text>
        </svg>
      </div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-desc">抱歉，您访问的页面不存在或暂无权限访问</p>
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          返回上页
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--color-bg);
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-illustration {
  margin-bottom: 32px;
}

.error-svg {
  width: 180px;
  height: 180px;
}

.error-code {
  font-size: 56px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  fill: var(--color-primary);
}

.error-title {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
}

.error-desc {
  margin: 0 0 32px;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.error-actions .el-button {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
