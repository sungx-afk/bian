import Vue from 'vue'
import Router from 'vue-router'

import store from '@/store';

import Home from '@/modules/home/router'

Vue.use(Router)

const router = new Router({
  routes: [
    ...Home,
  ]
})

router.beforeEach((to, from, next) => {
		next();
})

export default router;


