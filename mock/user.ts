import type { MockMethod } from 'vite-plugin-mock'

/** 管理员拥有的全部权限码 */
const ADMIN_PERMISSIONS = [
  'dashboard:view',
  'system:user:view',
  'system:user:add',
  'system:user:edit',
  'system:user:delete',
   'system:role:view',
  'system:role:add',
  'system:role:edit',
  'system:role:delete',
  'vue3:knowledge:view',
]

/** 普通演示账号：工作台 + 知识点练习页 */
const USER_PERMISSIONS = ['dashboard:view', 'vue3:knowledge:view']

function isAdminToken(headers: Record<string, string>) {
  const raw = headers.authorization || headers.Authorization || ''
  return String(raw).includes('admin')
}

/** 与前端约定一致的菜单树（由接口返回，再经前端按权限裁剪并 addRoute） */
const MENU_TREE = [
  {
    path: '/',
    name: 'RootLayout',
    component: 'layout/index',
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: 'dashboard/index',
        meta: {
          title: '工作台',
          icon: 'Odometer',
          permission: 'dashboard:view',
        },
      },
      {
        path: 'vue3-knowledge',
        name: 'Vue3Knowledge',
        component: 'vue3-knowledge/index',
        meta: {
          title: 'Vue3 强大在线编辑器',
          icon: 'Reading',
          permission: 'vue3:knowledge:view',
        },
      },
      {
        path: 'system',
        name: 'SystemModule',
        component: 'layout/ParentView',
        redirect: '/system/user',
        meta: {
          title: '系统管理',
          icon: 'Setting',
        },
        children: [
          {
            path: 'user',
            name: 'SystemUser',
            component: 'system/user/index',
            meta: {
              title: '用户管理',
              icon: 'User',
              permission: 'system:user:view',
            },
          },
          {
            path: 'role',
            name: 'SystemRole',
            component: 'system/role/index',
            meta: {
              title: '角色管理',
              icon: 'Key',
              permission: 'system:role:view',
            },
          },
        ],
      },
    ],
  },
]

export default [
  {
    url: '/api/user/info',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const admin = isAdminToken(headers)
      return {
        code: 0,
        data: {
          name: admin ? '管理员' : '普通用户',
          avatar: '',
          username: admin ? 'admin' : 'user',
          permissions: admin ? ADMIN_PERMISSIONS : USER_PERMISSIONS,
        },
        message: 'ok',
      }
    },
  },
  {
    url: '/api/user/menus',
    method: 'get',
    response: () => ({
      code: 0,
      data: MENU_TREE,
      message: 'ok',
    }),
  },
] as MockMethod[]
