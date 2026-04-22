<script setup lang="ts">
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

import { fetchRoleListApi, type RoleRow } from '@/api/role'
import {
  batchDeleteUsersApi,
  batchUpdateUserRoleApi,
  createUserApi,
  deleteUserApi,
  fetchUserListApi,
  updateUserApi,
  type SystemUserRow,
  type UserFormPayload,
} from '@/api/system'

const list = ref<SystemUserRow[]>([])
const roleOptions = ref<RoleRow[]>([])
const loading = ref(false)
const tableRef = ref<TableInstance>()

const selectedRows = ref<SystemUserRow[]>([])
const selectionIds = computed(() => selectedRows.value.map((r) => r.id))

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const form = reactive<UserFormPayload & { id?: number }>({
  id: undefined,
  name: '',
  role: '',
})

const batchRoleDialog = ref(false)
const batchRole = ref('')

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

/** 角色名称下拉选项 */
const roleNameOptions = computed(() => roleOptions.value.map((r) => r.name))

async function loadRoles() {
  roleOptions.value = await fetchRoleListApi()
}

async function loadUsers() {
  loading.value = true
  try {
    list.value = await fetchUserListApi()
  } finally {
    loading.value = false
  }
}

function onSelectionChange(rows: SystemUserRow[]) {
  selectedRows.value = rows
}

/** 打开新增 */
function openAdd() {
  dialogMode.value = 'add'
  form.id = undefined
  form.name = ''
  form.role = roleNameOptions.value[0] ?? ''
  dialogVisible.value = true
}

/** 打开编辑 */
function openEdit(row: SystemUserRow) {
  dialogMode.value = 'edit'
  form.id = row.id
  form.name = row.name
  form.role = row.role
  dialogVisible.value = true
}

/** 提交表单 */
async function submitForm() {
  await formRef.value?.validate()
  if (dialogMode.value === 'add') {
    await createUserApi({ name: form.name, role: form.role })
  } else if (form.id != null) {
    await updateUserApi(form.id, { name: form.name, role: form.role })
  }
  dialogVisible.value = false
  await loadUsers()
}

/** 行内删除 */
async function removeRow(row: SystemUserRow) {
  await ElMessageBox.confirm(`确定删除用户「${row.name}」？`, '提示', {
    type: 'warning',
  })
  await deleteUserApi(row.id)
  await loadUsers()
}

/** 批量改角色 */
function openBatchRole() {
  if (!selectionIds.value.length) return
  batchRole.value = roleNameOptions.value[0] ?? ''
  batchRoleDialog.value = true
}

async function submitBatchRole() {
  if (!batchRole.value) return
  await batchUpdateUserRoleApi({ ids: selectionIds.value, role: batchRole.value })
  batchRoleDialog.value = false
  tableRef.value?.clearSelection()
  await loadUsers()
}

/** 批量删除（工具栏） */
async function removeSelected() {
  if (!selectionIds.value.length) return
  await ElMessageBox.confirm(`确定删除选中的 ${selectionIds.value.length} 名用户？`, '提示', {
    type: 'warning',
  })
  await batchDeleteUsersApi({ ids: selectionIds.value })
  tableRef.value?.clearSelection()
  await loadUsers()
}

onMounted(async () => {
  await loadRoles()
  await loadUsers()
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-head">
        <span>用户管理</span>
        <div class="actions">
          <el-button v-auth="'system:user:add'" type="primary" size="small" @click="openAdd">
            新增
          </el-button>
          <el-button
            v-auth="'system:user:edit'"
            type="warning"
            size="small"
            plain
            :disabled="!selectionIds.length"
            @click="openBatchRole"
          >
            批量编辑
          </el-button>
          <el-button
            v-auth="'system:user:delete'"
            type="danger"
            size="small"
            plain
            :disabled="!selectionIds.length"
            @click="removeSelected"
          >
            删除
          </el-button>
        </div>
      </div>
    </template>

    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="list"
      row-key="id"
      border
      stripe
      @selection-change="onSelectionChange"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="role" label="角色" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button v-auth="'system:user:edit'" link type="primary" size="small" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button
            v-auth="'system:user:delete'"
            link
            type="danger"
            size="small"
            @click="removeRow(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增用户' : '编辑用户'"
      width="420px"
      destroy-on-close
      @closed="formRef?.resetFields()"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="72px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="选择角色" style="width: 100%">
            <el-option v-for="n in roleNameOptions" :key="n" :label="n" :value="n" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchRoleDialog" title="批量修改角色" width="400px" destroy-on-close>
      <p class="batch-hint">已选 {{ selectionIds.length }} 人，将统一设为：</p>
      <el-select v-model="batchRole" placeholder="角色" style="width: 100%">
        <el-option v-for="n in roleNameOptions" :key="n" :label="n" :value="n" />
      </el-select>
      <template #footer>
        <el-button @click="batchRoleDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBatchRole">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped lang="scss">
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.card-head > span {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.batch-hint {
  margin: 0 0 16px;
  padding: 12px 16px;
  background: var(--color-primary-bg);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 14px;
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
