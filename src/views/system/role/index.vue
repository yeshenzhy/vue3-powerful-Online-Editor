<script setup lang="ts">
import { Key } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

import {
  createRoleApi,
  deleteRoleApi,
  fetchRoleListApi,
  updateRoleApi,
  type RoleFormPayload,
  type RoleRow,
} from '@/api/role'

const list = ref<RoleRow[]>([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const form = reactive<RoleFormPayload & { id?: number }>({
  id: undefined,
  name: '',
  code: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入编码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_-]{1,15}$/i, message: '2-16 位字母数字下划线', trigger: 'blur' },
  ],
}

async function load() {
  loading.value = true
  try {
    list.value = await fetchRoleListApi()
  } finally {
    loading.value = false
  }
}

function openAdd() {
  dialogMode.value = 'add'
  form.id = undefined
  form.name = ''
  form.code = ''
  dialogVisible.value = true
}

function openEdit(row: RoleRow) {
  dialogMode.value = 'edit'
  form.id = row.id
  form.name = row.name
  form.code = row.code
  dialogVisible.value = true
}

async function submitForm() {
  await formRef.value?.validate()
  if (dialogMode.value === 'add') {
    await createRoleApi({ name: form.name, code: form.code })
  } else if (form.id != null) {
    await updateRoleApi(form.id, { name: form.name, code: form.code })
  }
  dialogVisible.value = false
  await load()
}

async function removeRow(row: RoleRow) {
  await ElMessageBox.confirm(`确定删除角色「${row.name}」？`, '提示', { type: 'warning' })
  await deleteRoleApi(row.id)
  await load()
}

onMounted(load)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="head">
        <div class="head-left">
          <el-icon class="icon"><Key /></el-icon>
          <span>角色管理</span>
        </div>
        <el-button v-auth="'system:role:add'" type="primary" size="small" @click="openAdd">
          新增角色
        </el-button>
      </div>
    </template>
    <p class="desc">
      页面级权限：<code>system:role:view</code>；按钮使用 <code>system:role:add</code> 等。数据保存在 mock 服务端内存中，重启 <code>pnpm dev</code> 后会恢复初始数据。
    </p>

    <el-table v-loading="loading" :data="list" border stripe row-key="id">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="code" label="编码" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button v-auth="'system:role:edit'" link type="primary" size="small" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button v-auth="'system:role:delete'" link type="danger" size="small" @click="removeRow(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增角色' : '编辑角色'"
      width="440px"
      destroy-on-close
      @closed="formRef?.resetFields()"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="72px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" maxlength="16" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped lang="scss">
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.head-left > span {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.icon {
  font-size: 20px;
  color: var(--color-primary);
}

.desc {
  margin: 0 0 20px;
  padding: 14px 18px;
  background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-primary-bg) 100%);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-primary);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.desc code {
  font-size: 12px;
}

/* 表格美化 */
:deep(.el-table) {
  border-radius: var(--radius-sm);
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  background: var(--color-bg) !important;
  font-weight: 600;
  color: var(--color-text);
}

:deep(.el-table td.el-table__cell) {
  color: var(--color-text);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--color-bg) !important;
}
</style>
