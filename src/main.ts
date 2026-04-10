import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'

import App from '@/App.vue'
import { authDirective } from '@/directives/auth'
import { pinia } from '@/stores'
import { router } from '@/router'
import { setupRouterGuard } from '@/router/guard'

import '@/style.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
setupRouterGuard(router)
app.use(ElementPlus, { locale: zhCn })
app.directive('auth', authDirective)
app.mount('#app')
