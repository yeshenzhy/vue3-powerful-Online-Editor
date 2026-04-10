import type { Directive, DirectiveBinding } from 'vue'

import { useUserStore } from '@/stores/user'

/**
 * 根据权限码控制元素显示（按钮级）；无权限则隐藏
 * @example v-auth="'system:user:add'"
 * @example v-auth="['system:user:add','system:user:edit']" 满足其一即可
 */
function applyAuth(el: HTMLElement, binding: DirectiveBinding<string | string[] | undefined>) {
  const user = useUserStore()
  const val = binding.value
  if (val == null || val === '') {
    el.style.removeProperty('display')
    return
  }
  const codes = Array.isArray(val) ? val : [val]
  const ok = codes.some((c) => user.permissions.includes(c))
  el.style.display = ok ? '' : 'none'
}

export const authDirective: Directive<HTMLElement, string | string[] | undefined> = {
  mounted: applyAuth,
  updated: applyAuth,
}
