import Vue from 'vue'
import Router from 'vue-router'

import store from '@/store';

import Home from '@/modules/home/router'
import Space from '@/modules/space/router'
import User from '@/modules/user/router'

Vue.use(Router)

const router = new Router({
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


