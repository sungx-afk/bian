import Vue from 'vue'
import Router from 'vue-router'

import store from '@/store';

import Home from '@/modules/home/router'
import Space from '@/modules/space/router'

Vue.use(Router)

const router = new Router({
  routes: [
    ...Home,
    ...Space
  ]
})

router.beforeEach((to, from, next) => {
		next();
})

export default router;


