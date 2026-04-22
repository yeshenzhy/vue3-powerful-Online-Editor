<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

import { useAuth } from '@/composables/useAuth'

const { signIn } = useAuth()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: '123456',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

/**
 * 恢复默认演示账号
 */
function resetForm() {
  form.username = 'admin'
  form.password = '123456'
  formRef.value?.clearValidate()
}

/**
 * 提交登录
 */
async function onSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await signIn({ username: form.username, password: form.password })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="login-bg">
      <div class="bg-shape bg-shape-1" />
      <div class="bg-shape bg-shape-2" />
      <div class="bg-shape bg-shape-3" />
    </div>

    <div class="login-container">
      <!-- 左侧品牌区 -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="brand-icon">
            <svg viewBox="0 0 128 128" width="64" height="64">
              <path fill="#42b883" d="M78.8,10L64,35.4L49.2,10H0l64,110l64-110C128,10,78.8,10,78.8,10z" />
              <path fill="#35495e" d="M78.8,10L64,35.4L49.2,10H25.6L64,76l38.4-66H78.8z" />
            </svg>
          </div>
          <h1 class="brand-title">Vue3 知识点</h1>
          <p class="brand-desc">深入理解 Vue3 核心概念与最佳实践</p>
          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-dot" />
              <span>Composition API 全解析</span>
            </div>
            <div class="feature-item">
              <span class="feature-dot" />
              <span>响应式原理深度剖析</span>
            </div>
            <div class="feature-item">
              <span class="feature-dot" />
              <span>在线代码演练场</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-wrap">
        <el-card class="login-card" shadow="never">
          <h2 class="title">欢迎回来</h2>
          <p class="subtitle">登录以继续学习之旅</p>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                size="large"
                autocomplete="username"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                autocomplete="current-password"
              />
            </el-form-item>
            <el-form-item class="form-actions-item">
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="submit-btn"
                @click="onSubmit"
              >
                登 录
              </el-button>
            </el-form-item>
          </el-form>

          <div class="login-hint">
            <span class="hint-label">演示账号</span>
            <div class="hint-accounts">
              <span class="hint-account" @click="form.username = 'admin'; form.password = '123456'">
                <code>admin</code>
                <span class="hint-tag">全权限</span>
              </span>
              <span class="hint-account" @click="form.username = 'user'; form.password = '123456'">
                <code>user</code>
                <span class="hint-tag">仅工作台</span>
              </span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.login-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.5;
  filter: blur(60px);
}

.bg-shape-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #22D3EE 0%, #0891B2 100%);
  top: -100px;
  right: -100px;
}

.bg-shape-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #4ADE80 0%, #22C55E 100%);
  bottom: -80px;
  left: -80px;
}

.bg-shape-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #A5F3FC 0%, #67E8F9 100%);
  top: 50%;
  left: 30%;
  transform: translateY(-50%);
}

.login-container {
  display: flex;
  width: 900px;
  max-width: calc(100vw - 48px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(255, 255, 255, 0.5);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* 左侧品牌区 */
.login-brand {
  flex: 1;
  background: linear-gradient(135deg, var(--sidebar-bg) 0%, #1E293B 100%);
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
}

.brand-content {
  max-width: 320px;
}

.brand-icon {
  margin-bottom: 24px;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.brand-desc {
  font-size: 15px;
  color: var(--sidebar-text);
  margin: 0 0 32px;
  line-height: 1.6;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--sidebar-text);
}

.feature-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary-light);
  flex-shrink: 0;
}

/* 右侧登录表单 */
.login-form-wrap {
  flex: 1;
  padding: 48px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 340px;
  border: none;
  box-shadow: none;
  background: transparent;
}

.title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
}

.subtitle {
  margin: 0 0 32px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.form-actions-item {
  margin-top: 8px;
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 500;
  border-radius: var(--radius-md);
}

/* 演示账号提示 */
.login-hint {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-light);
}

.hint-label {
  display: block;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hint-accounts {
  display: flex;
  gap: 12px;
}

.hint-account {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hint-account:hover {
  background: var(--color-primary-bg);
}

.hint-account code {
  font-size: 13px;
  font-weight: 500;
}

.hint-tag {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* 响应式 */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    overflow-y: auto;
  }

  .login-brand {
    padding: 32px 24px;
  }

  .brand-title {
    font-size: 22px;
  }

  .brand-features {
    display: none;
  }

  .login-form-wrap {
    padding: 32px 24px;
  }
}
</style>
