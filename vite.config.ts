import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { viteMockServe } from 'vite-plugin-mock'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
    viteMockServe({
      /** mock 文件目录（相对项目根目录） */
      mockPath: 'mock',
      /** 仅开发环境启用 mock */
      enable: command === 'serve',
      /** 是否在控制台输出 mock 匹配日志 */
      logger: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    /** 与 axios baseURL 前缀一致，由 mock 插件接管 */
    port: 5173,
  },
}))
