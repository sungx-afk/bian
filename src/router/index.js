import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/modules/home/router'
import Space from '@/modules/space/router'
import User from '@/modules/user/router'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  routes: [
    ...Home,
    ...Space,
    ...User
  ]
})

router.beforeEach((to, from, next) => {
		next();
})

export default router;


