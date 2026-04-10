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
    <el-card class="login-card" shadow="hover">
      <h2 class="title">管理后台登录</h2>
      <p class="hint">演示账号：<code>admin</code>（全权限）或 <code>user</code>（仅工作台）</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="72px" @submit.prevent>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button type="primary" :loading="loading" class="submit-btn" @click="onSubmit">
              登录
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1d1e1f 0%, #2b2c2f 50%, #141414 100%);
}

.login-card {
  width: 400px;
  padding: 8px 8px 16px;
}

.title {
  margin: 0 0 8px;
  text-align: center;
  font-size: 20px;
}

.hint {
  margin: 0 0 20px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.submit-btn {
  flex: 1;
}
</style>
