<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.replace('/')
}
</script>

<template>
  <div class="wrap">
    <el-result icon="warning" title="404" sub-title="页面不存在或无权访问">
      <template #extra>
        <el-button type="primary" @click="goHome">回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped lang="scss">
.wrap {
  padding: 48px 16px;
}
</style>
